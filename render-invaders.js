// Render Invaders — a tiny original arcade shooter hidden in the dock.
// You're the UFO. Blast the "bad edits" before they reach the final cut.
(() => {
  const W = 640, H = 420, ROUND_S = 45, LIVES = 3;
  const C = { bg: '#16161c', ink: '#18191f', star: '#cfcfd6', ufo: '#f5c24f', dome: '#8fd49a', shot: '#ffffff', red: '#ef6a3e', pink: '#f08fb6', blue: '#9fb4f5', mint: '#6fcbb8', yellow: '#f5c24f', fail: '#ef6a3e', ok: '#8fd49a' };
  // the bad edits: label, points, colour, draw
  const FOES = {
    error:   { label: 'Render error',  pts: 10, col: C.red },
    dropped: { label: 'Dropped frame', pts: 20, col: C.blue },
    jump:    { label: 'Jump cut',      pts: 15, col: C.pink },
    glitch:  { label: 'Glitch',        pts: 30, col: C.mint },
  };
  const ROWS = ['glitch', 'dropped', 'jump', 'error'];

  let best = 0;
  try { best = +localStorage.getItem('ri-best') || 0; } catch {}

  // ---------- sound blips ----------
  let actx = null, muted = false;
  function blip(freq, dur = .08, type = 'square', vol = .05, slide = 0) {
    if (muted) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + .02);
    } catch {}
  }

  // ---------- sprites ----------
  function drawUfo(ctx, x, y, flash) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = flash ? '#fff' : C.dome; ctx.beginPath(); ctx.ellipse(0, -6, 13, 11, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : C.ufo; ctx.beginPath(); ctx.ellipse(0, 2, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.ink; for (const dx of [-16, 0, 16]) ctx.fillRect(dx - 2, 1, 4, 3);
    ctx.restore();
  }
  function drawFoe(ctx, f, t) {
    const { x, y, kind } = f, col = FOES[kind].col, s = 15;
    ctx.save(); ctx.translate(x, y);
    if (kind === 'error') { // warning box with "!"
      ctx.fillStyle = col; ctx.fillRect(-s, -s * .8, s * 2, s * 1.6);
      ctx.fillStyle = C.bg; ctx.fillRect(-2, -8, 4, 9); ctx.fillRect(-2, 4, 4, 4);
    } else if (kind === 'dropped') { // film frame with a missing middle
      ctx.fillStyle = col; ctx.fillRect(-s, -s * .8, s * 2, s * 1.6);
      ctx.fillStyle = C.bg; ctx.fillRect(-s + 4, -4, s * 2 - 8, 8);
      for (let i = -1; i <= 1; i++) { ctx.fillRect(i * 9 - 2, -s * .8 + 3, 4, 3); ctx.fillRect(i * 9 - 2, s * .8 - 6, 4, 3); }
    } else if (kind === 'jump') { // scissors
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const o = Math.sin(t * 10 + x) * .25;
      ctx.beginPath(); ctx.moveTo(-12, -10 - o * 10); ctx.lineTo(10, 8); ctx.moveTo(-12, 10 + o * 10); ctx.lineTo(10, -8); ctx.stroke();
      ctx.beginPath(); ctx.arc(-14, -11 - o * 10, 4, 0, 7); ctx.arc(-14, 11 + o * 10, 4, 0, 7); ctx.stroke();
    } else { // glitch: jittering pixel block
      const j = () => (Math.random() - .5) * 4;
      for (const [cx, cy, c] of [[-8, -6, C.pink], [6, -6, C.blue], [-8, 6, C.yellow], [6, 6, col]]) { ctx.fillStyle = c; ctx.fillRect(cx - 6 + j(), cy - 6 + j(), 12, 12); }
    }
    ctx.restore();
  }

  // ---------- Instagram-story score card (1080x1920 PNG) ----------
  async function makeStoryCard(score, result, bestScore) {
    try { await document.fonts?.ready; } catch {}
    const SW = 1080, SH = 1920, cv = document.createElement('canvas');
    cv.width = SW; cv.height = SH;
    const x = cv.getContext('2d'), win = result === 'win';
    x.fillStyle = C.bg; x.fillRect(0, 0, SW, SH);
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280; // same starfield every time
    for (let i = 0; i < 140; i++) { x.globalAlpha = .3 + rnd() * .6; x.fillStyle = C.star; const s = rnd() < .2 ? 6 : 3; x.fillRect(rnd() * SW, rnd() * SH, s, s); }
    x.globalAlpha = 1; x.textAlign = 'center';
    x.fillStyle = '#9fa4b4'; x.font = '600 34px "JetBrains Mono", monospace'; x.fillText('SMZULQURNAIN.WORK PRESENTS', SW / 2, 230);
    x.fillStyle = C.yellow; x.font = '800 160px Montserrat, sans-serif';
    x.fillText('RENDER', SW / 2, 420); x.fillText('INVADERS', SW / 2, 570);
    x.fillStyle = win ? C.ok : C.fail; x.font = '800 70px Montserrat, sans-serif';
    x.fillText(win ? 'FINAL CUT APPROVED' : 'MISSION FAILED', SW / 2, 790);
    x.fillStyle = '#9fa4b4'; x.font = '600 40px "JetBrains Mono", monospace'; x.fillText('SCORE', SW / 2, 930);
    x.fillStyle = '#fff'; x.font = '800 270px Montserrat, sans-serif'; x.fillText(String(score), SW / 2, 1170);
    x.fillStyle = '#9fa4b4'; x.font = '600 40px "JetBrains Mono", monospace'; x.fillText(`BEST ${bestScore}`, SW / 2, 1260);
    ['glitch', 'dropped', 'jump', 'error'].forEach((kind, i) => { x.save(); x.translate(SW / 2 + (i - 1.5) * 190, 1440); x.scale(3.4, 3.4); drawFoe(x, { x: 0, y: 0, kind }, 1); x.restore(); });
    x.fillStyle = C.shot; [0, 1, 2].forEach(i => x.fillRect(SW / 2 - 8, 1520 + i * 50, 16, 34));
    x.save(); x.translate(SW / 2, 1700); x.scale(4.2, 4.2); drawUfo(x, 0, 0, false); x.restore();
    x.fillStyle = '#fff'; x.font = '700 40px Montserrat, sans-serif'; x.fillText('Can you beat it?  →  smzulqurnain.work', SW / 2, 1840);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    return blob ? new File([blob], `render-invaders-${score}.png`, { type: 'image/png' }) : null;
  }
  const canShareFiles = f => !!(f && navigator.canShare && navigator.canShare({ files: [f] }));
  function shareStory(file, score) {
    if (!file) return;
    if (canShareFiles(file)) { // phones: the share sheet, where Instagram → Story lives
      // image only: adding a caption makes some phones offer Instagram DMs instead of Stories
      navigator.share({ files: [file] }).catch(() => {});
      return;
    }
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: file.name }); // computers: save the image
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // ---------- PC → phone hand-off: a QR code that reopens this score card on the phone ----------
  let qrLib = null;
  function loadQR() {
    return qrLib ||= new Promise((ok, fail) => {
      if (window.qrcode) return ok(window.qrcode);
      const s = Object.assign(document.createElement('script'), { src: 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js' });
      s.onload = () => ok(window.qrcode); s.onerror = fail; document.head.append(s);
    });
  }
  const storyLink = (score, result, bestScore) => `${location.origin}/?story=${score}-${result === 'win' ? 'w' : 'f'}-${bestScore}`;
  async function renderQR(box, link) {
    const qrcode = await loadQR(), q = qrcode(0, 'M');
    q.addData(link); q.make();
    box.innerHTML = q.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
  }

  APPS.invaders = function () {
    const el = openWin('invaders', {
      title: 'Render Invaders', w: 560,
      body: `<div class="ri">
        <div class="ri-stage"><canvas></canvas><button class="ri-mute" aria-label="Toggle sound" title="Sound on/off">♪</button></div>
        <div class="ri-hud"><span class="ri-score">Score 0</span><span class="ri-mid">—</span><span class="ri-best">Best ${best}</span></div>
      </div>`,
    });
    if (el.dataset.ready) return el;
    el.dataset.ready = '1';

    const stage = el.querySelector('.ri-stage'), cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    const hud = { score: el.querySelector('.ri-score'), mid: el.querySelector('.ri-mid'), best: el.querySelector('.ri-best') };

    const stars = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() < .2 ? 2 : 1, v: 10 + Math.random() * 25 }));
    let state = 'title', S = null, raf = 0, last = 0, shake = 0;

    function newGame() {
      S = { x: W / 2, tx: W / 2, shots: [], bugs: [], foes: [], boom: [], score: 0, lives: LIVES, t: 0, fire: 0, wave: 0, dir: 1, speed: 26, hurt: 0, result: null };
      spawnWave(); state = 'play'; blip(520, .12, 'triangle', .06, 300);
    }
    function spawnWave() {
      S.wave++; S.foes = [];
      const cols = Math.min(8, 5 + S.wave), gap = 54, x0 = W / 2 - (cols - 1) * gap / 2;
      ROWS.forEach((kind, r) => { for (let c = 0; c < cols; c++) S.foes.push({ kind, x: x0 + c * gap, y: 46 + r * 40, hp: 1 }); });
      S.speed = 26 + S.wave * 10; S.dir = 1;
    }
    function end(result) {
      state = 'over'; S.result = result;
      if (S.score > best) { best = S.score; try { localStorage.setItem('ri-best', best); } catch {} }
      blip(result === 'win' ? 660 : 200, .5, 'triangle', .07, result === 'win' ? 400 : -150);
      const round = S; round.story = null;
      makeStoryCard(round.score, result, best).then(file => {
        round.story = file;
        const b = stage.querySelector('.ri-share'); if (!b || S !== round) return;
        b.disabled = false;
        if (canShareFiles(file)) { b.textContent = 'Share to Story'; return; }
        b.textContent = 'Save story image';
        const box = stage.querySelector('.ri-qr');
        renderQR(box, storyLink(round.score, result, best))
          .then(() => { box.hidden = false; stage.querySelector('.ri-qr-note').hidden = false; })
          .catch(() => {}); // offline or blocked: the download button still works
      });
      overlay();
    }

    // ---------- input: drag / mouse / keys move, firing is automatic ----------
    const toX = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
    cv.addEventListener('pointerdown', e => {
      if (state !== 'play') { newGame(); return; }
      try { cv.setPointerCapture(e.pointerId); } catch {}
      S.tx = toX(e);
    });
    cv.addEventListener('pointermove', e => { if (state === 'play' && (e.pointerType === 'mouse' || e.buttons)) S.tx = toX(e); });
    const keys = {};
    const onKey = e => {
      if (!document.body.contains(el)) return document.removeEventListener('keydown', onKey), document.removeEventListener('keyup', onKey);
      if (!el.classList.contains('front')) return;
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      keys[e.key] = e.type === 'keydown';
      if (e.type === 'keydown' && e.key === ' ' && state !== 'play') newGame();
    };
    document.addEventListener('keydown', onKey); document.addEventListener('keyup', onKey);
    el.querySelector('.ri-mute').onclick = e => { muted = !muted; e.currentTarget.classList.toggle('off', muted); };

    // ---------- loop ----------
    function step(dt) {
      for (const s of stars) { s.y += s.v * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
      if (state !== 'play') return;
      S.t += dt; S.hurt = Math.max(0, S.hurt - dt); shake = Math.max(0, shake - dt * 30);
      if (keys.ArrowLeft) S.tx = S.x - 300 * dt * 3; if (keys.ArrowRight) S.tx = S.x + 300 * dt * 3;
      S.tx = Math.max(32, Math.min(W - 32, S.tx)); S.x += (S.tx - S.x) * Math.min(1, dt * 14);
      // auto-fire
      S.fire -= dt; if (S.fire <= 0) { S.fire = .26; S.shots.push({ x: S.x, y: H - 46 }); blip(880, .04, 'square', .025, -300); }
      S.shots.forEach(s => s.y -= 520 * dt); S.shots = S.shots.filter(s => s.y > -10);
      // formation sweep
      let minX = W, maxX = 0, maxY = 0;
      for (const f of S.foes) { f.x += S.dir * S.speed * dt; minX = Math.min(minX, f.x); maxX = Math.max(maxX, f.x); maxY = Math.max(maxY, f.y); }
      if (maxX > W - 24 || minX < 24) { S.dir *= -1; S.foes.forEach(f => { f.y += 14; f.x += S.dir * 4; }); }
      if (maxY > H - 70) { shake = 8; return end('fail'); }
      // bugs (enemy fire) from the lowest foe in a random column
      if (S.foes.length && Math.random() < dt * (1.2 + S.wave * .4 + S.t / 40)) {
        // some shots come from the foe closest to the UFO's column (so standing still doesn't win)
        const aimed = Math.random() < .4;
        const f = aimed ? S.foes.reduce((a, b) => Math.abs(b.x - S.x) < Math.abs(a.x - S.x) ? b : a) : S.foes[Math.floor(Math.random() * S.foes.length)];
        S.bugs.push({ x: f.x, y: f.y + 12, v: 170 + S.wave * 25 });
      }
      S.bugs.forEach(b => b.y += b.v * dt); S.bugs = S.bugs.filter(b => b.y < H + 10);
      // hits
      for (const s of S.shots) for (const f of S.foes) if (!s.dead && f.hp > 0 && Math.abs(s.x - f.x) < 17 && Math.abs(s.y - f.y) < 15) {
        s.dead = true; f.hp = 0; S.score += FOES[f.kind].pts; burst(f.x, f.y, FOES[f.kind].col); blip(300 + Math.random() * 200, .09, 'sawtooth', .04, -200);
      }
      S.shots = S.shots.filter(s => !s.dead); S.foes = S.foes.filter(f => f.hp > 0);
      if (!S.hurt) for (const b of S.bugs) if (Math.abs(b.x - S.x) < 26 && Math.abs(b.y - (H - 36)) < 12) {
        b.y = H + 99; S.lives--; S.hurt = 1.2; shake = 10; burst(S.x, H - 36, C.ufo); blip(140, .3, 'sawtooth', .07, -80);
        if (S.lives <= 0) return end('fail');
      }
      S.boom.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt; }); S.boom = S.boom.filter(p => p.life > 0);
      if (!S.foes.length) { S.score += 50; spawnWave(); blip(740, .2, 'triangle', .05, 200); }
      if (S.t >= ROUND_S) end('win');
    }
    function burst(x, y, col) { for (let i = 0; i < 12; i++) { const a = Math.random() * 6.28, v = 60 + Math.random() * 160; S.boom.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: .5 + Math.random() * .3, col }); } }

    function draw() {
      ctx.save();
      if (shake) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
      ctx.fillStyle = C.bg; ctx.fillRect(-10, -10, W + 20, H + 20);
      for (const s of stars) { ctx.fillStyle = C.star; ctx.globalAlpha = s.s === 2 ? .9 : .5; ctx.fillRect(s.x, s.y, s.s * 2, s.s * 2); }
      ctx.globalAlpha = 1;
      if (S) {
        const t = performance.now() / 1000;
        S.foes.forEach(f => drawFoe(ctx, f, t));
        ctx.fillStyle = C.shot; S.shots.forEach(s => ctx.fillRect(s.x - 2, s.y - 9, 4, 12));
        ctx.fillStyle = C.red; S.bugs.forEach(b => ctx.fillRect(b.x - 3, b.y - 3, 6, 6));
        S.boom.forEach(p => { ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.col; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }); ctx.globalAlpha = 1;
        if (state === 'play' && !(S.hurt && Math.floor(S.hurt * 10) % 2)) drawUfo(ctx, S.x, H - 36, false);
        if (state === 'over') drawUfo(ctx, S.x, H - 36, false);
      } else drawUfo(ctx, W / 2, H - 36, false);
      ctx.restore();
      // HUD
      if (S) {
        hud.score.textContent = `Score ${S.score}`;
        hud.mid.textContent = state === 'play' ? `${'♥'.repeat(S.lives)}${'♡'.repeat(LIVES - S.lives)} · ${Math.max(0, Math.ceil(ROUND_S - S.t))}s · wave ${S.wave}` : '—';
      }
      hud.best.textContent = `Best ${best}`;
    }
    function loop(now) {
      if (!document.body.contains(el)) return; // window closed: stop
      const dt = Math.max(0, Math.min(.05, (now - last) / 1000 || 0)); last = now;
      if (!document.hidden) { step(dt); draw(); }
      raf = requestAnimationFrame(loop);
    }

    // ---------- title and game-over cards (HTML over the canvas) ----------
    function overlay() {
      stage.querySelector('.ri-card')?.remove();
      const card = document.createElement('div'); card.className = 'ri-card';
      if (state === 'title') {
        card.innerHTML = `<h3 class="ri-title">RENDER<br>INVADERS</h3><p>Blast the bad edits before they hit the final cut.</p>
          <ul class="ri-legend">${Object.values(FOES).map(f => `<li><i style="background:${f.col}"></i>${f.label} <b>${f.pts}</b></li>`).join('')}</ul>
          <p class="ri-go">Tap to start</p><p class="ri-small">Drag or ← → to move · fires automatically · ${ROUND_S}s round</p>`;
      } else {
        const win = S.result === 'win';
        card.innerHTML = `<h3 class="ri-title" style="color:${win ? C.ok : C.fail}">${win ? 'FINAL CUT<br>APPROVED' : 'MISSION<br>FAILED'}</h3>
          <p class="ri-big">Score ${S.score}</p>
          <p class="ri-go">Tap to retry</p>
          <div class="ri-share-row"><div class="ri-qr" hidden></div><div class="ri-share-col"><button class="ri-share" disabled>Making story image…</button><p class="ri-qr-note" hidden>Scan to post it<br>to your Instagram Story</p></div></div>`;
        const sb = card.querySelector('.ri-share');
        card.querySelector('.ri-share-row').addEventListener('pointerdown', e => e.stopPropagation()); // QR + button don't restart
        sb.addEventListener('click', e => { e.stopPropagation(); shareStory(S.story, S.score); });
      }
      card.addEventListener('pointerdown', () => { card.remove(); newGame(); });
      stage.append(card);
    }
    const origNew = newGame;
    newGame = function () { stage.querySelector('.ri-card')?.remove(); origNew(); };

    overlay();
    raf = requestAnimationFrame(loop);
    return el;
  };

  // ---------- secret entrance: the Konami code ----------
  // Keyboard: ↑ ↑ ↓ ↓ ← → ← → B A. Touch: swipe up up down down left right left right, then tap tap.
  const CODE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
  let pos = 0;
  function feed(step) {
    pos = step === CODE[pos] ? pos + 1 : (step === CODE[0] ? 1 : 0);
    if (pos === CODE.length) { pos = 0; unlock(); }
  }
  // the dock icon only exists once the game is "installed"
  const ICON = `<span class="tip" aria-hidden="true">Render Invaders</span><svg viewBox="0 0 40 40"><rect x="3" y="5" width="34" height="30" rx="7" fill="var(--yellow)" stroke="var(--ink)" stroke-width="2.4"/><path d="M14 19a6 6 0 0 1 12 0" fill="var(--mint)" stroke="var(--ink)" stroke-width="2"/><ellipse cx="20" cy="21" rx="11" ry="3.6" fill="#fff" stroke="var(--ink)" stroke-width="2"/><path d="M15 25l-2 4M20 25v4M25 25l2 4" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/></svg>`;
  function installIcon(animate) {
    const dock = document.querySelector('.dock');
    if (!dock || dock.querySelector('[data-open="invaders"]')) return false;
    const b = Object.assign(document.createElement('button'), { innerHTML: ICON });
    b.dataset.open = 'invaders'; b.setAttribute('aria-label', 'Render Invaders');
    if (animate) { // bounce in, then hand back to the normal dock hover
      b.classList.add('ri-installing');
      b.addEventListener('animationend', () => b.classList.remove('ri-installing'), { once: true });
    }
    dock.append(b);
    return true;
  }
  // installed only for this page view: a reload removes it, so the code is needed every visit
  try { localStorage.removeItem('ri-installed'); } catch {} // clear the old saved flag from earlier versions

  function unlock() {
    const fresh = installIcon(true);
    const t = Object.assign(document.createElement('div'), { className: 'ri-toast', textContent: fresh ? '★ Game installed' : '★ Already installed' });
    document.body.append(t); setTimeout(() => t.remove(), 2200);
    blip(660, .1, 'square', .05); setTimeout(() => blip(990, .18, 'square', .05), 110);
    APPS.invaders();
  }
  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', b: 'b', B: 'b', a: 'a', A: 'a' };
  document.addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea, [contenteditable]')) return; // not while typing in the search box
    if (wins.get('invaders')?.classList.contains('front')) return;      // arrows belong to the game while it's open
    const k = KEYMAP[e.key]; k ? feed(k) : (pos = 0);
  });
  // touch: swipes and taps on the empty desktop (not inside windows or the dock)
  let sx = 0, sy = 0, tracking = false;
  document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || e.target.closest('.win, .dock-wrap, .menubar, .widget')) return;
    tracking = true; sx = e.clientX; sy = e.clientY;
  });
  document.addEventListener('pointerup', e => {
    if (!tracking) return; tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy, ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax < 12 && ay < 12) return feed(pos === 8 ? 'b' : 'a'); // the two taps stand in for B and A
    if (Math.max(ax, ay) < 30) return;
    feed(ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  // ---------- opened from the QR code: ?story=<score>-<w|f>-<best> ----------
  const m = new URLSearchParams(location.search).get('story')?.match(/^(\d{1,6})-([wf])-(\d{1,6})$/);
  if (m) {
    history.replaceState(null, '', location.pathname);
    const score = +m[1], result = m[2] === 'w' ? 'win' : 'fail', bestScore = Math.max(+m[3], score);
    window.addEventListener('load', async () => {
      const file = await makeStoryCard(score, result, bestScore);
      if (!file) return;
      const url = URL.createObjectURL(file), phone = canShareFiles(file);
      const w = openWin('story', {
        title: 'Your Render Invaders score', w: 420,
        body: `<div class="ri-story"><img src="${url}" alt="Render Invaders score card: ${score}">
          <button class="ri-share">${phone ? 'Share to Story' : 'Save story image'}</button>
          <p class="ri-small">${phone ? 'Pick Instagram → Story in the share menu.' : 'Open this link on your phone to share to Instagram.'}</p></div>`,
      });
      w.querySelector('.ri-share').onclick = () => shareStory(file, score);
    });
  }
})();
