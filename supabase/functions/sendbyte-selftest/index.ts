const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const key = Deno.env.get("SENDBYTE_API_KEY");
  const results: Record<string, unknown> = {};
  if (!key) {
    return new Response(JSON.stringify({ error: "no key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const to = url.searchParams.get("to") ?? "westlourd@gmail.com";

  // 1. connectivity / auth probe
  try {
    const r = await fetch("https://api.sendbyte.africa/v1/emails?limit=1", {
      headers: { Authorization: `Bearer ${key}` },
    });
    results.list = { status: r.status, body: (await r.text()).slice(0, 400) };
  } catch (e) {
    results.list = { error: (e as Error).message };
  }

  // 2. domains
  try {
    const r = await fetch("https://api.sendbyte.africa/v1/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    results.domains = { status: r.status, body: (await r.text()).slice(0, 1500) };
  } catch (e) {
    results.domains = { error: (e as Error).message };
  }

  // 3. real send from the new address
  try {
    const r = await fetch("https://api.sendbyte.africa/v1/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Unify Creator Academy <uca@launchverse.space>",
        reply_to: "uca@launchverse.space",
        to: [to],
        subject: "UCA sender verification test",
        html: "<p>Test send from uca@launchverse.space — if you got this, the new sender domain works.</p>",
        text: "Test send from uca@launchverse.space",
      }),
    });
    results.send = { status: r.status, body: (await r.text()).slice(0, 800) };
  } catch (e) {
    results.send = { error: (e as Error).message };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
