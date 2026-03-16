import { kv } from '@vercel/kv';

const CACHE_TTL = 5 * 60 * 1000;

function fmtFollowers(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'M';
  if (n >= 1000)    return (n/1000).toFixed(1).replace('.0','') + 'K';
  return String(n);
}

async function getToken(clientId, clientSecret) {
  const cached = await kv.get('adgstream:twitch_token');
  if (cached && Date.now() < cached.expires_at - 60000) return cached.access_token;
  const r = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
  });
  const d = await r.json();
  const tokenData = { access_token: d.access_token, expires_at: Date.now() + d.expires_in * 1000 };
  await kv.set('adgstream:twitch_token', tokenData, { ex: d.expires_in - 60 });
  return d.access_token;
}

async function twitchGet(url, clientId, token) {
  const r = await fetch(url, { headers: { 'Client-ID': clientId, 'Authorization': `Bearer ${token}` } });
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const channel = req.query.channel || 'adgstream';
  const cacheKey = `adgstream:twitch_cache_${channel}`;

  try {
    const cached = await kv.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return res.status(200).json(cached.data);
  } catch(e) {}

  const cfg = await kv.get('adgstream:twitch_config') || {};
  const { client_id: clientId, client_secret: clientSecret } = cfg;
  if (!clientId || !clientSecret) {
    return res.status(200).json({ followers:'—', is_live:false, viewer_count:0, game_name:'', clips:[], error:'API non configurée' });
  }

  try {
    const token = await getToken(clientId, clientSecret);
    const users = await twitchGet(`https://api.twitch.tv/helix/users?login=${channel}`, clientId, token);
    if (!users.data?.length) throw new Error('User not found');
    const userId = users.data[0].id;

    const [followsData, streamsData, clipsData] = await Promise.all([
      twitchGet(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`, clientId, token),
      twitchGet(`https://api.twitch.tv/helix/streams?user_login=${channel}`, clientId, token),
      twitchGet(`https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=6`, clientId, token),
    ]);

    const stream = streamsData.data?.[0] || null;
    const result = {
      followers: fmtFollowers(followsData.total || 0),
      followers_raw: followsData.total || 0,
      is_live: !!stream,
      viewer_count: stream?.viewer_count || 0,
      game_name: stream?.game_name || '',
      clips: (clipsData.data || []).map(c => ({
        id: c.id, title: c.title, url: c.url,
        thumbnail: c.thumbnail_url?.replace('{width}','480').replace('{height}','270') || '',
        views: c.view_count, duration: Math.round(c.duration) + 's',
      })),
    };

    await kv.set(cacheKey, { timestamp: Date.now(), data: result }, { ex: 300 });
    return res.status(200).json(result);
  } catch(e) {
    return res.status(200).json({ followers:'—', is_live:false, viewer_count:0, game_name:'', clips:[], error: e.message });
  }
}
