async function getKV(){const{createClient}=await import('@vercel/kv');return createClient({url:process.env.STORAGE_URL||process.env.KV_REST_API_URL,token:process.env.STORAGE_TOKEN||process.env.KV_REST_API_TOKEN})}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method!=='POST')return res.status(405).end();
  const cookie=req.headers['cookie']||'';
  const match=cookie.match(/adg_session=([^;]+)/);
  if(match){try{const kv=await getKV();await kv.del('adgstream:session:'+match[1])}catch(e){}}
  res.setHeader('Set-Cookie','adg_session=; Path=/; Max-Age=0');
  return res.status(200).json({ok:true});
}