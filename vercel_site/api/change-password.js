import { kv } from '@vercel/kv';
import crypto from 'crypto';

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const cookie = req.headers['cookie'] || '';
  const match = cookie.match(/adg_session=([^;]+)/);
  if (!match) return res.status(401).json({ error: 'Non autorisé' });
  try {
    const valid = await kv.get(`adgstream:session:${match[1]}`);
    if (!valid) return res.status(401).json({ error: 'Session expirée' });
  } catch(e) { return res.status(401).json({ error: 'Erreur auth' }); }

  const { password } = req.body || {};
  if (!password || password.length < 6) return res.status(400).json({ error: 'Min 6 caractères' });
  await kv.set('adgstream:password_hash', sha256(password));
  return res.status(200).json({ ok: true });
}
