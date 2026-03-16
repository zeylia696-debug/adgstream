import {rGet,rSet} from './_redis.js';
import crypto from 'crypto';
const H='a479b04c72d2bd957588dfebb960049bebf1258582ceedd1a3894537e2fa504d';
const sha=(s)=>crypto.createHash('sha256').update(s).digest('hex');
const tok=()=>crypto.randomBytes(32).toString('hex');
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const{password}=req.body||{};
  if(!password)return res.status(400).json({error:'Mot de passe requis'});
  try{
    const stored=await rGet('adgstream:password_hash')||H;
    if(sha(password)!==stored)return res.status(401).json({error:'Mot de passe incorrect'});
    const t=tok();
    await rSet('adgstream:session:'+t,'1',{ex:604800});
    res.setHeader('Set-Cookie','adg_session='+t+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800');
    return res.status(200).json({ok:true});
  }catch(e){return res.status(500).json({error:e.message})}
}