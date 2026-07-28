Deno.serve(async (req) => {
  const key = Deno.env.get("SENDBYTE_API_KEY");
  if (!key) return new Response(JSON.stringify({ error: "no key" }), { status: 500 });
  const url = new URL(req.url);
  const to = url.searchParams.get("to") || "delivered@resend.dev";
  const res = await fetch("https://api.sendbyte.africa/v1/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "UCA Test <uca@launchverse.site>",
      to,
      subject: "SendByte switchover test",
      html: "<p>SendByte pipeline live from UCA edge function.</p>",
      text: "SendByte pipeline live from UCA edge function.",
    }),
  });
  const body = await res.text();
  return new Response(JSON.stringify({ status: res.status, body }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});