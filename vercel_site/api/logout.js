import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();
  const cookie = req.headers['cookie'] || '';
  const match = cookie.match(/adg_session=([^;]+)/);
  if (match) {
    try { await kv.del(`adgstream:session:${match[1]}`); } catch(e) {}
  }
  res.setHeader('Set-Cookie', 'adg_session=; Path=/; Max-Age=0');
  return res.status(200).json({ ok: true });
}
