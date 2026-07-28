import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const FROM_ADDRESS = "Unify Creator Academy <uca@launchverse.site>";
const PUBLIC_ORIGIN = "https://uca.launchverse.site";
const SENDBYTE_ENDPOINT = "https://api.sendbyte.africa/v1/emails";
const BRAND_BG = "#0D0707";
const BRAND_ACCENT = "#E6A9FF";

type Recipient = {
  id?: string;
  full_name: string;
  email: string;
  unsubscribe_token: string;
};

function splitName(full: string) {
  const parts = (full || "").trim().split(/\s+/);
  return { first: parts[0] || "there", last: parts.slice(1).join(" ") };
}

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));
}

function mergeTags(text: string, first: string, last: string) {
  return text
    .replaceAll("{{first_name}}", first)
    .replaceAll("{{last_name}}", last)
    .replaceAll("{{full_name}}", `${first} ${last}`.trim());
}

function renderBodyContent(mergedText: string) {
  const imagePattern = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/i;

  return mergedText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const match = block.match(imagePattern);
      if (match) {
        const alt = escapeHtml(match[1] || "UCA image");
        const url = escapeHtml(match[2]);
        return `<div style="margin:24px 0;text-align:center;"><img src="${url}" alt="${alt}" style="display:block;width:100%;max-width:536px;height:auto;margin:0 auto;border-radius:16px;border:1px solid rgba(230,169,255,0.14);" /></div>`;
      }

      return `<p style="margin:0 0 16px;line-height:1.7;color:#f5e9ff;font-size:15px;">${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");
}

function render(opts: {
  bodyText: string;
  first: string;
  last: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
  unsubscribeUrl: string;
}) {
  const merged = mergeTags(opts.bodyText, opts.first, opts.last);
  const bodyHtml = renderBodyContent(merged);
  const headerImage = opts.headerImageUrl
    ? `<tr><td style="line-height:0;"><img src="${escapeHtml(opts.headerImageUrl)}" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" /></td></tr>`
    : "";
  const footerImage = opts.footerImageUrl
    ? `<tr><td style="line-height:0;"><img src="${escapeHtml(opts.footerImageUrl)}" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" /></td></tr>`
    : "";

  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head><body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${BRAND_BG};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#16090F;border:1px solid rgba(230,169,255,0.18);border-radius:18px;overflow:hidden;">
        ${headerImage}
        <tr><td style="padding:30px 24px 8px;">
          <div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND_ACCENT};">Unify Creator Academy</div>
        </td></tr>
        <tr><td style="padding:14px 24px 30px;font-size:15px;color:#f5e9ff;">${bodyHtml}</td></tr>
        ${footerImage}
        <tr><td style="padding:20px 24px;border-top:1px solid rgba(230,169,255,0.12);font-size:12px;line-height:1.6;color:rgba(245,233,255,0.58);text-align:center;">
          You're receiving this because you applied to Unify Creator Academy.<br/>
          <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:${BRAND_ACCENT};text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

async function sendbyteRequest(apiKey: string, payload: Record<string, unknown>) {
  const res = await fetch(SENDBYTE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, ...payload }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || text;
    } catch {
      // keep raw text
    }
    throw new Error(`SendByte ${res.status}: ${message}`.slice(0, 500));
  }

  return res.json();
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

  const sendbyteKey = Deno.env.get("SENDBYTE_API_KEY");
  if (!sendbyteKey) {
    console.error("SENDBYTE_API_KEY not set in environment");
    return new Response(JSON.stringify({ error: "SENDBYTE_API_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    try {
      // Ping SendByte with a HEAD-style probe by listing recent emails.
      const res = await fetch("https://api.sendbyte.africa/v1/emails?limit=1", {
        headers: { Authorization: `Bearer ${sendbyteKey}` },
      });
      const bodyText = await res.text();
      return new Response(
        JSON.stringify({
          status: res.ok ? "ok" : "error",
          httpStatus: res.status,
          from: FROM_ADDRESS,
          response: bodyText.slice(0, 500),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

  let recipients: Recipient[];

  if (testEmail) {
    recipients = [{ full_name: "Test User", email: testEmail, unsubscribe_token: "preview" }];
  } else {
    let query = supabase
      .from("applications")
      .select("id,full_name,email,unsubscribe_token")
      .eq("unsubscribed", false);

    if (Array.isArray(recipientIds) && recipientIds.length > 0) {
      query = query.in("id", recipientIds);
    }

    const { data, error } = await query;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const seen = new Set<string>();
    recipients = ((data || []) as Recipient[]).filter((r) => {
      const k = r.email.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  if (recipients.length === 0) {
    return new Response(JSON.stringify({ error: "No recipients selected" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  const failed: { email: string; error: string }[] = [];

  for (const r of recipients) {
    const { first, last } = splitName(r.full_name);
    const unsubscribeUrl = `${PUBLIC_ORIGIN}/unsubscribe?token=${r.unsubscribe_token}`;
    const html = render({
      bodyText: body,
      first,
      last,
      headerImageUrl,
      footerImageUrl,
      unsubscribeUrl,
    });
    const mergedSubject = mergeTags(subject, first, last);

    try {
      await sendbyteRequest(sendbyteKey, {
        to: [r.email],
        subject: mergedSubject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      sent++;
    } catch (e) {
      const message = (e as Error).message;
      console.error(`SendByte error for ${r.email}:`, message);
      failed.push({ email: r.email, error: message });
    }

    if (recipients.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 650));
    }
  }

  const status = sent === 0 && failed.length > 0 ? 502 : 200;
  return new Response(
    JSON.stringify({ total: recipients.length, sent, failed_count: failed.length, failed }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
