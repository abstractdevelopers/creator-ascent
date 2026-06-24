import { createClient } from '@supabase/supabase-js';

const NOTIFY_TO = "unifycreatoracademy@gmail.com";
const FROM = "UCA Waitlist <noreply@launchverse.app>";

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  if (!body || !body.full_name || !body.email) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const payload = {
    full_name: body.full_name.trim(),
    email: body.email.trim().toLowerCase(),
    current_focus: body.current_focus,
    reason: body.reason.trim(),
    skill_interest: body.skill_interest,
    commitment: body.commitment,
    social_handle: body.social_handle?.trim() || null,
  };

  const { data: inserted, error } = await supabase
    .from("applications")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    return res.status(500).json({ error: "Failed to save application" });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    try {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0D0707;color:#fff;border-radius:16px;">
          <h2 style="color:#E6A9FF;margin:0 0 16px;font-size:20px;letter-spacing:2px;text-transform:uppercase;">New UCA Application</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#fff;">
            <tr><td style="padding:8px 0;color:#E6A9FF;width:160px;">Name</td><td>${escapeHtml(payload.full_name)}</td></tr>
            <tr><td style="padding:8px 0;color:#E6A9FF;">Email</td><td>${escapeHtml(payload.email)}</td></tr>
            <tr><td style="padding:8px 0;color:#E6A9FF;">Focus</td><td>${escapeHtml(payload.current_focus)}</td></tr>
            <tr><td style="padding:8px 0;color:#E6A9FF;">Skill</td><td>${escapeHtml(payload.skill_interest)}</td></tr>
            <tr><td style="padding:8px 0;color:#E6A9FF;">Commitment</td><td>${escapeHtml(payload.commitment)}</td></tr>
            <tr><td style="padding:8px 0;color:#E6A9FF;">Social</td><td>${escapeHtml(payload.social_handle || "—")}</td></tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:rgba(230,169,255,0.08);border:1px solid rgba(230,169,255,0.3);border-radius:12px;">
            <div style="color:#E6A9FF;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Reason</div>
            <div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(payload.reason)}</div>
          </div>
          <p style="margin-top:24px;font-size:12px;color:#888;">Submitted ${new Date().toISOString()}</p>
        </div>
      `;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [NOTIFY_TO],
          reply_to: payload.email,
          subject: `New UCA Application — ${payload.full_name}`,
          html,
        }),
      });
      if (!response.ok) {
        console.error("Resend error:", response.status, await response.text());
      }
    } catch (e) {
      console.error("Email send failed:", e);
    }
  }

  return res.status(200).json({ ok: true, id: inserted.id });
}
