import crypto from 'crypto';
function sha256(s){return crypto.createHash('sha256').update(s).digest('hex')}
async function getKV(){const{createClient}=await import('@vercel/kv');return createClient({url:process.env.STORAGE_URL||process.env.KV_REST_API_URL,token:process.env.STORAGE_TOKEN||process.env.KV_REST_API_TOKEN})}
async function isAuthed(req){const c=req.headers['cookie']||'';const m=c.match(/adg_session=([^;]+)/);if(!m)return false;try{const kv=await getKV();return !!(await kv.get('adgstream:session:'+m[1]))}catch(e){return false}}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method!=='POST')return res.status(405).end();
  if(!(await isAuthed(req)))return res.status(401).json({error:'Non autorise'});
  const{password}=req.body||{};
  if(!password||password.length<6)return res.status(400).json({error:'Min 6 caracteres'});
  try{const kv=await getKV();await kv.set('adgstream:password_hash',sha256(password));return res.status(200).json({ok:true})}
  catch(e){return res.status(500).json({error:e.message})}
}