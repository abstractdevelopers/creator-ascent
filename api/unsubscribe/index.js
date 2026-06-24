import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let token = req.query.token;
  if (!token && req.method === 'POST') {
    token = req.body.token;
  }

  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("applications")
    .update({ unsubscribed: true })
    .eq("unsubscribe_token", token)
    .select("email")
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: "Invalid token" });
  }

  return res.status(200).json({ ok: true, email: data.email });
}
