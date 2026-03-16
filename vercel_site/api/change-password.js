import {rGet,rSet} from './_redis.js';
import crypto from 'crypto';
const sha=(s)=>crypto.createHash('sha256').update(s).digest('hex');
async function authed(req){const c=req.headers['cookie']||'';const m=c.match(/adg_session=([^;]+)/);if(!m)return false;try{return !!(await rGet('adgstream:session:'+m[1]))}catch(e){return false}}
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method!=='POST')return res.status(405).end();
  if(!(await authed(req)))return res.status(401).json({error:'Non autorise'});
  const{password}=req.body||{};
  if(!password||password.length<6)return res.status(400).json({error:'Min 6 car'});
  try{await rSet('adgstream:password_hash',sha(password));return res.status(200).json({ok:true})}
  catch(e){return res.status(500).json({error:e.message})}
}