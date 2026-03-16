import {rGet} from './_redis.js';
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  const c=req.headers['cookie']||'';
  const m=c.match(/adg_session=([^;]+)/);
  if(!m)return res.status(200).json({authed:false});
  try{const v=await rGet('adgstream:session:'+m[1]);return res.status(200).json({authed:!!v})}
  catch(e){return res.status(200).json({authed:false})}
}