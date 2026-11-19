// That Editor App — a tiny playable editor on the desktop.
// Tap clips into the timeline, press Play, and the order decides the genre.
(() => {
  const CLIP_S = 2.2, END_S = 3, FPS = 24, W = 960, H = 540;
  const C = { ink: '#141414', paper: '#fdf7ef', sky: '#9fb4f5', grass: '#9bd88f', yellow: '#f5c24f', alien: '#8fd49a', skin: '#f2c1aa', rose: '#b96c6c', dark: '#1b1b20' };
  const CLIPS = {
    ufo:  { name: 'UFO lands',   color: C.sky },
    wave: { name: 'Alien waves', color: C.yellow },
    run:  { name: 'Human runs',  color: C.paper },
    hug:  { name: 'The hug',     color: C.rose },
  };
  const ORDER = ['ufo', 'wave', 'run', 'hug'];

  // ---------- genre: decided by the order of the cut ----------
  function genreOf(seq) {
    if (!seq.length) return null;
    if (seq.length === 1) return { name: 'Teaser', line: 'One shot. Big promise.', mood: 'up' };
    const first = seq[0], last = seq[seq.length - 1], at = id => seq.indexOf(id);
    if (last === 'hug' && at('run') > -1 && at('run') < at('hug')) return { name: 'Rom-com', line: 'He ran. Then he ran back.', mood: 'up' };
    if (last === 'hug') return { name: 'Feel-good', line: 'Close encounters of the cuddly kind.', mood: 'up' };
    if (last === 'run' && first === 'hug') return { name: 'Breakup drama', line: 'It was nice while it lasted.', mood: 'down' };
    if (last === 'run') return { name: 'Horror', line: 'They came in peace. He didn’t stay.', mood: 'down' };
    if (last === 'ufo' && at('hug') > -1) return { name: 'Tearjerker', line: 'Some goodbyes come with a tractor beam.', mood: 'down' };
    if (last === 'ufo') return { name: 'Sci-fi thriller', line: 'The landing was just the beginning.', mood: 'tense' };
    if (last === 'wave' && first === 'run') return { name: 'Comedy', line: 'Runs away. Gets waved at anyway.', mood: 'up' };
    return { name: 'Mockumentary', line: 'Deadpan. Extremely deadpan.', mood: 'up' };
  }

  // ---------- drawing helpers (flat fills, ink outlines) ----------
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);
  function shape(ctx, fill, path, lw = 6) {
    ctx.beginPath(); path(); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }
  const circle = (ctx, x, y, r) => () => ctx.arc(x, y, r, 0, Math.PI * 2);
  function alienHead(ctx, x, y, r, blink = false) {
    shape(ctx, null, () => { ctx.moveTo(x - r * .35, y - r * .85); ctx.lineTo(x - r * .6, y - r * 1.45); ctx.moveTo(x + r * .35, y - r * .85); ctx.lineTo(x + r * .6, y - r * 1.45); });
    shape(ctx, C.alien, circle(ctx, x, y, r));
    for (const s of [-1, 1]) {
      shape(ctx, '#fff', circle(ctx, x + s * r * .32, y - r * .08, r * .22), 4);
      if (!blink) { ctx.beginPath(); ctx.arc(x + s * r * .32, y - r * .08, r * .08, 0, 7); ctx.fillStyle = C.ink; ctx.fill(); }
    }
    shape(ctx, null, () => { ctx.moveTo(x - r * .25, y + r * .45); ctx.lineTo(x + r * .25, y + r * .45); }, 5);
  }
  function heart(ctx, x, y, s, a = 1) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-14, -4, -8, -16, 0, -8); ctx.bezierCurveTo(8, -16, 14, -4, 0, 6);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  }

  // ---------- the four scenes; u = 0..1 through the clip ----------
  const SCENES = {
    ufo(ctx, u, t) {
      ctx.fillStyle = C.sky; ctx.fillRect(0, 0, W, H);
      shape(ctx, C.grass, () => ctx.rect(-10, H * .8, W + 20, H * .3));
      const y = -60 + (H * .3 + 60) * ease(u / .45) + Math.sin(t * 5) * 4;
      if (u > .42) { // tractor beam
        ctx.save(); ctx.globalAlpha = Math.min(1, (u - .42) * 4);
        shape(ctx, C.yellow, () => { ctx.moveTo(W / 2 - 40, y + 20); ctx.lineTo(W / 2 + 40, y + 20); ctx.lineTo(W / 2 + 120, H * .8); ctx.lineTo(W / 2 - 120, H * .8); ctx.closePath(); });
        ctx.restore();
      }
      if (u > .7) { const k = ease((u - .7) / .3); alienHead(ctx, W / 2, H * .8 - 44 * k, 36 * k || .01); }
      shape(ctx, C.alien, () => ctx.ellipse(W / 2, y - 6, 46, 34, 0, Math.PI, 0));
      shape(ctx, C.rose, () => ctx.ellipse(W / 2, y + 10, 150, 30, 0, 0, Math.PI * 2));
    },
    wave(ctx, u, t) {
      ctx.fillStyle = C.yellow; ctx.fillRect(0, 0, W, H);
      const x = W / 2 - 40, y = H / 2 + 20, r = 110;
      const a = -0.9 + Math.sin(t * 9) * 0.45; // waving arm
      shape(ctx, null, () => { ctx.moveTo(x + r * .8, y + r * .3); ctx.lineTo(x + r * .8 + Math.cos(a) * 170, y + r * .3 + Math.sin(a) * 170); }, 10);
      alienHead(ctx, x, y, r, Math.floor(t * 3) % 7 === 0);
    },
    run(ctx, u, t) {
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
      const x = W * .25 + W * .45 * u, y = H * .42, k = t * 14;
      for (let i = 0; i < 3; i++) shape(ctx, null, () => { const yy = y + 10 + i * 34, len = 110 - i * 20; ctx.moveTo(x - 150 - len, yy); ctx.lineTo(x - 150, yy); }, 7);
      shape(ctx, null, () => { // body + limbs
        ctx.moveTo(x, y + 30); ctx.lineTo(x - 18, y + 130);
        ctx.moveTo(x - 18, y + 130); ctx.lineTo(x - 18 + Math.sin(k) * 50, y + 210);
        ctx.moveTo(x - 18, y + 130); ctx.lineTo(x - 18 - Math.sin(k) * 50, y + 210);
        ctx.moveTo(x - 6, y + 70); ctx.lineTo(x - 6 + Math.cos(k) * 60, y + 90);
        ctx.moveTo(x - 6, y + 70); ctx.lineTo(x - 6 - Math.cos(k) * 60, y + 100);
      }, 8);
      shape(ctx, C.skin, circle(ctx, x + 6, y, 32));
    },
    hug(ctx, u, t) {
      ctx.fillStyle = C.rose; ctx.fillRect(0, 0, W, H);
      const gap = 70 * (1 - ease(u / .4)), cx = W / 2, y = H * .5;
      shape(ctx, null, () => { ctx.moveTo(cx + 40 + gap, y + 40); ctx.quadraticCurveTo(cx + 70 + gap, y + 130, cx + 50 + gap, y + 200); }, 9); // human body
      alienHead(ctx, cx - 50 - gap, y + 20, 80);
      shape(ctx, C.skin, circle(ctx, cx + 60 + gap, y - 30, 38));
      shape(ctx, null, () => { ctx.moveTo(cx + 30 + gap, y + 60); ctx.quadraticCurveTo(cx - 20, y + 110, cx - 90 - gap, y + 70); }, 8); // the hug
      if (u > .4) { const k = (u - .4) / .6; heart(ctx, cx, y - 110 - k * 60, 3 + k * 2, 1 - k * .6); heart(ctx, cx - 90, y - 60 - k * 90, 2, Math.max(0, 1 - k * 1.4)); }
    },
  };

  function endCard(ctx, g, u) {
    ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.globalAlpha = ease(u * 3);
    ctx.font = '600 22px "JetBrains Mono", monospace'; ctx.fillText('YOUR CUT IS A', W / 2, H / 2 - 70);
    ctx.font = '800 84px "Bricolage Grotesque", sans-serif'; ctx.fillText(g.name, W / 2, H / 2 + 10);
    ctx.globalAlpha = ease((u - .2) * 3);
    ctx.font = '500 28px Inter, sans-serif'; ctx.fillText(`“${g.line}”`, W / 2, H / 2 + 70);
    ctx.globalAlpha = ease((u - .55) * 3); ctx.font = '600 18px "JetBrains Mono", monospace'; ctx.fillText('THE END', W / 2, H - 50);
    ctx.globalAlpha = 1;
  }

  function placeholder(ctx, msg) {
    ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '800 54px "Bricolage Grotesque", sans-serif'; ctx.fillText(msg, W / 2, H / 2 + 18);
  }
  function timecode(ctx, sec) {
    const f = Math.floor(sec * FPS), ff = f % FPS, s = Math.floor(f / FPS) % 60, m = Math.floor(f / FPS / 60);
    const tc = [m, s, ff].map(n => String(n).padStart(2, '0')).join(':');
    ctx.textAlign = 'left'; ctx.font = '700 26px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(22, 18, 150, 40);
    ctx.fillStyle = '#fff'; ctx.fillText(tc, 34, 47);
  }

  // ---------- sound: a tiny synth bed, mood set by the genre ----------
  let actx = null, master = null, muted = false;
  function audio() {
    if (!actx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; actx = new A(); master = actx.createGain(); master.gain.value = 0.07; master.connect(actx.destination); }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function note(freq, at, dur, type = 'triangle') {
    if (!actx || muted) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq; o.connect(g); g.connect(master);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(1, at + .02); g.gain.exponentialRampToValueAtTime(.001, at + dur);
    o.start(at); o.stop(at + dur + .05);
  }
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  const MOTIF = { ufo: [60, 67, 72, 79], wave: [64, 67, 71, 67], run: [62, 65, 69, 72], hug: [65, 69, 72, 76] };
  const STING = { up: [60, 64, 67, 72], down: [57, 60, 64, 69].map(n => n - 12), tense: [59, 62, 65, 68] };
  function score(seq, g, t0) {
    seq.forEach((id, i) => MOTIF[id].forEach((n, j) => note(hz(n), t0 + i * CLIP_S + j * CLIP_S / 4, .45)));
    const te = t0 + seq.length * CLIP_S;
    STING[g.mood].forEach((n, j) => note(hz(n), te + j * .12, 1.6, 'sine'));
  }

  // ---------- the app window ----------
  const clipSvg = {
    ufo: `<svg viewBox="0 0 80 50"><rect width="80" height="50" fill="${C.sky}"/><rect x="2" y="38" width="76" height="9" fill="${C.grass}" stroke="${C.ink}" stroke-width="1.6"/><path d="M34 16h12l9 22H25z" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.6"/><ellipse cx="40" cy="15" rx="20" ry="4.5" fill="${C.rose}" stroke="${C.ink}" stroke-width="1.6"/></svg>`,
    wave: `<svg viewBox="0 0 80 50"><rect width="80" height="50" fill="${C.yellow}"/><path d="M33 16l-3-7M43 16l3-7M50 30l12-14" stroke="${C.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="38" cy="28" r="11" fill="${C.alien}" stroke="${C.ink}" stroke-width="1.6"/><circle cx="34.5" cy="27" r="2.6" fill="#fff" stroke="${C.ink}"/><circle cx="41.5" cy="27" r="2.6" fill="#fff" stroke="${C.ink}"/><path d="M36 33h4" stroke="${C.ink}" stroke-width="1.4"/></svg>`,
    run: `<svg viewBox="0 0 80 50"><rect width="80" height="50" fill="${C.paper}"/><path d="M14 22h12M16 28h10M18 34h8M46 18l-4 14-6 10M42 32l7 8M44 24l-8 2M44 24l9 3" stroke="${C.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="47" cy="13" r="4.5" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.6"/></svg>`,
    hug: `<svg viewBox="0 0 80 50"><rect width="80" height="50" fill="${C.rose}"/><path d="M40 8c-3-3-6 0-3 3l3 3 3-3c3-3 0-6-3-3z" fill="#fff"/><path d="M48 26c3 8 2 14 0 18" stroke="${C.ink}" stroke-width="1.8" fill="none"/><circle cx="36" cy="30" r="9" fill="${C.alien}" stroke="${C.ink}" stroke-width="1.6"/><circle cx="48" cy="22" r="4.5" fill="${C.skin}" stroke="${C.ink}" stroke-width="1.6"/><path d="M47 30c-5 4-12 5-16 3" stroke="${C.ink}" stroke-width="1.6" fill="none"/></svg>`,
  };

  APPS.editor = function () {
    const el = openWin('editor', {
      title: 'That Editor App — untitled_mission.prj', w: 640,
      body: `<div class="tea">
        <nav class="tea-menu"><button data-act="new">File</button><button data-act="undo">Edit</button><button data-act="play">Clip</button><button data-act="abduct" title="Shuffle the timeline">Abduct</button><button data-act="help">Help</button></nav>
        <section class="tea-sec"><div class="tea-head"><b>Media bin</b><span>tap to add to the timeline</span></div>
          <div class="tea-bin">${ORDER.map(id => `<button class="tea-clip" data-add="${id}">${clipSvg[id]}<span>${CLIPS[id].name}</span></button>`).join('')}</div></section>
        <section class="tea-sec"><div class="tea-head"><b>Program monitor</b><span class="tea-status">empty</span></div>
          <div class="tea-monitor"><canvas width="${W}" height="${H}"></canvas><button class="tea-mute" title="Sound on/off" aria-label="Toggle sound">♪</button></div>
          <div class="tea-ctrl"><button data-act="undo" class="btn ghost">↶ Undo</button><button data-act="play" class="btn tea-play">▶ Play</button><button data-act="export" class="btn tea-export">Export</button><button data-act="clear" class="btn ghost">Clear</button></div></section>
        <section class="tea-sec"><div class="tea-head"><b>Timeline</b><span class="tea-count">0 / 4 clips</span></div>
          <div class="tea-track"><i>V1</i><div class="tea-v1"></div></div>
          <div class="tea-track"><i>A1</i><div class="tea-a1">♪ <span></span></div></div>
          <p class="tea-hint">Tap a timeline clip to remove it. Different orders make different genres.</p></section>
      </div>`,
    });
    if (el.dataset.ready) return el;
    el.dataset.ready = '1';

    const $ = s => el.querySelector(s);
    const cv = $('canvas'), ctx = cv.getContext('2d');
    let seq = [], hist = [], playing = false, raf = 0, startAt = 0, recorder = null;

    const set = next => { hist.push(seq.slice()); seq = next; stop(); render(); };
    function render() {
      $('.tea-v1').innerHTML = seq.length
        ? seq.map((id, i) => `<button class="tea-block" data-del="${i}" style="--c:${CLIPS[id].color}">${CLIPS[id].name}</button>`).join('')
        : '';
      $('.tea-v1').classList.toggle('empty', !seq.length);
      $('.tea-a1').classList.toggle('on', seq.length > 0);
      $('.tea-a1 span').textContent = '∿'.repeat(Math.max(8, seq.length * 14));
      $('.tea-count').textContent = `${seq.length} / 4 clips`;
      el.querySelectorAll('[data-add]').forEach(b => b.disabled = seq.includes(b.dataset.add));
      el.querySelectorAll('[data-act="undo"]').forEach(b => b.disabled = !hist.length);
      el.querySelectorAll('[data-act="clear"],[data-act="play"],[data-act="export"],[data-act="abduct"]').forEach(b => b.disabled = !seq.length || !!recorder);
      const g = genreOf(seq);
      $('.tea-status').textContent = recorder ? 'rendering…' : playing ? 'playing' : seq.length ? `${g.name.toLowerCase()} · ${(seq.length * CLIP_S + END_S).toFixed(1)}s` : 'empty';
      if (!playing) poster();
    }
    function poster() {
      if (!seq.length) return placeholder(ctx, 'Add clips to start editing');
      SCENES[seq[0]](ctx, 0.999, 0); timecode(ctx, 0);
    }
    function frame(sec) {
      const i = Math.floor(sec / CLIP_S);
      if (i < seq.length) { const u = (sec - i * CLIP_S) / CLIP_S; SCENES[seq[i]](ctx, u, sec); timecode(ctx, sec); }
      else endCard(ctx, genreOf(seq), (sec - seq.length * CLIP_S) / END_S);
    }
    function play(onDone) {
      if (!seq.length) return;
      stop(); playing = true; render();
      const a = audio(); if (a) score(seq, genreOf(seq), a.currentTime + .05);
      startAt = performance.now();
      const total = seq.length * CLIP_S + END_S;
      const tick = now => {
        // rAF's timestamp can be a few ms earlier than startAt on the first frame
        const sec = Math.max(0, (now - startAt) / 1000);
        if (sec >= total || !document.body.contains(el)) { frame(total - .001); playing = false; render(); onDone?.(); return; }
        frame(sec); raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    function stop() { cancelAnimationFrame(raf); playing = false; }

    // export: record the canvas (and the synth) while it plays, then hand the file to the visitor
    function exportCut() {
      if (!seq.length || recorder || !cv.captureStream || !window.MediaRecorder) {
        if (!window.MediaRecorder) $('.tea-status').textContent = 'export isn’t supported in this browser';
        return;
      }
      const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
      const type = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      const stream = cv.captureStream(30);
      const a = audio();
      if (a && !muted) { const dest = a.createMediaStreamDestination(); master.connect(dest); dest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr)); }
      const chunks = [];
      recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const ext = /mp4/.test(blob.type) ? 'mp4' : 'webm';
        const g = genreOf(seq);
        const a2 = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `untitled_mission_${g.name.toLowerCase().replace(/[^a-z]+/g, '-')}.${ext}` });
        document.body.append(a2); a2.click(); a2.remove();
        setTimeout(() => URL.revokeObjectURL(a2.href), 4000);
        recorder = null; render();
        $('.tea-status').textContent = `exported ${ext.toUpperCase()} ✓`;
      };
      recorder.start(); render();
      play(() => setTimeout(() => recorder && recorder.stop(), 150));
    }

    el.addEventListener('click', e => {
      const add = e.target.closest('[data-add]'), del = e.target.closest('[data-del]'), act = e.target.closest('[data-act]');
      if (add && !add.disabled && seq.length < 4) return set([...seq, add.dataset.add]);
      if (del) { const i = +del.dataset.del; return set(seq.filter((_, j) => j !== i)); }
      if (e.target.closest('.tea-mute')) { muted = !muted; e.target.closest('.tea-mute').classList.toggle('off', muted); return; }
      if (!act || act.disabled) return;
      const a = act.dataset.act;
      if (a === 'play') play();
      else if (a === 'undo' && hist.length) { seq = hist.pop(); stop(); render(); }
      else if (a === 'clear' || a === 'new') { if (seq.length) set([]); }
      else if (a === 'abduct' && seq.length > 1) { // shuffle into a different order
        let s;
        do { s = seq.slice(); for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } } while (s.join() === seq.join());
        set(s);
      }
      else if (a === 'export') exportCut();
      else if (a === 'help') $('.tea-hint').classList.toggle('flash');
    });
    // fonts load after first paint; redraw once they're ready so canvas text uses them
    (document.fonts?.ready || Promise.resolve()).then(() => playing || poster());
    render();
    return el;
  };
})();
