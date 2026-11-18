// ---------- data ----------
const SITE = 'https://smzulqurnain.work';
const P = (title, slug, img, cat, client) => ({ title, slug, img: `assets/thumbs/${img}.jpg`, cat, client });
const PROJECTS = [
  P('Perodua EV Launch', 'perodua-ev-launch', 'perodua-ev-launch', 'social', 'Perodua'),
  P('MG Cyberster Launch', 'morris-garage-mg-cyberster-launch', 'mg-cyberster-launch', 'social', 'Morris Garages'),
  P('MG EV4 Launch', 'morris-garage-mg-ev4-launch', 'mg-ev4-launch', 'social', 'Morris Garages'),
  P('KFC The One Box', 'kfc-the-one-box-2020', 'kfc-the-one-box', 'tvc', 'KFC'),
  P('Rejoice Poof TVC', 'rejoice-poof-rich-soft-smooth-tvc', 'rejoice-poof-tvc', 'tvc', 'Rejoice'),
  P('Pantene ID Sansa', 'pantene-id-sansa-multivitamin', 'pantene-id-sansa', 'tvc', 'Pantene'),
  P('PropertyGuru DataSense', 'propertyguru-datasense-2024', 'propertyguru-datasense', 'social', 'PropertyGuru'),
  P('Mitsubishi Triton AI Test', 'mitsubishi-triton-ai-test', 'mitsubishi-triton-ai-test', 'hobby', 'Personal'),
  P('AI Projects', 'ai-projects', 'ai-projects', 'hobby', 'Personal'),
  P("Yeo's Social Media", 'yeos-social-media-2023-2025', 'yeo-s-social-media', 'social', "Yeo's"),
  P('Maggi Cukup Rasa', 'maggi-cukup-rasa-2019', 'maggi-cukup-rasa', 'tvc', 'Maggi'),
  P('Triton: Ride With The Stars', 'mitsubishi-triton-ride-with-the-stars', 'triton-ride-with-the-stars', 'social', 'Mitsubishi'),
  P('SimplySiti Rose Luxe', 'simplysiti-rose-luxe', 'simplysiti-rose-luxe', 'tvc', 'SimplySiti'),
  P('Perodua Content', 'perodua-content-2023-2025', 'perodua-content', 'social', 'Perodua'),
  P('Perodua Ativa KOL', 'perodua-ativa-kol-campaign-2024', 'perodua-ativa-kol', 'social', 'Perodua'),
  P('Proton Social Media', 'proton-social-media-motion-graphics', 'proton-social-media', 'social', 'Proton'),
];
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
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// tint folder icons
document.querySelectorAll('.folder').forEach((el, i) => {
  const key = el.closest('[data-folder]')?.dataset.folder;
  const col = FOLDERS[key]?.color || 'f7b267';
  el.style.backgroundImage = getComputedStyle(el).backgroundImage.replace('FILL', col);
});

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
  const cx = x ?? Math.max(12, (vw - width) / 2 + (cascade % 5) * 26 - 52);
  const cy = y ?? 30 + (cascade % 5) * 24;
  cascade++;
  el.style.left = Math.min(cx, vw - width - 12) + 'px';
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
  const bar = el.querySelector('.win-bar');
  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('.dot') || mobile() || el.classList.contains('max')) return;
    const sx = e.clientX - el.offsetLeft, sy = e.clientY - el.offsetTop;
    bar.setPointerCapture(e.pointerId);
    const move = ev => {
      el.style.left = Math.max(-el.offsetWidth + 80, Math.min(innerWidth - 80, ev.clientX - sx)) + 'px';
      el.style.top = Math.max(0, Math.min(innerHeight - 90, ev.clientY - sy)) + 'px';
    };
    const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
    bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up);
  });
  bar.addEventListener('dblclick', e => { if (!e.target.closest('.dot')) el.classList.toggle('max'); });
}

// ---------- apps ----------
const card = p => `<button class="card" data-proj="${p.slug}"><img src="${p.img}" alt="" loading="lazy"><p>${esc(p.title)}<small>${esc(p.client)}</small></p></button>`;

const APPS = {
  work() {
    const name = 'Zulqurnain';
    const logo = [...name].map((c, i) => `<span style="color:${LOGO_COLORS[i]}">${c}</span>`).join('');
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
      title: 'zsh — 80×24', w: 380, x: Math.max(12, innerWidth * .08 + 160), y: Math.min(innerHeight * .34, 300),
      body: `<div class="term" aria-live="polite"></div>`,
    });
    const t = el.querySelector('.term');
    const script = [
      ['whoami', 'sm zulqurnain — motion designer'],
      ['ls clients/', 'perodua  proton  mg  mitsubishi  kfc\npantene  maggi  rejoice  yeos  propertyguru'],
      ['cat services.txt', 'social motion · TVC finishing · launch & event visuals · AI experiments'],
      ['open showreel.mp4', '→ click showreel.mp4 on the desktop, or hit ▶ in the dock'],
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
    return openWin('reel', {
      title: 'showreel.mp4', w: 520,
      body: `<div class="reel"><img src="assets/thumbs/mg-cyberster-launch.jpg" alt=""><a href="https://vimeo.com/smzulqurnain" target="_blank" rel="noopener" aria-label="Watch the showreel on Vimeo"></a></div>
        <div class="proj-info"><h3>Showreel 2026</h3><a class="btn" href="https://vimeo.com/smzulqurnain" target="_blank" rel="noopener">Watch on Vimeo ↗</a></div>`,
    });
  },

  about() {
    const brands = new Set(PROJECTS.filter(p => p.client !== 'Personal').map(p => p.client)).size;
    return openWin('about', {
      title: 'about.txt', w: 440, x: 200, y: 40,
      body: `<div class="profile">
          <div class="avatar">${AVATAR}</div>
          <h3>SM Zulqurnain</h3><p>Motion designer · Malaysia</p>
          <a class="btn" href="${SITE}/contact" target="_blank" rel="noopener">Send message →</a>
          <div class="stats"><div><b>${PROJECTS.length}</b><span>Featured</span></div><div><b>${brands}</b><span>Brands</span></div><div><b>${Object.keys(FOLDERS).length}</b><span>Categories</span></div></div>
        </div>
        <div class="note">
          <div class="tags">${Object.values(FOLDERS).map(f => `<span class="tag" style="--c:${f.soft}">${f.name}</span>`).join('')}<span class="tag" style="--c:#d6f2ec">AI</span></div>
          <p>I make social content, TVCs and launch visuals for brands like Perodua, MG, Proton, Mitsubishi, KFC and Pantene. In my spare time I make AI experiments, car renders and odd side projects. They’re in the Hobby folder.</p>
          <div class="links">
            <a class="btn ghost" href="https://www.behance.net/sydworks" target="_blank" rel="noopener">Behance</a>
            <a class="btn ghost" href="https://www.linkedin.com/in/smzulqurnain/" target="_blank" rel="noopener">LinkedIn</a>
            <a class="btn ghost" href="https://vimeo.com/smzulqurnain" target="_blank" rel="noopener">Vimeo</a>
          </div></div>`,
    });
  },

  contact() {
    return openWin('contact', {
      title: 'New Message', w: 440,
      body: `<div class="note"><h3>Let’s make something move.</h3>
        <p>For briefs, rates or a chat, use the contact form on my site, or find me on LinkedIn.</p>
        <div class="links"><a class="btn" href="${SITE}/contact" target="_blank" rel="noopener">Open contact form ↗</a>
        <a class="btn ghost" href="https://www.linkedin.com/in/smzulqurnain/" target="_blank" rel="noopener">LinkedIn</a></div></div>`,
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
  openWin('proj:' + slug, {
    title: p.title, w: 560,
    body: `<div class="proj"><img src="${p.img}" alt="${esc(p.title)} still"><div class="proj-info"><h3>${esc(p.title)}</h3><span class="tag" style="--c:${FOLDERS[p.cat].soft}">${FOLDERS[p.cat].name}</span>
      <a class="btn" href="${SITE}/${p.slug}" target="_blank" rel="noopener">View project ↗</a></div></div>`,
  });
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

// opening layout, like the reference: browser on the right, terminal on the left
APPS.work();
if (!mobile()) APPS.terminal();
