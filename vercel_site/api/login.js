import { kv } from '@vercel/kv';
import crypto from 'crypto';

const DEFAULT_HASH = 'a479b04c72d2bd957588dfebb960049bebf1258582ceedd1a3894537e2fa504d'; // adgstream2025

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function randToken() { return crypto.randomBytes(32).toString('hex'); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Mot de passe requis' });

  try {
    const storedHash = await kv.get('adgstream:password_hash') || DEFAULT_HASH;
    const inputHash = sha256(password);
    if (inputHash !== storedHash) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = randToken();
    await kv.set(`adgstream:session:${token}`, '1', { ex: 604800 }); // 7 days
    res.setHeader('Set-Cookie', `adg_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
