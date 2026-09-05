import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIME_BUDGET_MS = 45_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const secret = req.headers.get("x-cron-secret") ?? "";
  const { data: valid } = await supabase.rpc("verify_cron_secret", { _secret: secret });
  if (valid !== true) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const startedAt = Date.now();

  // Promote any scheduled broadcast whose time has arrived.
  await supabase
    .from("email_broadcasts")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString());

  const { data: pending } = await supabase
    .from("email_broadcasts")
    .select("id")
    .eq("status", "in_progress")
    .order("created_at", { ascending: true })
    .limit(1);

  const results: Record<string, unknown>[] = [];

  for (const b of pending ?? []) {
    while (Date.now() - startedAt < TIME_BUDGET_MS) {
      const { data: json, error: invokeError } = await supabase.functions.invoke(
        "send-broadcast",
        {
          body: { broadcastId: b.id, maxBatch: 60 },
        },
      );
      if (invokeError) {
        const context = await invokeError.context?.text?.().catch(() => "");
        console.error("worker send failed", b.id, invokeError.message, context);
        results.push({ broadcastId: b.id, error: invokeError.message });
        break;
      }
      results.push({ broadcastId: b.id, ...json });
      if (json.done || json.waiting || json.remaining > 0) break;
    }
  }

  await supabase.rpc("drain_broadcast_worker");

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
