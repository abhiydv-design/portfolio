/* Dussehra greeting: Shri Ram's arrow meets the Ravan effigy, it bursts into pixel fireworks,
   then a greeting appears. Plays once per visit, only around Dussehra. Skippable, reduced-motion aware. */
(function () {
  var START = new Date('2026-10-17T00:00:00+05:30'), END = new Date('2026-10-23T23:59:59+05:30');
  var force = /[?&]dussehra=1/.test(location.search);
  var now = new Date(); if (!force && (now < START || now > END)) return;
  try { if (!force && sessionStorage.getItem('dussehra-seen') === '1') return; sessionStorage.setItem('dussehra-seen', '1'); } catch (e) {}
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var css = '.dsh{position:fixed;inset:0;z-index:2147483000;background:#140F1C;overflow:hidden;opacity:0;transition:opacity .4s}' +
    '.dsh.on{opacity:1}.dsh canvas{position:absolute;inset:0;width:100%;height:100%}' +
    '.dsh-skip{position:absolute;top:max(20px,env(safe-area-inset-top));right:20px;z-index:2;padding:10px 18px;border:1px solid rgba(255,255,255,.5);background:transparent;color:#fff;font:500 12px/1 "Geist Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}' +
    '.dsh-msg{position:absolute;left:50%;top:50%;z-index:2;width:min(640px,calc(100vw - 40px));transform:translate(-50%,-40%);opacity:0;transition:opacity .6s,transform .6s;text-align:center;color:#FFF4DE}' +
    '.dsh-msg.show{opacity:1;transform:translate(-50%,-50%)}' +
    '.dsh-msg h2{margin:0 0 10px;font:400 clamp(48px,9vw,96px)/1 "Instrument Serif",Georgia,serif;color:#FFC94D;text-shadow:0 0 30px rgba(255,170,40,.45)}' +
    '.dsh-msg p{margin:0 0 6px;font:500 clamp(18px,2.6vw,24px)/1.4 Geist,system-ui,sans-serif}' +
    '.dsh-msg .sub{font-size:clamp(14px,1.8vw,17px);opacity:.75;margin-bottom:26px}' +
    '.dsh-go{padding:14px 26px;border:0;background:#FFC94D;color:#1B1621;font:600 16px Geist,system-ui,sans-serif;cursor:pointer}' +
    '@media (min-width:900px){.dsh-msg{left:68%;width:min(560px,40vw)}}' +
    '.dsh-go:focus-visible,.dsh-skip:focus-visible{outline:2px solid #FFC94D;outline-offset:3px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var root = document.createElement('div'); root.className = 'dsh'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Happy Dussehra');
  root.innerHTML = '<canvas aria-hidden="true"></canvas><button class="dsh-skip" type="button">Skip</button>' +
    '<div class="dsh-msg" aria-live="polite"><h2>10 heads.<br>0&nbsp;rizz.&nbsp;💀</h2><p>Happy Dussehra! Achhai always&nbsp;wins.&nbsp;🏹</p><p class="sub">Buraai par achhai ki jeet.</p><button class="dsh-go" type="button">Enter the portfolio</button></div>';
  document.body.appendChild(root);
  var cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), msg = root.querySelector('.dsh-msg');
  var W, H, D, C, gw, gh, raf = 0, t0 = 0, done = false, prevOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(function () { root.classList.add('on'); });

  function close() {
    if (done) return; done = true; cancelAnimationFrame(raf); root.classList.remove('on');
    setTimeout(function () { root.remove(); st.remove(); document.documentElement.style.overflow = prevOverflow; }, 420);
    removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter') close(); }
  addEventListener('keydown', onKey);
  root.querySelector('.dsh-skip').addEventListener('click', close);
  root.querySelector('.dsh-go').addEventListener('click', close);
  if (reduced) { msg.classList.add('show'); root.querySelector('.dsh-go').focus(); return; }

  /* draw a silhouette at low resolution, then read it back as a list of coloured cells */
  function sprite(w, h, paint) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); paint(x);
    var d = x.getImageData(0, 0, w, h).data, cells = [];
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) { var k = (j * w + i) * 4; if (d[k + 3] > 140) cells.push([i, j, 'rgb(' + d[k] + ',' + d[k + 1] + ',' + d[k + 2] + ')']); }
    return cells;
  }
  function rect(x, c, a, b, w, h) { x.fillStyle = c; x.fillRect(a, b, w, h); }
  function circ(x, c, a, b, r) { x.fillStyle = c; x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.fill(); }
  function poly(x, c, pts) { x.fillStyle = c; x.beginPath(); x.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill(); }
  var GOLD = '#F6B93B', DEEP = '#E08A1E', LIGHT = '#FFE08A';
  // Shri Ram, facing right, bow raised; 'pull' moves the drawing hand back
  function ram(pull) {
    return sprite(46, 60, function (x) {
      x.imageSmoothingEnabled = false;
      poly(x, GOLD, [14, 6, 20, 0, 26, 6]);                    // crown point
      rect(x, LIGHT, 14, 6, 12, 3);                              // crown band
      circ(x, GOLD, 20, 13, 5);                                  // head
      rect(x, GOLD, 18, 17, 4, 3);                               // neck
      poly(x, GOLD, [13, 20, 27, 20, 25, 38, 15, 38]);           // torso
      poly(x, DEEP, [15, 37, 25, 37, 27, 44, 13, 44]);           // dhoti waist
      poly(x, GOLD, [13, 44, 19, 44, 17, 59, 11, 59]);           // back leg
      poly(x, GOLD, [21, 44, 27, 44, 31, 59, 25, 59]);           // front leg, stepping forward
      poly(x, GOLD, [25, 22, 39, 20, 39, 23, 25, 26]);           // front arm out to the bow
      var hx = 26 - pull * 8; poly(x, GOLD, [15, 22, hx, 21, hx, 24, 15, 26]);  // drawing arm
      x.strokeStyle = DEEP; x.lineWidth = 2; x.beginPath(); x.arc(32, 22, 14, -1.15, 1.15); x.stroke();   // bow
      x.strokeStyle = LIGHT; x.lineWidth = 1; x.beginPath(); x.moveTo(37.5, 9.2); x.lineTo(hx, 22.5); x.lineTo(37.5, 34.8); x.stroke(); // string
      if (pull > 0.05) { rect(x, LIGHT, hx, 22, 46 - hx - 2, 1); }                           // nocked arrow
    });
  }
  // the Ravan effigy: ten heads, a crowned centre face, an ornate robe
  var RAVAN = sprite(96, 100, function (x) {
    var RED = '#D7372B', MAROON = '#8E1F2B', YEL = '#F2C14E', SKIN = '#E9B47C', DARK = '#2A1A22', GRN = '#3E9E5B', WHT = '#FFF4DE';
    rect(x, '#6B4A2E', 28, 94, 40, 6);                                        // platform
    poly(x, RED, [36, 46, 60, 46, 70, 94, 26, 94]);                           // robe
    for (var y = 54; y < 94; y += 9) rect(x, YEL, 28, y, 40, 2);              // gold bands
    rect(x, GRN, 45, 48, 6, 46); rect(x, YEL, 46, 48, 4, 46);                 // centre panel
    poly(x, MAROON, [24, 46, 36, 44, 36, 54, 20, 62]); poly(x, MAROON, [60, 44, 72, 46, 76, 62, 60, 54]);   // shoulders and arms
    rect(x, YEL, 16, 60, 7, 5); rect(x, YEL, 73, 60, 7, 5);                   // bangles
    rect(x, SKIN, 44, 42, 8, 5);                                               // neck
    function head(cx, cy, r, main) {
      circ(x, SKIN, cx, cy, r);
      poly(x, YEL, [cx - r, cy - r * 0.55, cx - r * 0.55, cy - r - r * 0.9, cx, cy - r * 0.8, cx + r * 0.55, cy - r - r * 0.9, cx + r, cy - r * 0.55]);  // crown
      rect(x, RED, cx - 1, cy - r - r * 0.5, 2, 2);                           // crown jewel
      var e = Math.max(1, r * 0.28);
      rect(x, WHT, cx - r * 0.55, cy - r * 0.15, e, e); rect(x, WHT, cx + r * 0.25, cy - r * 0.15, e, e);   // eyes
      rect(x, DARK, cx - r * 0.45, cy - r * 0.05, e * 0.6, e * 0.6); rect(x, DARK, cx + r * 0.35, cy - r * 0.05, e * 0.6, e * 0.6);
      rect(x, DARK, cx - r * 0.5, cy + r * 0.35, r, Math.max(1, r * 0.18));  // moustache
      if (main) { rect(x, DARK, cx - r * 0.65, cy + r * 0.3, 2, 2); rect(x, DARK, cx + r * 0.5, cy + r * 0.3, 2, 2); }
    }
    [-4, -3, -2, -1].forEach(function (k) { head(48 + k * 9.5, 34, 5, false); });       // four heads on the left
    [1, 2, 3, 4, 5].forEach(function (k) { head(48 + k * 9.5 - (k === 5 ? 1 : 0), 34, 5, false); });  // five on the right
    head(48, 32, 8.5, true);                                                   // the big centre head
  });
  var stars = [];
  function size() {
    D = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * D; cv.height = H * D; ctx.setTransform(D, 0, 0, D, 0, 0);
    C = Math.max(3, Math.floor(Math.min(W / 150, H / 120))); gw = Math.floor(W / C); gh = Math.floor(H / C);
    stars = []; for (var i = 0; i < 90; i++) stars.push([Math.random() * W, Math.random() * H * 0.7, Math.random()]);
  }
  size(); addEventListener('resize', size);
  var parts = [], exploded = false;
  function cell(i, j, col, a) { ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = col; ctx.fillRect(i, j, C - 1, C - 1); ctx.globalAlpha = 1; }
  function frame(ts) {
    if (done) return; if (!t0) t0 = ts; var t = (ts - t0) / 1000;
    ctx.fillStyle = '#140F1C'; ctx.fillRect(0, 0, W, H);
    stars.forEach(function (s) { ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 1.5 + s[2] * 9)); ctx.fillStyle = '#FFF4DE'; ctx.fillRect(s[0], s[1], 2, 2); }); ctx.globalAlpha = 1;
    var ground = H - C * 10; ctx.fillStyle = '#231A2E'; ctx.fillRect(0, ground, W, H - ground);
    var scale = Math.max(1, Math.floor(Math.min(W * 0.22 / 46, H * 0.52 / 60))) * C / C;
    var px = W < 700 ? Math.max(2, Math.floor(W * 0.36 / 46)) : C * Math.max(1, Math.round(Math.min(W * 0.2 / (46 * C), H * 0.5 / (60 * C)) * 1.6));   // pixel size for the figures
    var rx = Math.round(W * 0.1), ry = ground - 60 * px;                                          // Ram's top-left
    var vpx = px * (W < 700 ? 0.62 : 0.8), vx = Math.round(W * 0.9 - 96 * vpx), vy = ground - 100 * vpx;            // Ravan's top-left
    var pull = t < 0.5 ? 0 : t < 1.2 ? (t - 0.5) / 0.7 : 0;
    // aura behind Shri Ram
    var g = ctx.createRadialGradient(rx + 20 * px, ry + 13 * px, 2, rx + 20 * px, ry + 13 * px, 18 * px);
    g.addColorStop(0, 'rgba(255,200,90,0.55)'); g.addColorStop(1, 'rgba(255,200,90,0)'); ctx.fillStyle = g; ctx.fillRect(rx - 10 * px, ry - 10 * px, 60 * px, 50 * px);
    ram(pull).forEach(function (c) { ctx.fillStyle = c[2]; ctx.fillRect(rx + c[0] * px, ry + c[1] * px, px - 1, px - 1); });
    // the arrow in flight
    var sx = rx + 44 * px, sy = ry + 22 * px, ex = vx + 48 * vpx, ey = vy + 60 * vpx;
    if (t >= 1.2 && !window.__dshArrow) { window.__dshArrow = 1; if (window.pixelSound) pixelSound('arrow'); }
    if (t >= 1.2 && t < 1.9) {
      var p = (t - 1.2) / 0.7, ax = sx + (ex - sx) * p, ay = sy + (ey - sy) * p - Math.sin(p * Math.PI) * px * 6;
      for (var k = 0; k < 18; k++) { var q = Math.max(0, p - k * 0.012); var bx = sx + (ex - sx) * q, by = sy + (ey - sy) * q - Math.sin(q * Math.PI) * px * 6;
        ctx.globalAlpha = 1 - k / 18; ctx.fillStyle = k < 3 ? '#FFF4DE' : '#FFC94D'; ctx.fillRect(bx, by, px, px); }
      ctx.globalAlpha = 1; ctx.fillStyle = '#FFF4DE'; ctx.fillRect(ax, ay - px, px * 2, px * 3);
    }
    // Ravan stands until the arrow lands, then becomes fireworks
    if (t < 1.9) RAVAN.forEach(function (c) { ctx.fillStyle = c[2]; ctx.fillRect(vx + c[0] * vpx, vy + c[1] * vpx, vpx - 1, vpx - 1); });
    else if (!exploded) {
      exploded = true; if (window.pixelSound) pixelSound('boom');
      RAVAN.forEach(function (c) {
        var x0 = vx + c[0] * vpx, y0 = vy + c[1] * vpx, dx = x0 - ex, dy = y0 - ey, a = Math.atan2(dy, dx), s = 120 + Math.random() * 420;
        parts.push({ x: x0, y: y0, vx: Math.cos(a) * s + (Math.random() - 0.5) * 120, vy: Math.sin(a) * s - 200 - Math.random() * 200, c: c[2], life: 1.6 + Math.random() * 1.2, sz: vpx });
      });
      [[0, 0], [0.25, -0.3], [-0.3, -0.2], [0.1, -0.5]].forEach(function (o, n) {
        var bx = ex + o[0] * W * 0.25, by = ey - H * 0.25 + o[1] * H * 0.3, cols = ['#FFC94D', '#FF6A3D', '#EAA5DD', '#7FD1FF'];
        for (var m = 0; m < 46; m++) { var a = m / 46 * Math.PI * 2, s = 140 + Math.random() * 160;
          parts.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: cols[(m + n) % 4], life: 1.1 + Math.random() * 0.8, sz: C, delay: n * 0.22, g: 60 }); }
      });
    }
    if (exploded) {
      var dt = 1 / 60, flash = Math.max(0, 1 - (t - 1.9) * 4);
      if (flash > 0) { ctx.globalAlpha = flash * 0.6; ctx.fillStyle = '#FFE08A'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      parts.forEach(function (q) {
        if (q.delay && t - 1.9 < q.delay) return;
        q.life -= dt; if (q.life <= 0) return;
        q.vy += (q.g || 260) * dt; q.vx *= 0.99; q.x += q.vx * dt; q.y += q.vy * dt;
        ctx.globalAlpha = Math.min(1, q.life); ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, q.sz - 1, q.sz - 1);
      });
      ctx.globalAlpha = 1;
      if (t > 3.0 && !msg.classList.contains('show')) { msg.classList.add('show'); root.querySelector('.dsh-go').focus({ preventScroll: true }); }
    }
    if (t < 14) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
})();
