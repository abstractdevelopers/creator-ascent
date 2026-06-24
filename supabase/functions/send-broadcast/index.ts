import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM = "Unify Creator Academy <noreply@launchverse.app>";
const BRAND_BG = "#0D0707";
const BRAND_ACCENT = "#E6A9FF";

function splitName(full: string) {
  const parts = (full || "").trim().split(/\s+/);
  return { first: parts[0] || "there", last: parts.slice(1).join(" ") };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));
}

function render(opts: {
  bodyText: string;
  first: string;
  last: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
  unsubscribeUrl: string;
}) {
  const merged = opts.bodyText
    .replaceAll("{{first_name}}", opts.first)
    .replaceAll("{{last_name}}", opts.last)
    .replaceAll("{{full_name}}", `${opts.first} ${opts.last}`.trim());

  const bodyHtml = escapeHtml(merged)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.7;color:#f5e9ff;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#16090F;border:1px solid rgba(230,169,255,0.18);border-radius:18px;overflow:hidden;">
        ${opts.headerImageUrl ? `<tr><td><img src="${opts.headerImageUrl}" alt="" style="display:block;width:100%;height:auto;"/></td></tr>` : ""}
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:${BRAND_ACCENT};">Unify Creator Academy</div>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;font-size:15px;color:#f5e9ff;">${bodyHtml}</td></tr>
        ${opts.footerImageUrl ? `<tr><td><img src="${opts.footerImageUrl}" alt="" style="display:block;width:100%;height:auto;"/></td></tr>` : ""}
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(230,169,255,0.12);font-size:12px;color:rgba(245,233,255,0.55);text-align:center;">
          You're receiving this because you applied to Unify Creator Academy.<br/>
          <a href="${opts.unsubscribeUrl}" style="color:${BRAND_ACCENT};text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

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

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("RESEND_API_KEY not set in environment");
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    // Basic connectivity check
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      const data = await res.json();
      return new Response(JSON.stringify({ status: "ok", domains: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { subject, body, headerImageUrl, footerImageUrl, testEmail, recipientIds } = payload as {
    subject?: string;
    body?: string;
    headerImageUrl?: string;
    footerImageUrl?: string;
    testEmail?: string;
    recipientIds?: string[];
  };

  if (!subject || !body) {
    return new Response(JSON.stringify({ error: "subject and body required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const siteOrigin = req.headers.get("origin") || "https://uca.launchverse.online";

  // Build recipient list
  type Recipient = { full_name: string; email: string; unsubscribe_token: string };
  let recipients: Recipient[];

  if (testEmail) {
    recipients = [{ full_name: "Test User", email: testEmail, unsubscribe_token: "preview" }];
  } else if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
    const { data, error } = await supabase
      .from("applications")
      .select("full_name,email,unsubscribe_token")
      .in("id", recipientIds)
      .eq("unsubscribed", false);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    recipients = data || [];
  } else {
    const { data, error } = await supabase
      .from("applications")
      .select("full_name,email,unsubscribe_token")
      .eq("unsubscribed", false);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // dedupe by email
    const seen = new Set<string>();
    recipients = (data || []).filter((r) => {
      const k = r.email.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  let sent = 0;
  const failed: { email: string; error: string }[] = [];

  for (const r of recipients) {
    const { first, last } = splitName(r.full_name);
    const unsubscribeUrl = `${siteOrigin}/unsubscribe?token=${r.unsubscribe_token}`;
    const html = render({
      bodyText: body,
      first,
      last,
      headerImageUrl,
      footerImageUrl,
      unsubscribeUrl,
    });
    const mergedSubject = subject
      .replaceAll("{{first_name}}", first)
      .replaceAll("{{last_name}}", last);

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [r.email],
          subject: mergedSubject,
          html,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error(`Resend error for ${r.email}:`, t);
        failed.push({ email: r.email, error: t.slice(0, 500) });
      } else {
        sent++;
      }
    } catch (e) {
      failed.push({ email: r.email, error: (e as Error).message });
    }
    // small delay to stay under Resend's 2 req/s default
    await new Promise((r) => setTimeout(r, 600));
  }

  return new Response(
    JSON.stringify({ total: recipients.length, sent, failed_count: failed.length, failed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
