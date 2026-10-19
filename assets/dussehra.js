/* Dussehra greeting. Shri Ram (far left) looses an arrow at the Ravan effigy (far right), it bursts
   into pixel fireworks, "10 heads. 0 rizz." forms, then the whole scene shatters into the portfolio.
   Uses the site's own theme colours and fonts. Once per visit, Oct 17-23 (IST); ?dussehra=1 previews.
   Click, tap or Esc skips straight to the shatter. Reduced motion: a short fade only. */
(function () {
  var START = new Date('2026-10-17T00:00:00+05:30'), END = new Date('2026-10-23T23:59:59+05:30');
  var force = /[?&]dussehra=1/.test(location.search), now = new Date();
  if (!force && (now < START || now > END)) return;
  try { if (!force && sessionStorage.getItem('dussehra-seen') === '1') return; sessionStorage.setItem('dussehra-seen', '1'); } catch (e) {}
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var cs = getComputedStyle(document.documentElement), v = function (n, d) { return (cs.getPropertyValue(n) || '').trim() || d; };
  var PAGE = v('--page', '#1B1621'), INK = v('--ink', '#F4EFF4'), META = v('--meta', '#B4A9B8'), ACC = v('--accent', '#EAA5DD'),
      SOFT = v('--soft', '#7E5C7C'), DEEP = v('--deep', '#F2B7E8'), FIELD = v('--field', '#251E2D');
  var SERIF = '"Instrument Serif", Georgia, serif', SANS = 'Geist, system-ui, sans-serif', MONO = '"Geist Mono", ui-monospace, monospace';

  var st = document.createElement('style');
  st.textContent = '.dsh{position:fixed;inset:0;z-index:2147483000;overflow:hidden;cursor:pointer}' +
    '.dsh canvas{position:absolute;inset:0;width:100%;height:100%}' +
    '.dsh-ui{position:absolute;top:max(18px,env(safe-area-inset-top));right:18px;display:flex;gap:8px;z-index:2}' +
    '.dsh-ui button{padding:9px 14px;border:1px solid ' + META + ';background:transparent;color:' + INK + ';font:500 11px/1 ' + MONO + ';letter-spacing:.12em;text-transform:uppercase;cursor:pointer}' +
    '.dsh-ui button:focus-visible{outline:2px solid ' + ACC + ';outline-offset:3px}' +
    '.dsh-sub{position:absolute;left:0;right:0;text-align:center;color:' + INK + ';font:500 clamp(16px,1.9vw,22px)/1.4 ' + SANS + ';opacity:0;transition:opacity .5s;pointer-events:none;padding:0 24px}' +
    '.dsh-sub small{display:block;font-size:.78em;color:' + META + ';margin-top:4px}' +
    '.dsh-sub.show{opacity:1}.dsh-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}';
  document.head.appendChild(st);
  var root = document.createElement('div'); root.className = 'dsh'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Happy Dussehra');
  root.innerHTML = '<canvas aria-hidden="true"></canvas><div class="dsh-ui"><button type="button" class="dsh-snd" aria-pressed="false">🔇 Sound</button><button type="button" class="dsh-skip">Skip</button></div>' +
    '<p class="dsh-sub">Happy Dussehra! Achhai always wins. 🏹<small>Buraai par achhai ki jeet.</small></p>' +
    '<p class="dsh-sr" aria-live="polite">10 heads. 0 rizz. Happy Dussehra! Achhai always wins. Buraai par achhai ki jeet.</p>';
  document.body.appendChild(root);
  var cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), sub = root.querySelector('.dsh-sub'), sndBtn = root.querySelector('.dsh-snd');
  var prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
  var done = false, raf = 0;
  function finish() { if (done) return; done = true; cancelAnimationFrame(raf); removeEventListener('keydown', onKey); removeEventListener('resize', layout);
    root.remove(); st.remove(); document.documentElement.style.overflow = prevOverflow; }

  /* sound: browsers only allow audio after a tap, so the Sound button unlocks it */
  var AC = null, soundOn = false;
  function tone(f, d, type, vol, at) { if (!soundOn || !AC) return; var t = AC.currentTime + (at || 0), o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.02); }
  function sfx(n) {
    if (n === 'arrow') [988, 880, 784, 659, 523].forEach(function (f, i) { tone(f, 0.06, 'triangle', 0.05, i * 0.035); });
    if (n === 'boom') { tone(98, 0.4, 'sawtooth', 0.08); tone(65, 0.55, 'square', 0.05, 0.04); for (var i = 0; i < 8; i++) tone(900 + Math.random() * 900, 0.05, 'square', 0.02, 0.12 + i * 0.07); }
    if (n === 'shatter') for (var j = 0; j < 10; j++) tone(1400 - j * 90, 0.04, 'square', 0.018, j * 0.03);
  }
  sndBtn.addEventListener('click', function (e) { e.stopPropagation(); soundOn = !soundOn;
    if (soundOn) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (x) {} try { localStorage.setItem('sound', 'true'); } catch (x) {} }
    sndBtn.textContent = soundOn ? '🔊 Sound' : '🔇 Sound'; sndBtn.setAttribute('aria-pressed', String(soundOn)); });
  try { soundOn = JSON.parse(localStorage.getItem('sound') || 'false') === true; } catch (e) {}
  if (soundOn) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { soundOn = false; } sndBtn.textContent = '🔊 Sound'; sndBtn.setAttribute('aria-pressed', 'true'); }

  if (reduced) { cv.style.background = PAGE; sub.style.top = '45%'; sub.classList.add('show'); setTimeout(finish, 2600); root.addEventListener('click', finish); return; }

  /* draw a silhouette at k times the base resolution, read it back as coloured cells */
  function sprite(w, h, k, paint) {
    var c = document.createElement('canvas'); c.width = w * k; c.height = h * k; var x = c.getContext('2d'); x.scale(k, k); paint(x);
    var d = x.getImageData(0, 0, c.width, c.height).data, out = [];
    for (var j = 0; j < c.height; j++) for (var i = 0; i < c.width; i++) { var q = (j * c.width + i) * 4; if (d[q + 3] > 150) out.push([i, j, 'rgb(' + d[q] + ',' + d[q + 1] + ',' + d[q + 2] + ')']); }
    var minX = 1e9, maxX = 0; out.forEach(function (q) { if (q[0] < minX) minX = q[0]; if (q[0] > maxX) maxX = q[0]; });
    return { cells: out, w: c.width, h: c.height, minX: minX, maxX: maxX };
  }
  function rect(x, c, a, b, w, h) { x.fillStyle = c; x.fillRect(a, b, w, h); }
  function circ(x, c, a, b, r) { x.fillStyle = c; x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); }
  function poly(x, c, p) { x.fillStyle = c; x.beginPath(); x.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) x.lineTo(p[i], p[i + 1]); x.closePath(); x.fill(); }
  function ram(k, pull) {
    return sprite(46, 60, k, function (x) {
      poly(x, DEEP, [14, 6, 20, 0, 26, 6]); rect(x, INK, 14, 6, 12, 3);           // crown
      circ(x, ACC, 20, 13, 5); rect(x, ACC, 18, 17, 4, 3);                         // head, neck
      poly(x, ACC, [13, 20, 27, 20, 25, 38, 15, 38]);                              // torso
      poly(x, DEEP, [15, 37, 25, 37, 27, 44, 13, 44]);                             // dhoti waist
      poly(x, ACC, [13, 44, 19, 44, 17, 59, 11, 59]); poly(x, ACC, [21, 44, 27, 44, 31, 59, 25, 59]);   // legs
      poly(x, ACC, [25, 22, 39, 20, 39, 23, 25, 26]);                              // bow arm
      var hx = 26 - pull * 8; poly(x, ACC, [15, 22, hx, 21, hx, 24, 15, 26]);      // drawing arm
      x.strokeStyle = DEEP; x.lineWidth = 2; x.beginPath(); x.arc(32, 22, 14, -1.15, 1.15); x.stroke();
      x.strokeStyle = INK; x.lineWidth = 0.7; x.beginPath(); x.moveTo(37.5, 9.2); x.lineTo(hx, 22.5); x.lineTo(37.5, 34.8); x.stroke();
      if (pull > 0.05) rect(x, INK, hx, 22, 44 - hx, 0.9);                         // nocked arrow
    });
  }
  function ravan(k) {
    return sprite(96, 100, k, function (x) {
      rect(x, FIELD, 28, 94, 40, 6);                                               // platform
      poly(x, SOFT, [36, 46, 60, 46, 70, 94, 26, 94]);                             // robe
      for (var y = 54; y < 94; y += 9) rect(x, META, 28, y, 40, 1.6);              // bands
      rect(x, DEEP, 46, 48, 4, 46);                                                // centre panel
      poly(x, SOFT, [24, 46, 36, 44, 36, 54, 20, 62]); poly(x, SOFT, [60, 44, 72, 46, 76, 62, 60, 54]);
      rect(x, META, 16, 60, 7, 4); rect(x, META, 73, 60, 7, 4);                    // bangles
      rect(x, META, 44, 42, 8, 5);
      function head(cx, cy, r, main) {
        circ(x, META, cx, cy, r);
        poly(x, INK, [cx - r, cy - r * 0.55, cx - r * 0.55, cy - r * 1.9, cx, cy - r * 0.8, cx + r * 0.55, cy - r * 1.9, cx + r, cy - r * 0.55]);
        var e = Math.max(0.8, r * 0.26);
        rect(x, PAGE, cx - r * 0.55, cy - r * 0.1, e, e); rect(x, PAGE, cx + r * 0.28, cy - r * 0.1, e, e);
        rect(x, PAGE, cx - r * 0.5, cy + r * 0.38, r, Math.max(0.8, r * 0.16));
      }
      [-4, -3, -2, -1, 1, 2, 3, 4, 5].forEach(function (n) { head(48 + n * 9.3 - (n === 5 ? 1 : 0), 34, 5, false); });
      head(48, 32, 8.5, true);
    });
  }

  var W, H, C, G, ground, RAM, RAV, rx, ry, vx, vy, stars, k;
  function layout() {
    var D = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; ctx.setTransform(D, 0, 0, D, 0, 0);
    C = W < 700 ? 2 : 4; G = C >= 3 ? C - 1 : C;                                   // small square pixels (G: drawn size, leaves a hairline gap)
    ground = H - Math.max(24, H * 0.06);
    var target = Math.min(H * 0.62, W < 700 ? W * 0.62 : W * 0.32);                // figure height in px
    k = Math.max(1, Math.min(Math.round(target / C / 60), Math.floor(W * 0.36 / C / 46)));            // Shri Ram, never wider than about a third
    RAV = ravan(Math.max(1, Math.min(Math.round(target * 0.95 / C / 100), Math.floor(W * 0.46 / C / 96))));   // nor the effigy
    var R0 = ram(k, 0);
    rx = Math.round(W * 0.03 - R0.minX * C); ry = ground - 60 * k * C;            // Shri Ram's visible pixels start 3% from the left
    vx = Math.round(W * 0.97 - (RAV.maxX + 1) * C); vy = ground - RAV.h * C;      // Ravan's visible pixels end 3% from the right
    stars = []; for (var i = 0; i < 110; i++) stars.push([Math.random() * W, Math.random() * (ground - 40), Math.random()]);
    sub.style.top = Math.round(H * 0.5) + 'px';
  }
  layout(); addEventListener('resize', layout);

  /* the headline, sampled into pixels so it can shatter */
  var TEXT = null;
  function buildText() {
    var c = document.createElement('canvas'), x = c.getContext('2d'), size = Math.round(Math.min(W * (W < 700 ? 0.16 : 0.085), H * 0.16));
    c.width = W; c.height = Math.round(size * 2.4);
    x.fillStyle = ACC; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.font = '400 ' + size + 'px ' + SERIF;
    x.fillText('10 heads.', W / 2, size * 1.0); x.fillText('0 rizz. 💀', W / 2, size * 2.15);
    var d = x.getImageData(0, 0, c.width, c.height).data, out = [], step = C - 1, top = Math.round(H * 0.5) - c.height - 10;
    for (var j = 0; j < c.height; j += step) for (var i = 0; i < c.width; i += step) { var q = (j * c.width + i) * 4;
      if (d[q + 3] > 120) out.push({ x: i, y: top + j, c: 'rgb(' + d[q] + ',' + d[q + 1] + ',' + d[q + 2] + ')', r: Math.random() }); }
    TEXT = out;
  }

  var parts = [], exploded = false, shattered = false, tShatter = 99, t0 = 0, playedArrow = false;
  function skip() { if (!exploded || shattered) { tSkip = true; } }
  var tSkip = false;
  root.addEventListener('click', function () { tSkip = true; });
  function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') tSkip = true; }
  addEventListener('keydown', onKey);
  root.querySelector('.dsh-skip').addEventListener('click', function (e) { e.stopPropagation(); tSkip = true; });

  function burst(list, cx, cy, power) { list.forEach(function (p) { var a = Math.atan2(p.y - cy, p.x - cx) + (Math.random() - 0.5) * 0.6, s = power * (0.4 + Math.random());
    parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - power * 0.35, c: p.c, life: 0.9 + Math.random() * 0.9, g: 420 }); }); }

  function frame(ts) {
    if (done) return; if (!t0) t0 = ts; var t = (ts - t0) / 1000, dt = 1 / 60;
    if (tSkip && tShatter > t) { tShatter = t; if (!TEXT) buildText(); }
    var fadeOut = Math.max(0, Math.min(1, (t - tShatter - 0.35) / 0.55));         // background dissolves after the shatter
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1 - fadeOut; ctx.fillStyle = PAGE; ctx.fillRect(0, 0, W, H);
    stars.forEach(function (s) { ctx.globalAlpha = (1 - fadeOut) * (0.25 + 0.55 * Math.abs(Math.sin(t * 1.4 + s[2] * 9))); ctx.fillStyle = INK; ctx.fillRect(s[0], s[1], 2, 2); });
    ctx.globalAlpha = (1 - fadeOut) * 0.6; ctx.fillStyle = SOFT; ctx.fillRect(0, ground, W, 1);   // thin ground line
    ctx.globalAlpha = 1;
    // Shri Ram, with a soft glow
    var pull = t < 0.4 ? 0 : t < 1.1 ? (t - 0.4) / 0.7 : 0;
    if (!shattered) {
      RAM = ram(k, pull);
      var gx = rx + 20 * k * C, gy = ry + 13 * k * C, g = ctx.createRadialGradient(gx, gy, 2, gx, gy, 20 * k * C);
      g.addColorStop(0, ACC); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 0.28; ctx.fillStyle = g; ctx.fillRect(gx - 20 * k * C, gy - 20 * k * C, 40 * k * C, 40 * k * C); ctx.globalAlpha = 1;
      RAM.cells.forEach(function (c) { ctx.fillStyle = c[2]; ctx.fillRect(rx + c[0] * C, ry + c[1] * C, G, G); });
    }
    // the arrow
    var sx = rx + 44 * k * C, sy = ry + 22 * k * C, ex = vx + RAV.w * C * 0.5, ey = vy + RAV.h * C * 0.58;
    if (t >= 1.1 && !playedArrow) { playedArrow = true; sfx('arrow'); }
    if (t >= 1.1 && t < 1.75 && !exploded) {
      var p = (t - 1.1) / 0.65;
      for (var n = 0; n < 26; n++) { var q = Math.max(0, p - n * 0.01), ax = sx + (ex - sx) * q, ay = sy + (ey - sy) * q - Math.sin(q * Math.PI) * H * 0.05;
        ctx.globalAlpha = 1 - n / 26; ctx.fillStyle = n < 4 ? INK : ACC; ctx.fillRect(ax, ay, C, C); }
      ctx.globalAlpha = 1;
    }
    // Ravan, until the arrow lands
    if (t < 1.75 && !exploded) RAV.cells.forEach(function (c) { ctx.fillStyle = c[2]; ctx.fillRect(vx + c[0] * C, vy + c[1] * C, G, G); });
    else if (!exploded) {
      exploded = true; sfx('boom');
      burst(RAV.cells.map(function (c) { return { x: vx + c[0] * C, y: vy + c[1] * C, c: c[2] }; }), ex, ey, 520);
      [[-0.08, -0.32], [0.06, -0.48], [-0.2, -0.55]].forEach(function (o, m) { var bx = ex + o[0] * W, by = ey + o[1] * H, cols = [ACC, INK, DEEP, SOFT];
        for (var i = 0; i < 60; i++) { var a = i / 60 * 6.283, s = 160 + Math.random() * 180; parts.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: cols[(i + m) % 4], life: 1.2 + Math.random() * 0.6, g: 70, delay: 0.15 + m * 0.2 }); } });
    }
    if (exploded) {
      var since = t - 1.75, flash = Math.max(0, 1 - since * 5);
      if (flash > 0 && !shattered) { ctx.globalAlpha = flash * 0.14; ctx.fillStyle = DEEP; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      // the headline forms from scattered pixels, then holds
      if (since > 0.6 && !TEXT) buildText();
      if (TEXT && !shattered) {
        var form = Math.min(1, Math.max(0, (since - 0.6) / 0.5));
        TEXT.forEach(function (p) { if (p.r < form * 1.15) { ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, G, G); } });
        if (form >= 1 && !sub.classList.contains('show')) sub.classList.add('show');
        if (since > 3.1 && tShatter > t) tShatter = t;                          // hold, then shatter on its own
      }
    }
    // the shatter: headline and Shri Ram fly apart, the page shows through
    if (t >= tShatter && !shattered) {
      shattered = true; sfx('shatter'); sub.classList.remove('show');
      if (!TEXT) buildText();
      burst(TEXT, W / 2, H * 0.4, 380);
      if (RAM) burst(RAM.cells.map(function (c) { return { x: rx + c[0] * C, y: ry + c[1] * C, c: c[2] }; }), rx + 20 * k * C, ry + 30 * k * C, 260);
      if (!exploded) { exploded = true; burst(RAV.cells.map(function (c) { return { x: vx + c[0] * C, y: vy + c[1] * C, c: c[2] }; }), ex, ey, 300); }
    }
    parts.forEach(function (q) {
      if (q.delay && t - 1.75 < q.delay) return; q.life -= dt; if (q.life <= 0) return;
      q.vy += q.g * dt; q.vx *= 0.985; q.x += q.vx * dt; q.y += q.vy * dt;
      ctx.globalAlpha = Math.min(1, q.life * 1.4); ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, G, G);
    });
    ctx.globalAlpha = 1;
    if (shattered && t - tShatter > 1.6) return finish();
    raf = requestAnimationFrame(frame);
  }
  var go = function () { raf = requestAnimationFrame(frame); };
  if (document.fonts && document.fonts.load) Promise.race([document.fonts.load('400 80px "Instrument Serif"'), new Promise(function (r) { setTimeout(r, 600); })]).then(go, go); else go();
})();
