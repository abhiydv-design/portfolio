/* Footer creatures: a butterfly, a flock of birds and a horse, drawn from dashes and dots.
   One visits at a time while the footer is on screen. Decorative only. */
(function () {
  var foot = document.querySelector('.footer'); if (!foot) return;
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduced) return;

  var cv = document.createElement('canvas'); cv.className = 'creatures'; cv.setAttribute('aria-hidden', 'true');
  foot.prepend(cv);
  var ctx, W = 0, H = 0, D = 1, layer = document.createElement('canvas'), lctx = layer.getContext('2d');
  var raster = document.createElement('canvas'), rctx = raster.getContext('2d', { willReadFrequently: true });
  var fg = '#fff', glow = true, visible = false, raf = 0, cur = null, nextAt = 0, queue = [], mx = -1e4, my = -1e4;

  function hash(a, b) { var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); }
  function colors() {
    var cs = getComputedStyle(foot); fg = cs.color;
    var m = cs.backgroundColor.match(/\d+/g) || [0, 0, 0], lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
    glow = lum < 0.4;
  }
  function size() {
    D = Math.min(1.5, devicePixelRatio || 1); W = foot.clientWidth; H = foot.clientHeight;
    [cv, layer].forEach(function (c) { c.width = W * D; c.height = H * D; });
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx = cv.getContext('2d'); ctx.setTransform(D, 0, 0, D, 0, 0); lctx.setTransform(D, 0, 0, D, 0, 0);
  }
  /* the open band between the email and the bottom row, where creatures travel */
  function band() {
    var fb = foot.getBoundingClientRect(), em = foot.querySelector('.email'), row = foot.querySelector('.foot-row');
    var top = em ? em.getBoundingClientRect().bottom - fb.top + 8 : H * 0.55, bot = row ? row.getBoundingClientRect().top - fb.top - 8 : H - 40;
    if (bot - top < 90) { top = Math.max(0, bot - 140); }
    return { top: top, bot: bot, mid: (top + bot) / 2 };
  }

  /* draw a silhouette at low resolution, then turn every filled cell into a mark */
  function marks(cells, cell, ox, oy, t, trail) {
    var img = rctx.getImageData(0, 0, raster.width, raster.height).data, w = raster.width, h = raster.height;
    lctx.fillStyle = fg;
    for (var j = 0; j < h; j++) {
      var run = 0;
      for (var i = 0; i <= w; i++) {
        var on = i < w && img[(j * w + i) * 4 + 3] > 110 && hash(i + Math.floor(t * 6), j) > 0.06;
        if (on) { run++; continue; }
        if (run) {
          var x0 = ox + (i - run) * cell, y = oy + j * cell;
          // long runs become dashes like terminal text, short ones stay as dots
          for (var k = 0; k < run; k += 3) {
            var len = Math.min(3, run - k), x = x0 + k * cell;
            if (len === 1) { lctx.beginPath(); lctx.arc(x + cell / 2, y + cell / 2, cell * 0.28, 0, Math.PI * 2); lctx.fill(); }
            else lctx.fillRect(x + cell * 0.12, y + cell * 0.3, len * cell - cell * 0.24, cell * 0.42);
          }
          if (trail) for (var q = 0; q < run; q++) if (hash(i * 3 + q, j + Math.floor(t * 20)) < 0.035) {
            lctx.globalAlpha = 0.45; lctx.fillRect(x0 + q * cell - trail * (6 + hash(q, j) * 40), y + cell * 0.4, cell * 0.3, cell * 0.3); lctx.globalAlpha = 1;
          }
          run = 0;
        }
      }
    }
  }
  function prep(wc, hc) { raster.width = wc; raster.height = hc; rctx.clearRect(0, 0, wc, hc); rctx.fillStyle = '#000'; rctx.strokeStyle = '#000'; rctx.lineCap = 'round'; rctx.lineJoin = 'round'; }

  /* ---------------- butterfly ---------------- */
  function Butterfly(b) {
    var sprout = document.querySelector('[data-sprout]'), land = null;
    if (sprout && Math.random() < 0.45) {
      var sr = sprout.getBoundingClientRect(), fr = foot.getBoundingClientRect();
      var lx = sr.left + sr.width / 2 - fr.left, ly = sr.top + 10 - fr.top;
      if (ly > 0 && ly < H) land = { x: lx, y: ly };
    }
    var dir = Math.random() < 0.5 ? 1 : -1;
    return { kind: 'butterfly', x: dir > 0 ? -60 : W + 60, y: b.mid, dir: dir, t0: performance.now(), land: land, landed: 0, flee: 0, cell: (b.bot - b.top) > 150 ? 5 : 4, done: false,
      step: function (now, dt) {
        var t = (now - this.t0) / 1000, s = this;
        if (s.land && !s.landed && Math.abs(s.x - s.land.x) < 30 && t > 2) s.landed = now;
        if (s.landed && now - s.landed < 2600 && !s.flee) {
          s.x += (s.land.x - s.x) * 0.08; s.y += (s.land.y - 26 - s.y) * 0.08; s.flap = 0.55 + 0.45 * Math.abs(Math.cos(t * 2));
        } else {
          var sp = s.flee ? 170 : 55;
          s.x += s.dir * sp * dt; s.y += (Math.sin(t * 1.3) * 34 + Math.sin(t * 3.1) * 12 - (s.flee ? 90 : 0)) * dt * 1.6;
          s.y = Math.max(b.top - 60, Math.min(b.bot - 30, s.y));
          s.flap = 0.18 + 0.82 * Math.abs(Math.cos(t * (s.flee ? 16 : 9)));
        }
        if (s.x < -90 || s.x > W + 90 || s.y < -80) s.done = true;
        if (Math.hypot(mx - s.x, my - s.y) < 70 && !s.flee) { s.flee = 1; if (s.land) s.landed = s.landed || 1; }
      },
      draw: function (now) {
        var f = this.flap, c = this.cell, wc = 36, hc = 28; prep(wc, hc);
        rctx.save(); rctx.translate(wc / 2, hc / 2 + 1);
        [1, -1].forEach(function (sd) {
          rctx.save(); rctx.scale(sd * f, 1);
          rctx.beginPath(); rctx.moveTo(0.6, -2); rctx.lineTo(9, -9.5); rctx.lineTo(15, -8.5); rctx.lineTo(13, -1); rctx.lineTo(1, 0.5); rctx.closePath(); rctx.fill();
          rctx.beginPath(); rctx.moveTo(0.6, 0.8); rctx.lineTo(9.5, 2); rctx.lineTo(10, 7.5); rctx.lineTo(4, 10); rctx.lineTo(0.6, 5); rctx.closePath(); rctx.fill();
          rctx.globalCompositeOperation = 'destination-out';
          rctx.beginPath(); rctx.ellipse(8.5, -4.8, 2.4, 1.6, -0.4, 0, Math.PI * 2); rctx.fill();
          rctx.beginPath(); rctx.ellipse(5.5, 5, 1.6, 1.3, 0.3, 0, Math.PI * 2); rctx.fill();
          rctx.beginPath(); rctx.moveTo(1.5, -1); rctx.lineTo(11.5, -6.5); rctx.lineWidth = 0.6; rctx.stroke();
          rctx.globalCompositeOperation = 'source-over';
          rctx.restore();
        });
        rctx.beginPath(); rctx.ellipse(0, 1, 0.9, 5, 0, 0, Math.PI * 2); rctx.fill();
        rctx.beginPath(); rctx.arc(0, -4.6, 1.1, 0, Math.PI * 2); rctx.fill();
        rctx.lineWidth = 0.7; rctx.beginPath(); rctx.moveTo(0, -5); rctx.lineTo(-3, -10); rctx.moveTo(0, -5); rctx.lineTo(3, -10); rctx.stroke();
        rctx.restore();
        marks(null, c, this.x - wc * c / 2, this.y - hc * c / 2, now / 1000, this.landed && !this.flee ? 0 : this.dir * 0.6);
      } };
  }

  /* ---------------- flock of birds ---------------- */
  function Birds(b) {
    var dir = Math.random() < 0.5 ? 1 : -1, n = 7, birds = [];
    for (var k = 0; k < n; k++) {
      var rank = Math.ceil(k / 2), side = k % 2 ? 1 : -1;
      birds.push({ dx: -dir * rank * 34 + (hash(k, 1) - 0.5) * 10, dy: side * rank * 13 + (hash(k, 2) - 0.5) * 6, ph: hash(k, 3) * 6, vx: 0, vy: 0, sc: 0.8 + hash(k, 4) * 0.4 });
    }
    return { kind: 'birds', x: dir > 0 ? -120 : W + 120, y: b.top + (b.bot - b.top) * 0.35 - 20, dir: dir, birds: birds, t0: performance.now(), cell: (b.bot - b.top) > 150 ? 4 : 3, done: false, scared: false,
      step: function (now, dt) {
        var s = this; s.x += s.dir * 120 * dt;
        s.birds.forEach(function (bd) {
          if (s.scared) { bd.vx += (bd.dx * 0.02 + s.dir * 40) * dt * 6; bd.vy -= (40 + bd.ph * 6) * dt * 3; }
          bd.dx += bd.vx * dt; bd.dy += bd.vy * dt;
          var px = s.x + bd.dx, py = s.y + bd.dy;
          if (!s.scared && Math.hypot(mx - px, my - py) < 60) s.scared = true;
        });
        if ((s.dir > 0 && s.x > W + 300) || (s.dir < 0 && s.x < -300)) s.done = true;
      },
      draw: function (now) {
        var s = this, c = this.cell, t = now / 1000;
        s.birds.forEach(function (bd) {
          var wc = 22, hc = 12; prep(wc, hc);
          var fl = Math.sin(t * (s.scared ? 18 : 11) + bd.ph), tip = -4 * fl, mid = -1.2 * fl + 1;
          rctx.save(); rctx.translate(wc / 2, hc / 2); rctx.scale(bd.sc * (s.dir > 0 ? 1 : -1), bd.sc); rctx.lineWidth = 1.3;
          rctx.beginPath(); rctx.moveTo(-9, tip); rctx.quadraticCurveTo(-4, mid - 1.5, 0, 1); rctx.quadraticCurveTo(4, mid - 1.5, 9, tip); rctx.stroke();
          rctx.beginPath(); rctx.ellipse(0.5, 1.2, 2.2, 1, 0, 0, Math.PI * 2); rctx.fill();
          rctx.restore();
          marks(null, c, s.x + bd.dx - wc * c / 2, s.y + bd.dy - hc * c / 2, t, 0);
        });
      } };
  }

  /* ---------------- galloping horse ---------------- */
  function Horse(b) {
    var dir = Math.random() < 0.5 ? 1 : -1, c = Math.max(3, Math.min(7, Math.floor((b.bot - b.top) / 28)));
    return { kind: 'horse', x: dir > 0 ? -200 : W + 200, y: b.bot - 16 * c, dir: dir, cell: c, t0: performance.now(), done: false, fast: false,
      step: function (now, dt) {
        this.x += this.dir * (this.fast ? 380 : 230) * dt;
        if (Math.hypot(mx - this.x, my - this.y) < 110) this.fast = true;
        if ((this.dir > 0 && this.x > W + 220) || (this.dir < 0 && this.x < -220)) this.done = true;
      },
      draw: function (now) {
        var t = (now - this.t0) / 1000, ph = t * (this.fast ? 10 : 7.2), c = this.cell, wc = 44, hc = 30; prep(wc, hc);
        rctx.save(); rctx.translate(wc / 2, 12 + Math.sin(ph * 2) * 0.7); if (this.dir < 0) rctx.scale(-1, 1);
        rctx.beginPath(); rctx.ellipse(0, 0, 10.5, 4.2, -0.04, 0, Math.PI * 2); rctx.fill();                 // body
        rctx.lineWidth = 3.6; rctx.beginPath(); rctx.moveTo(7.5, -1.5); rctx.quadraticCurveTo(11, -5, 12.5, -9); rctx.stroke(); // neck
        rctx.save(); rctx.translate(14.2, -9.3); rctx.rotate(0.55); rctx.beginPath(); rctx.ellipse(1.6, 0, 3.8, 1.5, 0, 0, Math.PI * 2); rctx.fill(); rctx.restore(); // head
        rctx.lineWidth = 0.8; rctx.beginPath(); rctx.moveTo(12.6, -10.5); rctx.lineTo(12.2, -13); rctx.stroke(); // ear
        rctx.lineWidth = 1.4; rctx.beginPath(); rctx.moveTo(9.5, -4); rctx.quadraticCurveTo(10, -8, 11.5, -10.5); rctx.stroke(); // mane
        var sw = Math.sin(ph) * 1.8; rctx.lineWidth = 1.6; rctx.beginPath(); rctx.moveTo(-10, -1.5); rctx.quadraticCurveTo(-15, -2 + sw, -18, 3 + sw); rctx.stroke(); // tail
        function leg(hx, hy, p, fore) {
          var a1 = (fore ? 0.15 : -0.1) + 0.75 * Math.sin(p), knee = fore ? Math.max(0, Math.sin(p + 0.9)) * 1.6 : -Math.max(0, Math.sin(p - 0.6)) * 1.4;
          var kx = hx + Math.sin(a1) * 5.2, ky = hy + Math.cos(a1) * 5.2, a2 = a1 + (fore ? -knee : -knee);
          var fx = kx + Math.sin(a2) * 5.4, fy = ky + Math.cos(a2) * 5.4;
          rctx.lineWidth = 1.7; rctx.beginPath(); rctx.moveTo(hx, hy); rctx.lineTo(kx, ky); rctx.lineTo(fx, fy); rctx.stroke();
        }
        leg(7, 2.2, ph + 0.0, true); leg(6, 2.2, ph + 0.55, true);
        leg(-7.5, 2.2, ph + 2.6, false); leg(-8.5, 2.2, ph + 3.2, false);
        rctx.restore();
        marks(null, c, this.x - wc * c / 2, this.y - 12 * c, t, this.dir * 1.2);
      } };
  }

  var MAKERS = [Butterfly, Birds, Horse];
  function nextCreature(now) {
    if (!queue.length) { queue = [0, 1, 2].sort(function () { return Math.random() - 0.5; }); }
    cur = MAKERS[queue.shift()](band());
  }
  var last = 0;
  function frame(now) {
    raf = 0; if (!visible) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    lctx.clearRect(0, 0, W, H); ctx.clearRect(0, 0, W, H);
    if (!cur && now > nextAt) nextCreature(now);
    if (cur) {
      cur.step(now, dt); cur.draw(now);
      if (glow) { ctx.shadowColor = fg; ctx.shadowBlur = 9; }
      ctx.drawImage(layer, 0, 0, W, H); ctx.shadowBlur = 0;
      if (cur.done) { cur = null; nextAt = now + 3500 + Math.random() * 5000; }
    }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }

  foot.addEventListener('pointermove', function (e) { var r = foot.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  foot.addEventListener('pointerdown', function (e) { var r = foot.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; setTimeout(function () { mx = my = -1e4; }, 300); });
  foot.addEventListener('pointerleave', function () { mx = my = -1e4; });
  new IntersectionObserver(function (en) {
    visible = en[0].isIntersecting;
    if (visible) { if (!cur && nextAt < performance.now()) nextAt = performance.now() + 1200; start(); }
  }, { threshold: 0.15 }).observe(foot);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { visible = false; return; }
    var r = foot.getBoundingClientRect(); visible = r.top < innerHeight && r.bottom > 0; if (visible) start();
  });
  addEventListener('resize', function () { size(); });
  addEventListener('themechange', colors);
  size(); colors();
  window.__creatures = { spawn: function (k) { cur = MAKERS[k](band()); start(); } };
})();
