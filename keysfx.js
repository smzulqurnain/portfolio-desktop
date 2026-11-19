// Mechanical keyboard sounds: every key press "clacks", synthesised in the browser (no audio files).
(() => {
  const BIG = new Set([' ', 'Enter', 'Backspace', 'Shift', 'Tab', 'CapsLock']);
  let ctx = null, master = null, noise = null, off = false;
  try { off = localStorage.getItem('ksfx-off') === '1'; } catch {}

  function audio() {
    if (!ctx) {
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
      ctx = new A();
      master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
      // a short burst of white noise, reused for every click
      noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // one key sound: a filtered noise "click" plus a low body "thock"
  function clack({ big = false, up = false } = {}) {
    const a = audio(); if (!a) return;
    const t = a.currentTime, r = (lo, hi) => lo + Math.random() * (hi - lo);
    const vol = up ? 0.35 : 1;

    const src = a.createBufferSource(); src.buffer = noise;
    src.playbackRate.value = r(0.9, 1.15);
    const bp = a.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = big ? r(1200, 1700) : up ? r(3200, 4200) : r(2200, 3200);
    bp.Q.value = r(1.2, 2.2);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * vol, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.07 : 0.045));
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t); src.stop(t + 0.08);

    if (up) return;
    const o = a.createOscillator(), og = a.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(big ? r(110, 140) : r(170, 230), t);
    o.frequency.exponentialRampToValueAtTime(big ? 60 : 90, t + 0.05);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(big ? 0.55 : 0.3, t + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.09 : 0.05));
    o.connect(og); og.connect(master);
    o.start(t); o.stop(t + 0.1);
  }

  // the game keeps its own sound effects while it's in front
  const gameInFront = () => document.querySelector('.win.front')?.querySelector('.ri');

  document.addEventListener('keydown', e => {
    if (off || e.repeat || gameInFront()) return; // a held key only clicks once
    clack({ big: BIG.has(e.key) });
  });
  document.addEventListener('keyup', e => {
    if (off || gameInFront()) return;
    clack({ big: BIG.has(e.key), up: true });
  });

  // menu-bar toggle
  const btn = document.getElementById('ksfx');
  const sync = () => {
    if (!btn) return;
    btn.classList.toggle('off', off);
    btn.setAttribute('aria-pressed', String(!off));
    btn.title = off ? 'Keyboard sounds: off' : 'Keyboard sounds: on';
  };
  btn?.addEventListener('click', () => {
    off = !off;
    try { localStorage.setItem('ksfx-off', off ? '1' : '0'); } catch {}
    sync();
    if (!off) clack(); // a little confirmation click
  });
  sync();
})();
