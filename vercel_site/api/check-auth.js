async function getKV(){const{createClient}=await import('@vercel/kv');return createClient({url:process.env.STORAGE_URL||process.env.KV_REST_API_URL,token:process.env.STORAGE_TOKEN||process.env.KV_REST_API_TOKEN})}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  const cookie=req.headers['cookie']||'';
  const match=cookie.match(/adg_session=([^;]+)/);
  if(!match)return res.status(200).json({authed:false});
  try{const kv=await getKV();const v=await kv.get('adgstream:session:'+match[1]);return res.status(200).json({authed:!!v})}
  catch(e){return res.status(200).json({authed:false})}
}