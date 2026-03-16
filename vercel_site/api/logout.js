import {rDel} from './_redis.js';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method!=='POST')return res.status(405).end();
  const c=req.headers['cookie']||'';
  const m=c.match(/adg_session=([^;]+)/);
  if(m){try{await rDel('adgstream:session:'+m[1])}catch(e){}}
  res.setHeader('Set-Cookie','adg_session=; Path=/; Max-Age=0');
  return res.status(200).json({ok:true});
}