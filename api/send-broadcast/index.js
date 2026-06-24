import { createClient } from '@supabase/supabase-js';

const FROM = "Unify Creator Academy <noreply@launchverse.app>";
const BRAND_BG = "#0D0707";
const BRAND_ACCENT = "#E6A9FF";

function splitName(full) {
  const parts = (full || "").trim().split(/\s+/);
  return { first: parts[0] || "there", last: parts.slice(1).join(" ") };
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function render(opts) {
  const merged = opts.bodyText
    .replaceAll("{{first_name}}", opts.first)
    .replaceAll("{{last_name}}", opts.last)
    .replaceAll("{{full_name}}", `${opts.first} ${opts.last}`.trim());

  const bodyHtml = escapeHtml(merged)
    .split(/\n{2,}/)
    .map((p) => {
      const processed = p.replaceAll(/\[\[img:(.*?)\]\]/g, (_, url) => {
        return `</p><img src="${url}" alt="" style="display:block;width:100%;max-width:100%;height:auto;margin:24px 0;border-radius:12px;"/><p style="margin:0 0 16px;line-height:1.7;color:#f5e9ff;">`;
      });
      return `<p style="margin:0 0 16px;line-height:1.7;color:#f5e9ff;">${processed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("")
    .replaceAll("<p style=\"margin:0 0 16px;line-height:1.7;color:#f5e9ff;\"></p>", "");

  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head><body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#16090F;border:1px solid rgba(230,169,255,0.18);border-radius:18px;overflow:hidden;">
        ${opts.headerImageUrl ? `<tr><td><img src="${opts.headerImageUrl}" alt="" style="display:block;width:100%;max-width:100%;height:auto;"/></td></tr>` : ""}
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:${BRAND_ACCENT};">Unify Creator Academy</div>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;font-size:15px;color:#f5e9ff;">${bodyHtml}</td></tr>
        ${opts.footerImageUrl ? `<tr><td><img src="${opts.footerImageUrl}" alt="" style="display:block;width:100%;max-width:100%;height:auto;"/></td></tr>` : ""}
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(230,169,255,0.12);font-size:12px;color:rgba(245,233,255,0.55);text-align:center;">
          You're receiving this because you applied to Unify Creator Academy.<br/>
          <a href="${opts.unsubscribeUrl}" style="color:${BRAND_ACCENT};text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const password = req.headers['x-admin-password'] || '';
  const expected = process.env.ADMIN_PASSWORD || '';

  if (!expected || password !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: "RESEND_API_KEY not set" });
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      const data = await response.json();
      return res.status(200).json({ status: "ok", domains: data });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, body, headerImageUrl, footerImageUrl, testEmail, recipientIds } = req.body;

  if (!subject || !body) {
    return res.status(400).json({ error: "subject and body required" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const siteOrigin = req.headers.origin || "https://uca.launchverse.online";

  let recipients;
  if (testEmail) {
    recipients = [{ full_name: "Test User", email: testEmail, unsubscribe_token: "preview" }];
  } else if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
    const { data, error } = await supabase
      .from("applications")
      .select("full_name,email,unsubscribe_token")
      .in("id", recipientIds)
      .eq("unsubscribed", false);
    if (error) return res.status(500).json({ error: error.message });
    recipients = data || [];
  } else {
    const { data, error } = await supabase
      .from("applications")
      .select("full_name,email,unsubscribe_token")
      .eq("unsubscribed", false);
    if (error) return res.status(500).json({ error: error.message });

    const seen = new Set();
    recipients = (data || []).filter((r) => {
      const k = r.email.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  let sent = 0;
  const failed = [];

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
      const response = await fetch("https://api.resend.com/emails", {
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
      if (!response.ok) {
        const t = await response.text();
        failed.push({ email: r.email, error: t.slice(0, 500) });
      } else {
        sent++;
      }
    } catch (e) {
      failed.push({ email: r.email, error: e.message });
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  return res.status(200).json({ total: recipients.length, sent, failed_count: failed.length, failed });
}
