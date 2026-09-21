import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TIME_BUDGET_MS = 45_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

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
      // Call with plain fetch rather than supabase.functions.invoke. invoke
      // puts the key only in `apikey` and reserves `Authorization` for a user
      // JWT, so with new-format keys the server sees no Bearer token and
      // rejects this as unauthorized. Both headers below carry the same
      // injected service key that send-broadcast compares against.
      let json: { done?: boolean; waiting?: boolean; remaining?: number } = {};
      try {
        const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-broadcast`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ broadcastId: b.id, maxBatch: 60 }),
        });
        const text = await res.text();
        if (!res.ok) {
          console.error("worker send failed", b.id, res.status, text.slice(0, 300));
          results.push({ broadcastId: b.id, error: `HTTP ${res.status}: ${text.slice(0, 200)}` });
          break;
        }
        json = JSON.parse(text);
      } catch (e) {
        console.error("worker send threw", b.id, (e as Error).message);
        results.push({ broadcastId: b.id, error: (e as Error).message });
        break;
      }

      results.push({ broadcastId: b.id, ...json });
      if (json.done || json.waiting || (json.remaining ?? 0) > 0) break;
    }
  }

  await supabase.rpc("drain_broadcast_worker");

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
