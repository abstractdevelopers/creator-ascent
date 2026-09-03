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

  const adminPassword = Deno.env.get("ADMIN_PASSWORD") ?? "";
  const fnBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
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
    .limit(3);

  const results: Record<string, unknown>[] = [];

  for (const b of pending ?? []) {
    while (Date.now() - startedAt < TIME_BUDGET_MS) {
      const res = await fetch(`${fnBase}/send-broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ broadcastId: b.id, maxBatch: 60 }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("worker send failed", b.id, json);
        results.push({ broadcastId: b.id, error: json.error ?? res.status });
        break;
      }
      results.push({ broadcastId: b.id, ...json });
      if (json.done || json.waiting) break;
    }
  }

  await supabase.rpc("drain_broadcast_worker");

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
