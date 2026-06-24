import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileBase64, fileName, contentType } = req.body;
    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: "Missing fileBase64 or fileName" });
    }

    const bytes = Buffer.from(fileBase64, 'base64');
    const ext = (fileName.split(".").pop() || "png").toLowerCase();
    const path = `broadcasts/${Date.now()}-${randomUUID()}.${ext}`;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: upErr } = await supabase.storage
      .from("email-assets")
      .upload(path, bytes, { contentType: contentType || "image/png", upsert: false });
    if (upErr) throw upErr;

    const { data: signed, error: sErr } = await supabase.storage
      .from("email-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (sErr) throw sErr;

    return res.status(200).json({ url: signed.signedUrl, path });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
