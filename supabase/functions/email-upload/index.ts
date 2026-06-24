import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  try {
    const { fileBase64, fileName, contentType } = await req.json();
    if (!fileBase64 || !fileName) {
      return new Response(JSON.stringify({ error: "Missing fileBase64 or fileName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
    const ext = (fileName.split(".").pop() || "png").toLowerCase();
    const path = `broadcasts/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: upErr } = await supabase.storage
      .from("email-assets")
      .upload(path, bytes, { contentType: contentType || "image/png", upsert: false });
    if (upErr) throw upErr;

    // 5-year signed URL for email use
    const { data: signed, error: sErr } = await supabase.storage
      .from("email-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (sErr) throw sErr;

    return new Response(JSON.stringify({ url: signed.signedUrl, path }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});