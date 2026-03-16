/* ═══════════════════════════════════════
   ADGstream — main.js  (shared, API-driven)
═══════════════════════════════════════ */

/* ── NAV SCROLL ── */
window.addEventListener('scroll', () => {
  document.getElementById('nav')?.classList.toggle('scrolled', scrollY > 50);
});

/* ── MOBILE NAV ── */
function toggleDrawer() { document.getElementById('drawer')?.classList.toggle('open'); }
function closeDrawer()  { document.getElementById('drawer')?.classList.remove('open'); }

/* ── SMOOTH SCROLL ── */
function smoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

/* ── THEME TOGGLE (ADG violet ↔ Facolix orange) ── */
function initTheme() {
  const saved = localStorage.getItem('active_theme') || 'adg';
  applyTheme(saved, false);
}

function applyTheme(theme, save = true) {
  const isFacolix = theme === 'facolix';
  document.body.classList.toggle('theme-facolix', isFacolix);
  const fab = document.getElementById('theme-fab');
  if (fab) fab.innerHTML = isFacolix ? '♠ ADGstream' : '🔥 Facolix';
  const logo = document.querySelector('.nlogo');
  if (logo && !document.body.classList.contains('page-facolix')) {
    logo.textContent = isFacolix ? 'Facolix' : 'ADGstream';
  }
  if (save) localStorage.setItem('active_theme', theme);
}

function toggleTheme() {
  const cur = localStorage.getItem('active_theme') || 'adg';
  applyTheme(cur === 'adg' ? 'facolix' : 'adg');
}

/* ── LIVE STATUS ── */
async function checkLive(channel) {
  try {
    const ch  = channel || 'adgstream';
    const r   = await fetch(`https://decapi.me/twitch/uptime/${ch}`, { cache: 'no-store' });
    const txt = await r.text();
    const live = txt.trim().length > 0
      && !txt.toLowerCase().includes('offline')
      && !txt.toLowerCase().includes('error');
    const dot    = document.getElementById('ldot');
    const ltext  = document.getElementById('ltext');
    const banner = document.getElementById('livebanner');
    if (dot)    dot.classList.toggle('on', live);
    if (ltext)  ltext.textContent = live ? '🔴 En direct' : 'Offline';
    if (banner) banner.classList.toggle('show', live);
    return live;
  } catch(e) { return false; }
}

async function checkFacolixLive() {
  try {
    const r   = await fetch('https://decapi.me/twitch/uptime/facolix', { cache: 'no-store' });
    const txt = await r.text();
    const live = txt.trim().length > 0 && !txt.toLowerCase().includes('offline');
    const dot  = document.getElementById('facolix-ldot');
    const lbl  = document.getElementById('facolix-live-text');
    if (dot) dot.classList.toggle('on', live);
    if (lbl) lbl.textContent = live ? '🔴 En direct chez Facolix' : 'Facolix est offline';
  } catch(e) {}
}

/* ── TWITCH STATS ── */
async function loadTwitchStats(channel) {
  try {
    const r = await fetch(`/api/twitch-stats?channel=${channel || 'adgstream'}`);
    return await r.json();
  } catch(e) { return null; }
}

/* ── LOAD & INJECT CONTENT ── */
async function loadContent() {
  try {
    const r    = await fetch('/api/content');
    const data = await r.json();
    injectContent(data);
    checkLive(data.twitch_channel);
    setInterval(() => checkLive(data.twitch_channel), 60000);

    // Load live Twitch stats and update follower count
    loadTwitchStats(data.twitch_channel || 'adgstream').then(stats => {
      if (stats && stats.followers && stats.followers !== '—') {
        const el = document.getElementById('stat1_num');
        if (el) el.textContent = stats.followers;
      }
      // Inject live clips if on clips page
      if (stats?.clips?.length && document.getElementById('cgrid')) {
        renderClipsFromAPI(stats.clips, data.clip_categories || {});
      }
    });
    setInterval(() => {
      loadTwitchStats(data.twitch_channel || 'adgstream').then(stats => {
        if (stats?.followers && stats.followers !== '—') {
          const el = document.getElementById('stat1_num');
          if (el) el.textContent = stats.followers;
        }
      });
    }, 5 * 60 * 1000);

    // Facolix live check
    if (data.facolix?.show_on_home !== false) {
      checkFacolixLive();
      setInterval(checkFacolixLive, 60000);
    }

    return data;
  } catch(e) {
    checkLive();
    setInterval(() => checkLive(), 60000);
  }
}

function injectContent(d) {
  // Hero
  setText('hero_eyebrow', d.hero_eyebrow);
  setText('hero_name',    d.hero_name);
  setText('hero_tag',     d.hero_tag);
  setText('hero_btn_watch', d.hero_btn_watch);
  // About
  setText('about_title', d.about_title);
  setText('about_p1',    d.about_p1);
  setText('about_p2',    d.about_p2);
  setText('stat1_num', d.stat1_num); setText('stat1_lbl', d.stat1_lbl);
  setText('stat2_num', d.stat2_num); setText('stat2_lbl', d.stat2_lbl);
  setText('stat3_num', d.stat3_num); setText('stat3_lbl', d.stat3_lbl);
  // Schedule
  setText('schedule_week', d.schedule_week);
  if (d.schedule_days) renderSchedule(d.schedule_days);
  // Social links
  if (d.social_links) {
    setHref('link-twitch',   d.social_links.twitch);
    setHref('link-discord',  d.social_links.discord);
    setHref('link-tiktok',   d.social_links.tiktok);
    setHref('link-kofi',     d.social_links.kofi);
    setText('txt-twitch',    d.social_links.twitch?.replace('https://','') || '');
    setText('txt-discord',   d.social_links.discord?.replace('https://','') || '');
    setText('txt-tiktok',    d.social_links.tiktok  || '');
    setText('txt-kofi',      'ko-fi.com/adgstream');
    // Update all kofi links
    document.querySelectorAll('.kofi-link').forEach(el => {
      el.href = d.social_links.kofi || 'https://ko-fi.com/adgstream';
    });
  }
  // Footer
  setText('footer_tag', d.footer_tag);
  // Clips page (fallback manual)
  if (d.clips?.length && document.getElementById('cgrid')) {
    renderClips(d.clips);
  }
  // Facolix section
  if (d.facolix) {
    const sec = document.getElementById('facolix-section');
    if (sec) sec.style.display = d.facolix.show_on_home === false ? 'none' : '';
    setText('facolix-about', d.facolix.about);
    if (d.facolix.schedule_days) renderSchedule(d.facolix.schedule_days, 'facolix-dayrows');
    if (d.facolix.social_links) {
      setHref('facolix-link-twitch', d.facolix.social_links.twitch);
      setHref('facolix-link-discord', d.facolix.social_links.discord);
    }
  }
  // Histoire
  if (d.characters) renderCharacters(d.characters);
  if (d.story) renderStory(d.story);
  // TikTok/Instagram
  if (d.tiktok_posts) renderSocialPosts(d.tiktok_posts, 'tiktok-grid', 'tiktok');
  if (d.instagram_posts) renderSocialPosts(d.instagram_posts, 'insta-grid', 'instagram');
  // Blackjack
  if (d.blackjack) {
    window._bjSettings = d.blackjack;
    if (d.blackjack.enabled === false) {
      const bj = document.getElementById('bj-game');
      if (bj) bj.innerHTML = '<div style="text-align:center;padding:60px;font-family:Cinzel,serif;color:var(--muted);letter-spacing:.3em">✦ COMING SOON ✦</div>';
    }
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.textContent = val;
}

function setHref(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.href = val;
}

/* ── SCHEDULE RENDERER ── */
const SC = ['♦','♣','♥','♦','♠','♦','♠'];
function renderSchedule(days, wrapperId = 'dayrows') {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;
  wrap.innerHTML = '';
  days.forEach((d, i) => {
    const orn = i < days.length-1 ? '<div class="rorn">— ✦ —</div>' : '';
    if (d.off) {
      wrap.innerHTML += `<div class="dr off"><div class="drn">—</div><div class="drd">${d.day} <span class="ddot"></span></div><span class="dro">Offline</span><div class="drs">♠ ♥ ♦ ♣</div></div>${orn}`;
    } else {
      wrap.innerHTML += `<div class="dr act"><div class="drn">${d.num}</div><div class="drd">${d.day} <span class="ddot"></span></div><div class="ddiv"></div><div class="dri"><div class="dra">${d.act}</div><div class="drt">${d.time}</div></div><div class="drs">${SC[i]}</div></div>${orn}`;
    }
  });
}

/* ── CLIPS RENDERER (manual fallback) ── */
function renderClips(clips) {
  const grid = document.getElementById('cgrid');
  if (!grid) return;
  grid.innerHTML = clips.map(c => `
    <a class="clip" href="${c.link||'#'}" target="_blank">
      <div class="cthumb">
        <div class="ctg"></div>
        <div class="csb">${c.suit||'♠'}</div>
        <span class="cbadge">${c.cat||''}</span>
        <div class="cplay">▶</div>
      </div>
      <div class="cinfo">
        <div class="cttl">${c.title||''}</div>
        <div class="cmeta"><span>${c.views||''}</span><span>${c.date||''}</span></div>
      </div>
    </a>`).join('');
}

/* ── CLIPS RENDERER (from Twitch API) ── */
function renderClipsFromAPI(clips, categories) {
  const grid = document.getElementById('cgrid');
  if (!grid) return;
  grid.innerHTML = clips.map(c => {
    const cat = categories[c.id] || '';
    const thumb = c.thumbnail || '';
    return `<a class="clip" href="${c.url}" target="_blank">
      <div class="cthumb">
        ${thumb ? `<img src="${thumb}" alt="${c.title}" loading="lazy">` : '<div class="ctg"></div><div class="csb">♠</div>'}
        ${cat ? `<span class="cbadge">${cat}</span>` : ''}
        <div class="cplay">▶</div>
      </div>
      <div class="cinfo">
        <div class="cttl">${c.title||''}</div>
        <div class="cmeta"><span>${(c.views||0).toLocaleString('fr-FR')} vues</span><span>${c.duration||''}</span></div>
      </div>
    </a>`;
  }).join('');
}

/* ── CHARACTERS RENDERER ── */
function renderCharacters(chars) {
  const grid = document.getElementById('chars-grid');
  if (!grid) return;
  const rarityClass = { 'Commun': 'rarity-commun', 'Rare': 'rarity-rare', 'Légendaire': 'rarity-legendaire' };
  grid.innerHTML = chars.map(c => `
    <div class="char-card">
      <span class="char-rarity ${rarityClass[c.rarity]||'rarity-commun'}">${c.rarity||'Commun'}</span>
      <span class="char-suit">${c.suit||'♠'}</span>
      <div class="char-name">${c.name||''}</div>
      <div class="char-role">${c.role||''}</div>
      <div class="char-desc">${c.desc||''}</div>
    </div>`).join('');
}

/* ── STORY RENDERER ── */
function renderStory(s) {
  setText('story-chapter', s.chapter);
  setText('story-date',    s.date);
  const bodyEl = document.getElementById('story-body');
  if (bodyEl) bodyEl.textContent = s.body || '';
  setText('story-teaser',  s.teaser);
}

/* ── SOCIAL POSTS RENDERER ── */
function renderSocialPosts(posts, gridId, platform) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  if (!posts.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);font-family:'Cinzel',serif;font-size:10px;letter-spacing:.3em">Aucun contenu pour l'instant ✦</div>`;
    return;
  }
  const isTT = platform === 'tiktok';
  grid.innerHTML = posts.map(p => `
    <a class="sc-post" href="${p.url||'#'}" target="_blank">
      <div class="sc-thumb">
        ${p.thumb ? `<img src="${p.thumb}" alt="${p.title||''}" loading="lazy">` : '<div class="sc-thumb-ph"><div class="sc-thumb-suit">'+(isTT?'♦':'♥')+'</div></div>'}
        <span class="sc-platform-badge ${isTT?'badge-tiktok':'badge-instagram'}">${isTT?'♦ TikTok':'♥ Instagram'}</span>
      </div>
      <div class="sc-info">
        <div class="sc-title">${p.title||''}</div>
        <div class="sc-meta"><span>${p.views||''}</span><span>${p.date||''}</span></div>
      </div>
    </a>`).join('');
}

/* ── REVEAL ── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.animation='rU .7s ease both'; obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.inner2col,.swrap,.cgrid,.scards,.big-links,.chars-grid,.story-section,.sc-posts-grid,footer').forEach(el => obs.observe(el));
}

/* ── INJECT TWITCH PLAYER (dynamic parent) ── */
function injectTwitchPlayer(channelName, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const host = location.hostname || 'localhost';
  const parents = [...new Set(['localhost','127.0.0.1', host])];
  const pp = parents.map(p => `parent=${encodeURIComponent(p)}`).join('&');
  const iframe = document.createElement('iframe');
  iframe.src = `https://player.twitch.tv/?channel=${channelName}&${pp}&autoplay=false`;
  iframe.allowFullscreen = true;
  iframe.allow = 'autoplay;fullscreen';
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none';
  box.appendChild(iframe);
}

/* ── AUTO INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadContent();
  initReveal();
  smoothScroll();
  // Inject theme FAB on all pages
  const fab = document.getElementById('theme-fab');
  if (fab) fab.addEventListener('click', toggleTheme);
});
