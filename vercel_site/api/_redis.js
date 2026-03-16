// Helper Redis via Upstash REST API
export async function rGet(key) {
  const {url,token} = getConf();
  const r = await fetch(url+'/get/'+encodeURIComponent(key), {headers:{Authorization:'Bearer '+token}});
  const d = await r.json(); return d.result;
}
export async function rSet(key, val, opts={}) {
  const {url,token} = getConf();
  let path = '/set/'+encodeURIComponent(key)+'/'+encodeURIComponent(JSON.stringify(val));
  if(opts.ex) path += '/EX/'+opts.ex;
  const r = await fetch(url+path, {headers:{Authorization:'Bearer '+token}});
  const d = await r.json(); return d.result;
}
export async function rDel(key) {
  const {url,token} = getConf();
  const r = await fetch(url+'/del/'+encodeURIComponent(key), {headers:{Authorization:'Bearer '+token}});
  return (await r.json()).result;
}
function getConf() {
  // KV_REST_API_URL et KV_REST_API_TOKEN sont injectés par Vercel KV
  // REDIS_URL format: rediss://:TOKEN@host:port (Upstash)
  const restUrl = process.env.KV_REST_API_URL;
  const restToken = process.env.KV_REST_API_TOKEN;
  if(restUrl && restToken) return {url:restUrl, token:restToken};
  // Fallback: parser REDIS_URL
  const raw = process.env.REDIS_URL || '';
  const m = raw.match(/rediss?:\/\/:([^@]+)@([^:]+):?(\d*)/);
  if(m) return {url:'https://'+m[2], token:m[1]};
  throw new Error('No Redis config found');
}