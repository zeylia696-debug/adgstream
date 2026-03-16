import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const cookie = req.headers['cookie'] || '';
  const match = cookie.match(/adg_session=([^;]+)/);
  if (!match) return res.status(200).json({ authed: false });
  try {
    const valid = await kv.get(`adgstream:session:${match[1]}`);
    return res.status(200).json({ authed: !!valid });
  } catch(e) {
    return res.status(200).json({ authed: false });
  }
}
