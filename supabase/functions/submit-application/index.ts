import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTIFY_TO = "unifycreatoracademy@gmail.com";
const FROM = "UCA Waitlist <onboarding@resend.dev>";

type Body = {
  full_name: string;
  email: string;
  current_focus: string;
  reason: string;
  skill_interest: string;
  commitment: string;
  social_handle?: string | null;
};

function isValid(b: any): b is Body {
  return (
    b &&
    typeof b.full_name === "string" &&
    typeof b.email === "string" &&
    typeof b.current_focus === "string" &&
    typeof b.reason === "string" &&
    typeof b.skill_interest === "string" &&
    typeof b.commitment === "string" &&
    (b.social_handle == null || typeof b.social_handle === "string")
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isValid(body)) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
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
    return new Response(JSON.stringify({ error: "Failed to save application" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fire off Resend notification (don't fail submission if email fails)
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
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
      const r = await fetch("https://api.resend.com/emails", {
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
      if (!r.ok) console.error("Resend error:", r.status, await r.text());
    } catch (e) {
      console.error("Email send failed:", e);
    }
  }

  return new Response(JSON.stringify({ ok: true, id: inserted.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}