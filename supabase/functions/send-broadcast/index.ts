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

  const {
    subject,
    body,
    headerImageUrl,
    footerImageUrl,
    testEmail,
    recipientIds,
    broadcastId,
    maxBatch,
  } = payload as {
    subject?: string;
    body?: string;
    headerImageUrl?: string;
    footerImageUrl?: string;
    testEmail?: string;
    recipientIds?: string[];
    broadcastId?: string;
    maxBatch?: number;
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ---- TEST send: no broadcast record, no logging ----
  if (testEmail) {
    if (!subject || !body) {
      return new Response(JSON.stringify({ error: "subject and body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { first, last } = splitName("Test User");
    const unsubscribeUrl = `${PUBLIC_ORIGIN}/unsubscribe?token=preview`;
    const html = render({ bodyText: body, first, last, headerImageUrl, footerImageUrl, unsubscribeUrl });
    try {
      await sendbyteRequest(sendbyteKey, {
        to: [testEmail],
        subject: mergeTags(subject, first, last),
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ---- BROADCAST send (new or resume) ----
  let broadcast: {
    id: string;
    subject: string;
    body: string;
    header_image_url: string | null;
    footer_image_url: string | null;
    recipient_ids: string[];
  };

  if (broadcastId) {
    const { data, error } = await supabase
      .from("email_broadcasts")
      .select("id,subject,body,header_image_url,footer_image_url,recipient_ids")
      .eq("id", broadcastId)
      .maybeSingle();
    if (error || !data) {
      return new Response(JSON.stringify({ error: "Broadcast not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    broadcast = data as typeof broadcast;
  } else {
    if (!subject || !body) {
      return new Response(JSON.stringify({ error: "subject and body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients selected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data, error } = await supabase
      .from("email_broadcasts")
      .insert({
        subject,
        body,
        header_image_url: headerImageUrl ?? null,
        footer_image_url: footerImageUrl ?? null,
        recipient_ids: recipientIds,
        total: recipientIds.length,
        status: "in_progress",
      })
      .select("id,subject,body,header_image_url,footer_image_url,recipient_ids")
      .single();
    if (error || !data) {
      return new Response(JSON.stringify({ error: error?.message || "Insert failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    broadcast = data as typeof broadcast;
  }

  // Load recipients
  const { data: apps, error: appsErr } = await supabase
    .from("applications")
    .select("id,full_name,email,unsubscribe_token,unsubscribed")
    .in("id", broadcast.recipient_ids);
  if (appsErr) {
    return new Response(JSON.stringify({ error: appsErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Already-sent lookup (dedupe by lowercased email)
  const { data: sentLogs } = await supabase
    .from("email_send_log")
    .select("email")
    .eq("broadcast_id", broadcast.id)
    .eq("status", "sent");
  const alreadySent = new Set((sentLogs ?? []).map((r) => r.email.toLowerCase()));

  const seen = new Set<string>();
  const queue: Recipient[] = [];
  for (const a of (apps ?? []) as (Recipient & { unsubscribed?: boolean })[]) {
    const key = a.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (a.unsubscribed) continue;
    if (alreadySent.has(key)) continue;
    queue.push(a);
  }

  const limit = Math.max(1, Math.min(maxBatch ?? 80, 150));
  const batch = queue.slice(0, limit);
  const remaining = queue.length - batch.length;

  let sentThisBatch = 0;
  let failedThisBatch = 0;

  for (const r of batch) {
    const { first, last } = splitName(r.full_name);
    const unsubscribeUrl = `${PUBLIC_ORIGIN}/unsubscribe?token=${r.unsubscribe_token}`;
    const html = render({
      bodyText: broadcast.body,
      first,
      last,
      headerImageUrl: broadcast.header_image_url ?? undefined,
      footerImageUrl: broadcast.footer_image_url ?? undefined,
      unsubscribeUrl,
    });
    const mergedSubject = mergeTags(broadcast.subject, first, last);

    let status: "sent" | "failed" = "sent";
    let errorMessage: string | null = null;
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
      sentThisBatch++;
    } catch (e) {
      status = "failed";
      errorMessage = (e as Error).message;
      failedThisBatch++;
      console.error(`SendByte error for ${r.email}:`, errorMessage);
    }

    await supabase.from("email_send_log").insert({
      broadcast_id: broadcast.id,
      application_id: r.id ?? null,
      email: r.email,
      status,
      error: errorMessage,
    });

    if (batch.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 650));
    }
  }

  // Recount from log for accuracy across resumes
  const { count: totalSent } = await supabase
    .from("email_send_log")
    .select("*", { count: "exact", head: true })
    .eq("broadcast_id", broadcast.id)
    .eq("status", "sent");
  const { count: totalFailed } = await supabase
    .from("email_send_log")
    .select("*", { count: "exact", head: true })
    .eq("broadcast_id", broadcast.id)
    .eq("status", "failed");

  const done = remaining === 0;
  await supabase
    .from("email_broadcasts")
    .update({
      sent_count: totalSent ?? 0,
      failed_count: totalFailed ?? 0,
      status: done ? "completed" : "in_progress",
      completed_at: done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", broadcast.id);

  return new Response(
    JSON.stringify({
      broadcastId: broadcast.id,
      batchProcessed: batch.length,
      batchSent: sentThisBatch,
      batchFailed: failedThisBatch,
      remaining,
      done,
      totalSent: totalSent ?? 0,
      totalFailed: totalFailed ?? 0,
      total: broadcast.recipient_ids.length,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
