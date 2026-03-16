async function getKV() {
    const { createClient } = await import('@vercel/kv');
    const url = process.env.STORAGE_URL || process.env.KV_REST_API_URL;
    const token = process.env.STORAGE_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('KV not configured');
    return createClient({ url, token });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const cookie = req.headers['cookie'] || '';
    const match = cookie.match(/adg_session=([^;]+)/);
    if (!match) return res.status(200).json({ authed: false });
    try {
          const kv = await getKV();
          const valid = await kv.get(`adgstream:session:${match[1]}`);
          return res.status(200).json({ authed: !!valid });
    } catch(e) {
          return res.status(200).json({ authed: false });
    }
}
