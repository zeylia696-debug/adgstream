// api/content.js — Vercel Serverless Function
// Stockage via Vercel KV (Redis) ou fichier JSON via Edge Config
// Pour commencer simplement : utilise localStorage côté client + ce fichier pour la démo

import { kv } from '@vercel/kv';
import crypto from 'crypto';

const DEFAULT_CONTENT = {
  hero_eyebrow: "The House Always Streams",
  hero_name: "ADGstream",
  hero_tag: "Streamer · Casino · Card Magic",
  hero_btn_watch: "Regarder sur Twitch",
  about_title: "La magie des cartes, en live",
  about_p1: "Bienvenue sur ma chaîne — un espace dédié aux jeux de cartes, au casino et à la magie.",
  about_p2: "Je stream du poker, du blackjack et parfois des tours de magie. Rejoins-nous !",
  stat1_num: "263", stat1_lbl: "Followers",
  stat2_num: "5×",  stat2_lbl: "Par semaine",
  stat3_num: "4 mois", stat3_lbl: "En stream",
  schedule_week: "—",
  schedule_days: [
    { day:"DIM", num:"—", act:"", time:"", off:true },
    { day:"LUN", num:"—", act:"Poker Night", time:"20h – 23h", off:false },
    { day:"MAR", num:"—", act:"Casino Night", time:"21h – 00h", off:false },
    { day:"MER", num:"—", act:"", time:"", off:true },
    { day:"JEU", num:"—", act:"Card Magic", time:"20h – 22h", off:false },
    { day:"VEN", num:"—", act:"", time:"", off:true },
    { day:"SAM", num:"—", act:"Weekend Spécial", time:"19h – 23h", off:false },
  ],
  clips: [], clip_categories: {},
  social_links: {
    twitch: "https://twitch.tv/adgstream",
    discord: "https://discord.gg/kcRtUEnb",
    tiktok: "https://tiktok.com/@adgstream",
    kofi: "https://ko-fi.com/adgstream",
  },
  footer_tag: "La table est toujours ouverte",
  twitch_channel: "adgstream",
  discord_invite: "kcRtUEnb",
  discord_guild_id: "",
  characters: [],
  story: { chapter:"Chapitre 1", date:"—", body:"", teaser:"La suite au prochain stream… ♠" },
  tiktok_posts: [], instagram_posts: [],
  blackjack: { free_rounds:3, message:"Soutenez le stream pour continuer ! 1€ = 1 partie ♦", enabled:true },
  facolix: {
    show_on_home: true,
    about: "Facolix est mon co-streamer. Rejoins sa chaîne !",
    schedule_days: [],
    social_links: { twitch:"https://www.twitch.tv/facolix", discord:"https://discord.gg/kcRtUEnb" },
  },
};

function validateSession(req) {
  const cookie = req.headers.get ? req.headers.get('cookie') : req.headers['cookie'] || '';
  const match = (cookie || '').match(/adg_session=([^;]+)/);
  if (!match) return false;
  // For Vercel: validate against KV store
  return true; // simplified — full auth below
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    try {
      const stored = await kv.get('adgstream:content');
      const data = stored ? { ...DEFAULT_CONTENT, ...stored } : DEFAULT_CONTENT;
      return res.status(200).json(data);
    } catch (e) {
      return res.status(200).json(DEFAULT_CONTENT);
    }
  }

  if (req.method === 'POST') {
    // Auth check
    const cookie = req.headers['cookie'] || '';
    const match = cookie.match(/adg_session=([^;]+)/);
    if (!match) return res.status(401).json({ error: 'Non autorisé' });
    try {
      const sessionValid = await kv.get(`adgstream:session:${match[1]}`);
      if (!sessionValid) return res.status(401).json({ error: 'Session expirée' });
    } catch(e) { return res.status(401).json({ error: 'Erreur auth' }); }

    try {
      const existing = await kv.get('adgstream:content') || DEFAULT_CONTENT;
      const merged = { ...existing, ...req.body };
      await kv.set('adgstream:content', merged);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Erreur sauvegarde' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
