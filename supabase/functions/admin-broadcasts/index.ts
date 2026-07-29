import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const password = req.headers.get("x-admin-password") ?? "";
  const expected = Deno.env.get("ADMIN_PASSWORD") ?? "";
  if (!expected || password !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const broadcastId = url.searchParams.get("broadcastId");

  if (broadcastId) {
    const [{ data: broadcast, error: bErr }, { data: logs, error: lErr }] = await Promise.all([
      supabase
        .from("email_broadcasts")
        .select("*")
        .eq("id", broadcastId)
        .maybeSingle(),
      supabase
        .from("email_send_log")
        .select("id,email,status,error,created_at,application_id")
        .eq("broadcast_id", broadcastId)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (bErr || lErr) {
      return new Response(
        JSON.stringify({ error: bErr?.message || lErr?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Compute remaining = recipient_ids - unique sent emails
    const sentEmails = new Set(
      (logs ?? [])
        .filter((l) => l.status === "sent")
        .map((l) => l.email.toLowerCase()),
    );

    let remaining: { id: string; email: string; full_name: string }[] = [];
    if (broadcast && Array.isArray(broadcast.recipient_ids) && broadcast.recipient_ids.length) {
      const { data: apps } = await supabase
        .from("applications")
        .select("id,email,full_name,unsubscribed")
        .in("id", broadcast.recipient_ids);
      remaining = (apps ?? [])
        .filter((a: any) => !a.unsubscribed && !sentEmails.has(a.email.toLowerCase()))
        .map((a: any) => ({ id: a.id, email: a.email, full_name: a.full_name }));
    }

    return new Response(
      JSON.stringify({ broadcast, logs: logs ?? [], remaining }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { data, error } = await supabase
    .from("email_broadcasts")
    .select("id,subject,total,sent_count,failed_count,status,created_at,updated_at,completed_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ broadcasts: data ?? [] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});