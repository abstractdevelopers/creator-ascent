import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  let token = url.searchParams.get("token");
  if (!token && req.method === "POST") {
    try {
      const b = await req.json();
      token = b.token;
    } catch { /* ignore */ }
  }

  // Tokens are interpolated into a PostgREST filter, so only ever accept a uuid.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!token || !UUID_RE.test(token)) {
    return new Response(JSON.stringify({ error: "Missing or invalid token" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Links mailed before duplicate rows were merged still carry the retired
  // token, so fall back to the tokens folded into the surviving row.
  let { data, error } = await supabase
    .from("applications")
    .update({ unsubscribed: true })
    .eq("unsubscribe_token", token)
    .select("email")
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!data) {
    ({ data, error } = await supabase
      .from("applications")
      .update({ unsubscribed: true })
      .contains("superseded_unsubscribe_tokens", [token])
      .select("email")
      .maybeSingle());

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (!data) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, email: data.email }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});