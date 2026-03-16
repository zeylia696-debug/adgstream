import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const cookie = req.headers['cookie'] || '';
  const match = cookie.match(/adg_session=([^;]+)/);
  const authed = match ? !!(await kv.get(`adgstream:session:${match[1]}`).catch(()=>null)) : false;
  if (!authed) return res.status(401).json({ error: 'Non autorisé' });

  if (req.method === 'GET') {
    const cfg = await kv.get('adgstream:twitch_config') || {};
    return res.status(200).json({ client_id: cfg.client_id || '', client_secret_set: !!cfg.client_secret });
  }
  if (req.method === 'POST') {
    const cur = await kv.get('adgstream:twitch_config') || {};
    const updated = { ...cur, ...req.body };
    await kv.set('adgstream:twitch_config', updated);
    await kv.del('adgstream:twitch_token').catch(()=>{});
    return res.status(200).json({ ok: true });
  }
  res.status(405).end();
}
