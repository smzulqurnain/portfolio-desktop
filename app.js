// ---------- data (edited in Pages CMS: content/projects.json, content/site.json) ----------
const SITE = 'https://smzulqurnain.work';
let PROJECTS = [], S = {};
const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// only allow web links and site-relative paths from the content files
const safeUrl = u => { u = String(u || '').trim(); return /^(https?:\/\/|[\w./-]+$)/i.test(u) && !/^javascript:/i.test(u) ? u : ''; };
async function loadContent() {
  const get = p => fetch(p, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); });
  const [proj, site] = await Promise.all([get('content/projects.json'), get('content/site.json')]);
  S = site || {};
  const seen = new Set();
  PROJECTS = (proj.projects || []).filter(p => p && p.title).map(p => {
    let id = slugify(p.title) || 'post'; while (seen.has(id)) id += '-2'; seen.add(id);
    return {
      slug: id, title: String(p.title), client: String(p.client || ''),
      cat: FOLDERS[p.category] ? p.category : 'social',
      img: safeUrl(p.thumbnail), link: safeUrl(p.link), video: safeUrl(p.video),
      description: String(p.description || ''), gallery: (p.gallery || []).map(safeUrl).filter(Boolean),
    };
  });
}

// turn a Vimeo or YouTube page link into an embeddable player URL
function embedUrl(u) {
  let m;
  if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/))) return `https://player.vimeo.com/video/${m[1]}${m[2] ? '?h=' + m[2] : ''}`;
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/))) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  return '';
}
const player = (u, title) => {
  const src = embedUrl(u);
  if (src) return `<div class="player"><iframe src="${src}" title="${esc(title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
  if (/\.(mp4|webm|mov)(\?|$)/i.test(u)) return `<div class="player"><video src="${u}" controls playsinline preload="metadata"></video></div>`;
  return '';
};
const paras = t => esc(t).split(/\n{2,}/).map(x => `<p>${x.replace(/\n/g, '<br>')}</p>`).join('');

const FOLDERS = {
  social: { name: 'Social', page: 'social-media', color: 'f08fb6', soft: 'var(--pink-soft)', blurb: 'Launches, KOL and always-on content' },
  tvc:    { name: 'TVC', page: 'tvc-motion', color: 'cdebf7', soft: 'var(--blue-soft)', blurb: 'Broadcast spots and DOOH' },
  events: { name: 'Events', page: 'events', color: 'ef6a3e', soft: '#fbd3c4', blurb: 'Stage openers and event visuals' },
  hobby:  { name: 'Hobby', page: 'hobby', color: 'f5c24f', soft: 'var(--yellow-soft)', blurb: 'AI tests, renders, side projects' },
};
const LOGO_COLORS = ['#2448d9', '#ef6a3e', '#f5c24f', '#f08fb6', '#6fcbb8', '#2448d9', '#ef6a3e', '#f5c24f', '#f08fb6', '#6fcbb8'];
const AVATAR = `<svg viewBox="0 0 92 92" fill="none" stroke="#141414" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 92c2-16 12-24 24-24s22 8 24 24" fill="#fff"/><path d="M38 68v-8h16v8" fill="#fff"/>
  <ellipse cx="46" cy="44" rx="17" ry="20" fill="#fff"/>
  <path d="M29 40c0-14 8-22 18-22s17 7 17 20c-6-2-12-7-14-12-4 8-13 12-21 14z" fill="#141414"/>
  <circle cx="39.5" cy="46" r="1.6" fill="#141414"/><circle cx="52.5" cy="46" r="1.6" fill="#141414"/>
  <path d="M46 48v6h-3M41 58c3 2 7 2 10 0"/><path d="M33 46h12M47 46h12" stroke-width="1.6"/><rect x="33" y="42" width="11" height="8" rx="4"/><rect x="48" y="42" width="11" height="8" rx="4"/></svg>`;
const avatarHtml = () => { const u = safeUrl(S.avatar); return u ? `<img src="${u}" alt="${esc(S.name || 'Profile picture')}">` : AVATAR; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- window manager ----------
const desk = document.getElementById('desk');
const tpl = document.getElementById('win-tpl');
const wins = new Map();
let z = 20, cascade = 0;
const mobile = () => matchMedia('(max-width:720px)').matches;

function focusWin(w) {
  document.querySelectorAll('.win.front').forEach(x => x.classList.remove('front'));
  w.style.zIndex = ++z; w.classList.add('front');
  syncDock();
}
function syncDock() {
  document.querySelectorAll('.dock [data-open]').forEach(b => b.classList.toggle('open', wins.has(b.dataset.open)));
  document.querySelectorAll('.mb-left nav [data-folder]').forEach(b => b.classList.toggle('on', wins.has('folder:' + b.dataset.folder)));
}
function closeWin(id) {
  const w = wins.get(id); if (!w) return;
  wins.delete(id); w.classList.add('closing');
  w.addEventListener('animationend', () => w.remove(), { once: true });
  setTimeout(() => w.remove(), 250);
  syncDock();
}

function openWin(id, { title, body, w = 560, h, x, y, foot }) {
  if (wins.has(id)) { focusWin(wins.get(id)); return wins.get(id); }
  const el = tpl.content.firstElementChild.cloneNode(true);
  el.querySelector('.win-title').textContent = title;
  el.setAttribute('aria-label', title);
  const b = el.querySelector('.win-body');
  typeof body === 'string' ? (b.innerHTML = body) : b.append(body);
  const vw = innerWidth, vh = innerHeight - 34;
  const width = Math.min(w, vw - 24);
  el.style.width = width + 'px';
  if (h) el.style.height = Math.min(h, vh - 130) + 'px';
  const narrow = mobile();
  const cx = narrow ? 12 : x ?? Math.max(12, (vw - width) / 2 + (cascade % 5) * 26 - 52);
  const cy = narrow ? 8 + (cascade % 4) * 18 : y ?? 30 + (cascade % 5) * 24;
  cascade++;
  el.style.left = Math.max(12, Math.min(cx, vw - width - 12)) + 'px';
  el.style.top = cy + 'px';
  el.querySelector('.close').onclick = e => { e.stopPropagation(); closeWin(id); };
  el.querySelector('.min').onclick = e => { e.stopPropagation(); closeWin(id); };
  el.querySelector('.max').onclick = e => { e.stopPropagation(); el.classList.toggle('max'); };
  el.addEventListener('pointerdown', () => focusWin(el));
  drag(el);
  desk.append(el); wins.set(id, el); focusWin(el);
  return el;
}

function drag(el) {
  // grab by the title bar or the bottom ledge, at any screen size
  for (const handle of el.querySelectorAll('.win-bar, .win-foot')) {
    handle.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('.dot')) return;
      e.preventDefault();
      let r = el.getBoundingClientRect(), dr = desk.getBoundingClientRect();
      if (el.classList.contains('max')) {
        // pull a maximised window off its max size, keeping it under the pointer
        el.classList.remove('max');
        const w = el.offsetWidth;
        el.style.left = (e.clientX - dr.left - w * ((e.clientX - r.left) / r.width)) + 'px';
        el.style.top = (e.clientY - dr.top - 15) + 'px';
        r = el.getBoundingClientRect();
      }
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      handle.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      const move = ev => {
        const w = el.offsetWidth, h = el.offsetHeight;
        const x = ev.clientX - dr.left - ox, y = ev.clientY - dr.top - oy;
        // keep at least 80px of the window, and the whole title bar, on screen
        el.style.left = Math.max(80 - w, Math.min(dr.width - 80, x)) + 'px';
        el.style.top = Math.max(0, Math.min(dr.height - 40, y)) + 'px';
      };
      const up = () => {
        el.classList.remove('dragging');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }
  el.querySelector('.win-bar').addEventListener('dblclick', e => { if (!e.target.closest('.dot')) el.classList.toggle('max'); });
}

// ---------- apps ----------
const card = p => `<button class="card" data-proj="${p.slug}"><img src="${p.img}" alt="" loading="lazy"><p>${esc(p.title)}<small>${esc(p.client)}</small></p></button>`;

const APPS = {
  work() {
    const name = (S.name || 'Zulqurnain').split(' ').pop();
    const logo = [...name].map((c, i) => `<span style="color:${LOGO_COLORS[i % LOGO_COLORS.length]}">${esc(c)}</span>`).join('');
    const el = openWin('work', {
      title: 'Work — smzulqurnain.work', w: 760, h: 640, x: Math.max(12, innerWidth - 790), y: 24,
      body: `<div class="addr"><span>←&nbsp;→</span><b>smzulqurnain.work/featured</b></div>
        <div class="engine"><h1 class="logo" aria-label="${name}">${logo}</h1>
          <label class="search"><input type="search" placeholder="Search work… try “Perodua” or “TVC”" aria-label="Search work"><kbd>⌘K</kbd></label>
          <div class="chips"><button class="chip on" data-chip="">All</button>${Object.entries(FOLDERS).filter(([k]) => PROJECTS.some(p => p.cat === k)).map(([k, f]) => `<button class="chip" data-chip="${k}" style="--c:${f.soft}">${f.name}</button>`).join('')}</div>
        </div><div class="results"></div>`,
    });
    const input = el.querySelector('input'), res = el.querySelector('.results');
    let chip = '';
    const render = () => {
      const q = input.value.trim().toLowerCase();
      const list = PROJECTS.filter(p => (!chip || p.cat === chip) && (!q || `${p.title} ${p.client} ${FOLDERS[p.cat].name}`.toLowerCase().includes(q)));
      res.innerHTML = list.length ? list.map(card).join('') : `<p class="empty">No results for “${esc(q)}”. <a href="${SITE}" target="_blank" rel="noopener">Search the full site ↗</a></p>`;
    };
    input.addEventListener('input', render);
    el.querySelectorAll('.chip').forEach(c => c.onclick = () => {
      chip = c.dataset.chip; el.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c)); render();
    });
    render();
    return el;
  },

  terminal() {
    const el = openWin('terminal', {
      title: 'zsh — 80×24', w: 380, x: 28, y: 24,
      body: `<div class="term" aria-live="polite"></div>`,
    });
    const t = el.querySelector('.term');
    const script = [
      ['whoami', `${(S.name || '').toLowerCase()} — ${(S.role || 'motion designer').split('·')[0].trim().toLowerCase()}`],
      ['ls clients/', clientList()],
      ['cat services.txt', S.services || ''],
      ['ls work/', `${PROJECTS.length} projects → click the globe in the dock`],
      ['open showreel.mp4', '→ hit ▶ in the dock'],
    ];
    let i = 0;
    const typeLine = () => {
      if (!wins.has('terminal')) return;
      if (i >= script.length) { t.insertAdjacentHTML('beforeend', `<div class="p"><span class="cur"></span></div>`); return; }
      const [cmd, out] = script[i++];
      const line = document.createElement('div'); line.className = 'p'; t.append(line);
      let k = 0;
      const tick = setInterval(() => {
        line.textContent = cmd.slice(0, ++k);
        if (k >= cmd.length) {
          clearInterval(tick);
          setTimeout(() => {
            if (out) { const o = document.createElement('p'); o.className = 'o'; o.textContent = out; t.append(o); setTimeout(typeLine, 550); }
            else { APPS.reel(); setTimeout(typeLine, 300); }
          }, 260);
        }
      }, 55);
    };
    setTimeout(typeLine, 500);
    return el;
  },

  reel() {
    const link = safeUrl(S.showreel_link), vid = safeUrl(S.showreel_video), poster = safeUrl(S.showreel_poster);
    const media = (vid && player(vid, 'Showreel')) ||
      `<div class="reel">${poster ? `<img src="${poster}" alt="">` : ''}${link ? `<a href="${link}" target="_blank" rel="noopener" aria-label="Watch the showreel"></a>` : ''}</div>`;
    return openWin('reel', {
      title: 'showreel.mp4', w: 560,
      body: `${media}<div class="proj-info"><h3>Showreel</h3>${link ? `<a class="btn" href="${link}" target="_blank" rel="noopener">Watch full screen ↗</a>` : ''}</div>`,
    });
  },

  about() {
    const brands = new Set(PROJECTS.filter(p => p.client !== 'Personal').map(p => p.client)).size;
    return openWin('about', {
      title: 'about.txt', w: 440, x: 200, y: 40,
      body: `<div class="profile">
          <div class="avatar">${avatarHtml()}</div>
          <h3>${esc(S.name)}</h3><p>${esc(S.role)}</p>
          ${S.contact_link ? `<a class="btn" href="${safeUrl(S.contact_link)}" target="_blank" rel="noopener">Send message →</a>` : ''}
          <div class="stats"><div><b>${PROJECTS.length}</b><span>Featured</span></div><div><b>${brands}</b><span>Brands</span></div><div><b>${Object.keys(FOLDERS).length}</b><span>Categories</span></div></div>
        </div>
        <div class="note">
          <div class="tags">${Object.values(FOLDERS).map(f => `<span class="tag" style="--c:${f.soft}">${f.name}</span>`).join('')}<span class="tag" style="--c:#d6f2ec">AI</span></div>
          ${paras(S.bio || '')}
          <div class="links">${socials()}</div></div>`,
    });
  },

  contact() {
    return openWin('contact', {
      title: 'New Message', w: 440,
      body: `<div class="note"><h3>Let’s make something move.</h3>
        <p>For briefs, rates or a chat, use the contact form on my site, or find me on LinkedIn.</p>
        <div class="links">${S.contact_link ? `<a class="btn" href="${safeUrl(S.contact_link)}" target="_blank" rel="noopener">Open contact form ↗</a>` : ''}${socials()}</div></div>`,
    });
  },

  finder() {
    const el = openWin('finder', {
      title: 'Folders', w: 380,
      body: `<div class="finder">${Object.entries(FOLDERS).map(([k, f]) => `<button data-folder="${k}" style="--c:${f.soft}"><span class="ico folder" style="background-image:${folderSvg(f.color)}"></span><span>${f.name}<small>${f.blurb}</small></span></button>`).join('')}</div>`,
    });
    return el;
  },
};

function folderSvg(col) {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 46'%3E%3Cpath d='M2 7a4 4 0 014-4h14l4 5h26a4 4 0 014 4v28a4 4 0 01-4 4H6a4 4 0 01-4-4z' fill='%23${col}' stroke='%23141414' stroke-width='2.4' stroke-linejoin='round'/%3E%3Cpath d='M2 15h52' stroke='%23141414' stroke-width='2'/%3E%3C/svg%3E")`;
}

function openFolder(key) {
  const f = FOLDERS[key];
  const items = PROJECTS.filter(p => p.cat === key);
  const files = items.length
    ? `<div class="files">${items.map(p => `<button class="file" data-proj="${p.slug}"><img src="${p.img}" alt="" loading="lazy">${esc(p.title)}</button>`).join('')}</div>`
    : `<div class="note"><p>This folder lives on the main site. It has event openers, stage visuals and music-video work.</p></div>`;
  openWin('folder:' + key, {
    title: `${f.name} — ${items.length || '…'} items`, w: 520,
    body: `${files}<div class="folder-note"><span>Showing featured picks</span><a class="btn ghost" href="${SITE}/${f.page}" target="_blank" rel="noopener">All ${f.name} work ↗</a></div>`,
  });
}

function openProject(slug) {
  const p = PROJECTS.find(x => x.slug === slug); if (!p) return;
  const media = (p.video && player(p.video, p.title)) || (p.img ? `<img src="${p.img}" alt="${esc(p.title)} still">` : '');
  const gallery = p.gallery.length ? `<div class="gallery">${p.gallery.map(g => `<img src="${g}" alt="" loading="lazy">`).join('')}</div>` : '';
  openWin('proj:' + slug, {
    title: p.title, w: p.description || p.gallery.length ? 640 : 560,
    body: `<div class="proj">${media}<div class="proj-info"><h3>${esc(p.title)}${p.client ? `<small>${esc(p.client)}</small>` : ''}</h3><span class="tag" style="--c:${FOLDERS[p.cat].soft}">${FOLDERS[p.cat].name}</span>
      ${p.link ? `<a class="btn" href="${p.link}" target="_blank" rel="noopener">View project ↗</a>` : ''}</div>
      ${p.description ? `<div class="proj-desc">${paras(p.description)}</div>` : ''}${gallery}</div>`,
  });
}

function clientList() {
  const names = [...new Set(PROJECTS.map(p => p.client).filter(c => c && c !== 'Personal'))].map(c => slugify(c).replace(/-/g, ''));
  const rows = []; for (let i = 0; i < names.length; i += 5) rows.push(names.slice(i, i + 5).join('  '));
  return rows.join('\n');
}
function socials() {
  return [['Behance', S.behance], ['LinkedIn', S.linkedin], ['Vimeo', S.vimeo], ['Last.fm', S.lastfm], ['DeviantArt', S.deviantart]]
    .filter(([, u]) => safeUrl(u)).map(([n, u]) => `<a class="btn ghost" href="${safeUrl(u)}" target="_blank" rel="noopener">${n}</a>`).join('');
}

// ---------- wiring ----------
document.addEventListener('click', e => {
  const t = e.target.closest('[data-open],[data-folder],[data-proj]'); if (!t) return;
  if (t.dataset.open) APPS[t.dataset.open]?.();
  else if (t.dataset.folder) openFolder(t.dataset.folder);
  else if (t.dataset.proj) openProject(t.dataset.proj);
});
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); APPS.work().querySelector('input')?.focus(); }
  if (e.key === 'Escape') { const top = [...wins.entries()].sort((a, b) => b[1].style.zIndex - a[1].style.zIndex)[0]; if (top) closeWin(top[0]); }
});

// wallpaper: kit colours
const WALLS = ['#c56a6c', '#59c3af', '#2448d9', '#f5c24f', '#f08fb6'];
let wall = 0;
try { wall = +localStorage.getItem('wall') || 0; } catch {}
const setWall = () => { document.body.style.setProperty('--desk', WALLS[wall % WALLS.length]); try { localStorage.setItem('wall', wall % WALLS.length); } catch {} };
setWall();
document.getElementById('wall').onclick = () => { wall++; setWall(); };

// clock
const clock = document.getElementById('clock');
const tickClock = () => { clock.textContent = new Date().toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ''); };
tickClock(); setInterval(tickClock, 15000);

// ---------- centre widget ----------
function initWidget() {
  const wg = document.querySelector('.widget');
  wg.querySelector('.wg-avatar').innerHTML = avatarHtml();
  wg.querySelector('.wg-handle').textContent = S.handle || slugify(S.name || '').replace(/-/g, '');
  wg.querySelector('.wg-role').textContent = S.role || '';
  // clock
  const day = wg.querySelector('.wg-day b'), date = wg.querySelector('.wg-day span'), time = wg.querySelector('.wg-time'), ampm = wg.querySelector('.wg-ampm');
  const tick = () => {
    const d = new Date();
    day.textContent = d.toLocaleDateString('en-GB', { weekday: 'long' });
    date.textContent = d.toLocaleDateString('en-GB', { month: 'long', day: '2-digit' }).split(' ').reverse().join(' ');
    const h = d.getHours();
    time.textContent = `${String(h % 12 || 12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    ampm.textContent = h < 12 ? 'AM' : 'PM';
  };
  tick(); setInterval(tick, 10000);
  // now playing: cycles through the projects; click opens the one showing
  const now = wg.querySelector('.wg-now'), img = now.querySelector('img'), title = now.querySelector('.wg-title'), client = now.querySelector('.wg-client');
  const list = PROJECTS.filter(p => p.img);
  let i = 0, hover = false;
  const show = () => { const p = list[i]; if (!p) return; img.src = p.img; img.alt = p.title; title.textContent = p.title; client.textContent = p.client; now.dataset.proj = p.slug; now.setAttribute('aria-label', `Now playing: ${p.title}. Open project`); };
  show();
  list.slice(1, 4).forEach(p => { new Image().src = p.img; });
  now.addEventListener('pointerenter', () => hover = true);
  now.addEventListener('pointerleave', () => hover = false);
  if (list.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => {
    if (hover || document.hidden) return;
    now.classList.add('swap');
    setTimeout(() => { i = (i + 1) % list.length; show(); img.decode?.().catch(() => {}).finally(() => now.classList.remove('swap')); }, 350);
  }, 4000);
  wg.hidden = false;
}

// opening layout, like the reference: browser on the right, terminal on the left
loadContent().then(() => {
  initWidget();
  // desktop starts clear: the terminal opens from the menu-bar logo or the dock
}).catch(err => {
  console.error(err);
  openWin('error', { title: 'Error', w: 380, body: `<div class="note"><h3>Couldn’t load content.</h3><p>${esc(err.message)}</p><p>If you just edited content in Pages CMS, check the JSON is valid, or reload in a minute.</p></div>` });
});
