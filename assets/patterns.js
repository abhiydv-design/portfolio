/* Pixel / halftone pattern system for Abhishek's portfolio.
   Every graphic on the site is drawn here from a small grid of marks. */
(function () {
  var PAL = {};
  function refreshPal() { var t = window.themeColors ? window.themeColors() : null; if (t) for (var k in t) PAL[k] = t[k]; }
  refreshPal();
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- noise ---------- */
  function hash(x, y, s) { var n = Math.sin(x * 127.1 + y * 311.7 + (s || 0) * 74.7) * 43758.5453; return n - Math.floor(n); }
  function vnoise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s) { var t = 0, a = 0.5, f = 1; for (var i = 0; i < 4; i++) { t += a * vnoise(x * f, y * f, s + i * 13); f *= 2; a *= 0.5; } return t / 0.9375; }

  function setup(el) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = el.clientWidth, H = el.clientHeight;
    el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);
    var ctx = el.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, W: W, H: H };
  }
  function cross(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke(); }

  /* `show(i, j)` returns true once a cell has "arrived" in the reveal. */
  var DRAW = {};

  DRAW.map = function (ctx, W, H, p, show) {
    ctx.fillStyle = p.field; ctx.fillRect(0, 0, W, H);
    var cell = 14, cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      if (!show(i, j)) continue;
      var x = i * cell + 7, y = j * cell + 7;
      var ex = (x - W * 0.52) / (W * 0.55), ey = (y - H * 0.5) / (H * 0.6);
      var n = fbm(x * 0.009, y * 0.009, 3) + 0.22 * (1 - Math.sqrt(ex * ex + ey * ey)) - 0.05;
      if (n > 0.6) {
        if (hash(i, j, 9) < 0.018) { ctx.fillStyle = p.soft; ctx.fillRect(x - 5, y - 5, 10, 10); }
        else { ctx.fillStyle = p.mark; ctx.fillRect(x - 4, y - 4, 8, 8); }
      } else if (n > 0.54) {
        ctx.strokeStyle = p.mark; ctx.lineWidth = 1; ctx.strokeRect(x - 4, y - 4, 8, 8);
      } else if (hash(i, j, 5) < 0.15) {
        ctx.strokeStyle = p.soft; ctx.lineWidth = 1; ctx.globalAlpha = 0.85; cross(ctx, x, y, 2.5); ctx.globalAlpha = 1;
      }
    }
  };

  DRAW.ring = function (ctx, W, H, p, show) {
    ctx.fillStyle = p.page; ctx.fillRect(0, 0, W, H);
    var cx = W * 0.56, cy = H * 0.52, r0 = Math.min(W, H) * 0.17, slots = 112;
    var step = Math.min(18, (Math.min(W, H) * 0.5 - r0 - 8) / 12), cr = Math.max(3.1, step * 0.36);
    for (var k = 0; k < slots; k++) {
      var ang = k / slots * Math.PI * 2 - Math.PI / 2;
      var v = 0.15 + 0.85 * fbm(k * 0.08, 1.3, 5);
      var n = Math.max(1, Math.round(v * 12));
      for (var j = 0; j < n; j++) {
        if (!show(k, j)) continue;
        var rr = r0 + j * step, x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
        if (j === n - 1) { ctx.fillStyle = p.deep; ctx.beginPath(); ctx.arc(x, y, cr + 0.2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.strokeStyle = p.accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.stroke(); }
      }
    }
    ctx.fillStyle = p.ink;
    for (var m = 0; m < 56; m++) { if (!show(m, 40)) continue; var a2 = m / 56 * Math.PI * 2; ctx.beginPath(); ctx.arc(cx + Math.cos(a2) * (r0 - 16), cy + Math.sin(a2) * (r0 - 16), 1.1, 0, Math.PI * 2); ctx.fill(); }
  };

  DRAW.stitch = function (ctx, W, H, p, show) {
    ctx.fillStyle = p.page; ctx.fillRect(0, 0, W, H);
    var cell = 12, cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    ctx.strokeStyle = p.ink; ctx.globalAlpha = 0.07; ctx.lineWidth = 1;
    for (var gx = 0; gx <= cols; gx++) { ctx.beginPath(); ctx.moveTo(gx * cell + 0.5, 0); ctx.lineTo(gx * cell + 0.5, H); ctx.stroke(); }
    for (var gy = 0; gy <= rows; gy++) { ctx.beginPath(); ctx.moveTo(0, gy * cell + 0.5); ctx.lineTo(W, gy * cell + 0.5); ctx.stroke(); }
    ctx.globalAlpha = 1;
    var sc = Math.min(1, W / 520);
    var P0 = [W * 0.06, H * 1.02], P1 = [W * 0.34, H * 0.28], P2 = [W * 0.98, H * 0.12];
    function pt(t) { var a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; return [a * P0[0] + b * P1[0] + c * P2[0], a * P0[1] + b * P1[1] + c * P2[1]]; }
    var samples = []; for (var s = 0; s <= 80; s++) samples.push(pt(s / 80));
    var leaves = [], ts = [0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.86];
    for (var li = 0; li < ts.length; li++) {
      var t = ts[li], a0 = pt(t), a1 = pt(t + 0.01), tang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]);
      var side = li % 2 ? 1 : -1, dir = tang + side * 0.95;
      leaves.push({ x: a0[0], y: a0[1], c: Math.cos(dir), s: Math.sin(dir), L: 118 * sc * (1 - 0.35 * t) + 30, w: 30 * sc * (1 - 0.3 * t) + 6, side: side });
    }
    ctx.lineCap = 'round'; ctx.lineWidth = 1.7;
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      if (!show(i, j)) continue;
      var x = i * cell + 6, y = j * cell + 6, col = null;
      var md = 1e9; for (var q = 0; q < samples.length; q++) { var ddx = x - samples[q][0], ddy = y - samples[q][1], dd = ddx * ddx + ddy * ddy; if (dd < md) md = dd; }
      if (md < 36) col = p.ink;
      else for (var k = 0; k < leaves.length; k++) {
        var lf = leaves[k], rx = x - lf.x, ry = y - lf.y, along = rx * lf.c + ry * lf.s, across = -rx * lf.s + ry * lf.c;
        if (along > 0 && along < lf.L) {
          var half = lf.w * Math.sin(Math.PI * along / lf.L);
          if (Math.abs(across) < half) {
            var sn = Math.abs(across) / half;
            col = sn < 0.16 ? p.ink : (sn > 0.8 ? p.deep : (across * lf.side > 0 ? p.accent : p.soft));
            break;
          }
        }
      }
      if (col) { ctx.strokeStyle = col; cross(ctx, x, y, 3.6); }
    }
  };

  DRAW.land = function (ctx, W, H, p, show) {
    ctx.fillStyle = p.night; ctx.fillRect(0, 0, W, H);
    var mx = W * 0.76, my = H * 0.22, mr = Math.min(36, W * 0.07);
    for (var y = 4, j = 0; y < H; y += 7, j++) for (var x = 0, i = 0; x < W; x += 6, i++) {
      if (!show(i, j)) continue;
      var back = H * 0.44 + 34 * Math.sin(x * 0.011 + 1) + 20 * Math.sin(x * 0.029) + 7 * Math.sin(x * 0.083);
      var front = H * 0.64 + 42 * Math.sin(x * 0.0075 + 2.4) + 15 * Math.sin(x * 0.026 + 1) + 5 * Math.sin(x * 0.09);
      var hs = hash(x, y, 11);
      if (y > front) {
        var depth = (y - front) / (H - front + 1);
        if (hs < depth * 0.55) continue;
        ctx.fillStyle = p.mark; ctx.fillRect(x, y, 5 * (1 - 0.45 * depth), 1.6);
      } else if (y > back) {
        if (hs < 0.35) continue;
        ctx.fillStyle = p.soft; ctx.fillRect(x, y, 3.5, 1.4);
      } else {
        var dxm = x - mx, dym = y - my;
        if (dxm * dxm + dym * dym < mr * mr) { ctx.fillStyle = p.mark; ctx.fillRect(x, y, 5.5, 1.6); }
        else if (hs < 0.22 * (y / back)) { ctx.fillStyle = p.soft; ctx.globalAlpha = 0.6; ctx.fillRect(x, y, 1.5, 1.4); ctx.globalAlpha = 1; }
      }
    }
  };

  DRAW.band = function (ctx, W, H, p) {
    ctx.fillStyle = p.page; ctx.fillRect(0, 0, W, H);
    var cell = 8, cols = Math.ceil(W / cell), rows = Math.round(H / cell);
    ctx.fillStyle = p.footer;
    for (var j = 0; j < rows; j++) {
      var f = j / (rows - 1), prob = Math.pow(f, 1.7), size = 3 + 5 * f;
      for (var i = 0; i < cols; i++) {
        if (j === rows - 1 || hash(i, j, 21) < prob) ctx.fillRect(i * cell + (cell - size) / 2, j * cell + (cell - size) / 2, size, size);
      }
    }
  };

  /* ---------- static patterns with a density reveal on scroll ---------- */
  function Static(el) {
    this.el = el; this.name = el.getAttribute('data-pattern'); this.progress = reduced ? 1 : 0; this.started = reduced;
    this.base = null; this.wave = null;
  }
  Static.prototype.draw = function () {
    if (!this.el.clientWidth) return;
    var c = setup(this.el), pr = this.progress;
    this.ctx = c.ctx; this.W = c.W; this.H = c.H;
    var show = pr >= 1 ? function () { return true; } : function (i, j) { return hash(i, j, 99) < pr; };
    DRAW[this.name](c.ctx, c.W, c.H, PAL, show);
    this.base = pr >= 1 ? c.ctx.getImageData(0, 0, this.el.width, this.el.height) : null;
  };
  Static.prototype.reveal = function () {
    if (this.started) return; this.started = true;
    var self = this, t0 = performance.now(), dur = 1100;
    (function tick(now) {
      var k = Math.min(1, (now - t0) / dur); self.progress = 1 - Math.pow(1 - k, 3); self.draw();
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  };
  /* hover: a ring spreads from the cursor, switching each mark to square, then cross, then dot */
  Static.prototype.hover = function (x, y) {
    if (reduced || !this.base || this.wave) return;
    var self = this, d = this.el.width / this.W;
    var bgPx = this.base.data, bw = this.base.width;
    function px(ix, iy) { var o = (iy * bw + ix) * 4; return [bgPx[o], bgPx[o + 1], bgPx[o + 2]]; }
    var bg = px(Math.round(3 * d), Math.round(3 * d));
    var maxR = Math.hypot(Math.max(x, this.W - x), Math.max(y, this.H - y)) + 48;
    this.wave = { x: x, y: y, t0: performance.now() };
    (function tick(now) {
      var w = self.wave; if (!w) return;
      var r = (now - w.t0) * 0.55, band = 48, cell = 12, ctx = self.ctx;
      ctx.putImageData(self.base, 0, 0);
      var i0 = Math.max(0, Math.floor((w.x - r - band) / cell)), i1 = Math.ceil((w.x + r) / cell);
      var j0 = Math.max(0, Math.floor((w.y - r - band) / cell)), j1 = Math.ceil((w.y + r) / cell);
      for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
        var cx = i * cell + 6, cy = j * cell + 6;
        if (cx > self.W || cy > self.H) continue;
        var dist = Math.hypot(cx - w.x, cy - w.y), f = (r - dist) / band;
        if (f < 0 || f > 1) continue;
        var col = null, pts = [[0, 0], [-3, -3], [3, 3], [-3, 3], [3, -3]];
        for (var k = 0; k < pts.length && !col; k++) {
          var ix = Math.round((cx + pts[k][0]) * d), iy = Math.round((cy + pts[k][1]) * d);
          if (ix < 0 || iy < 0 || ix >= bw || iy >= self.base.height) continue;
          var c = px(ix, iy);
          if (Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) > 90) col = 'rgb(' + c.join(',') + ')';
        }
        if (!col) continue;
        ctx.fillStyle = 'rgb(' + bg.join(',') + ')'; ctx.fillRect(i * cell, j * cell, cell, cell);
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.4;
        if (f < 0.34) ctx.strokeRect(cx - 3.5, cy - 3.5, 7, 7);
        else if (f < 0.67) cross(ctx, cx, cy, 3.2);
        else { ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, Math.PI * 2); ctx.fill(); }
      }
      if (r - band < maxR) requestAnimationFrame(tick);
      else { ctx.putImageData(self.base, 0, 0); self.wave = null; }
    })(performance.now());
  };

  /* ---------- paintable density band above the footer ---------- */
  function Band(el) {
    var self = this; this.el = el; this.on = null; this.paint = true;
    function cellAt(e) { var b = el.getBoundingClientRect(); return [Math.floor((e.clientX - b.left) / 8), Math.floor((e.clientY - b.top) / 8)]; }
    function apply(e) {
      var c = cellAt(e); if (c[0] < 0 || c[1] < 0 || c[0] >= self.cols || c[1] >= self.rows) return;
      for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
        var i = c[0] + di, j = c[1] + dj; if (i < 0 || j < 0 || i >= self.cols || j >= self.rows) continue;
        if (Math.abs(di) + Math.abs(dj) > 1) continue;
        self.on[j * self.cols + i] = self.paint ? 1 : 0;
      }
      self.render();
    }
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault(); var c = cellAt(e); self.paint = !self.on[c[1] * self.cols + c[0]]; self.down = true;
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      apply(e);
    });
    el.addEventListener('pointermove', function (e) { if (self.down) apply(e); });
    el.addEventListener('pointerup', function () { self.down = false; });
    el.addEventListener('pointercancel', function () { self.down = false; });
  }
  Band.prototype.draw = function () {
    if (!this.el.clientWidth) return;
    var c = setup(this.el); this.ctx = c.ctx; this.W = c.W; this.H = c.H;
    var cols = Math.ceil(c.W / 8), rows = Math.round(c.H / 8);
    if (!this.on || this.cols !== cols || this.rows !== rows) {
      this.cols = cols; this.rows = rows; this.on = new Uint8Array(cols * rows);
      for (var j = 0; j < rows; j++) { var f = j / (rows - 1), prob = Math.pow(f, 1.7);
        for (var i = 0; i < cols; i++) this.on[j * cols + i] = (j === rows - 1 || hash(i, j, 21) < prob) ? 1 : 0; }
    }
    this.render();
  };
  Band.prototype.render = function () {
    var ctx = this.ctx; if (!ctx) return;
    ctx.fillStyle = PAL.page; ctx.fillRect(0, 0, this.W, this.H); ctx.fillStyle = PAL.footer;
    for (var j = 0; j < this.rows; j++) { var f = j / (this.rows - 1), size = 3 + 5 * f;
      for (var i = 0; i < this.cols; i++) if (this.on[j * this.cols + i]) ctx.fillRect(i * 8 + (8 - size) / 2, j * 8 + (8 - size) / 2, size, size); }
  };

  /* ---------- background micro-dot field with a pixel cursor trail ---------- */
  function Field() {
    var el = document.createElement('canvas'); el.className = 'field'; el.setAttribute('aria-hidden', 'true');
    document.body.prepend(el); this.el = el; this.raf = 0; this.last = null;
    var self = this;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var p = [e.clientX, e.clientY], a = self.last || p; self.last = p;
      var steps = Math.max(1, Math.ceil(Math.hypot(p[0] - a[0], p[1] - a[1]) / 8));
      for (var s = 1; s <= steps; s++) self.stamp(a[0] + (p[0] - a[0]) * s / steps, a[1] + (p[1] - a[1]) * s / steps);
      self.kick();
    }, { passive: true });
    document.addEventListener('pointerleave', function () { self.last = null; });
    this.resize();
  }
  Field.prototype.resize = function () {
    var c = setup(this.el); this.ctx = c.ctx; this.W = c.W; this.H = c.H;
    this.cols = Math.ceil(c.W / 16); this.rows = Math.ceil(c.H / 16); this.e = new Float32Array(this.cols * this.rows);
    this.render();
  };
  Field.prototype.stamp = function (x, y) {
    var ci = Math.floor(x / 16), cj = Math.floor(y / 16);
    for (var j = cj - 2; j <= cj + 2; j++) for (var i = ci - 2; i <= ci + 2; i++) {
      if (i < 0 || j < 0 || i >= this.cols || j >= this.rows) continue;
      var d = Math.hypot(i * 16 + 8 - x, j * 16 + 8 - y) / 34, v = 1 - d;
      if (v > 0) { v *= 0.55 + 0.45 * hash(i, j, 31); var k = j * this.cols + i; if (v > this.e[k]) this.e[k] = v; }
    }
  };
  Field.prototype.kick = function () { var self = this; if (!this.raf) this.raf = requestAnimationFrame(function () { self.raf = 0; self.render(true); }); };
  Field.prototype.render = function (animate) {
    var ctx = this.ctx, live = false; ctx.clearRect(0, 0, this.W, this.H);
    ctx.fillStyle = PAL.ink; ctx.globalAlpha = 0.11;
    for (var j = 0; j < this.rows; j++) for (var i = 0; i < this.cols; i++) ctx.fillRect(i * 16 + 7.4, j * 16 + 7.4, 1.2, 1.2);
    ctx.globalAlpha = 1; ctx.fillStyle = PAL.accent;
    for (var k = 0; k < this.e.length; k++) {
      var v = this.e[k]; if (v < 0.03) { this.e[k] = 0; continue; }
      live = true; var i2 = k % this.cols, j2 = (k / this.cols) | 0, s = 2 + 9 * v;
      ctx.globalAlpha = Math.min(1, 0.25 + v); ctx.fillRect(i2 * 16 + 8 - s / 2, j2 * 16 + 8 - s / 2, s, s);
      if (animate) this.e[k] = v * 0.93;
    }
    ctx.globalAlpha = 1;
    if (live && animate) this.kick();
  };

  /* ---------- the name breaks into dots as you scroll past it ---------- */
  function Dissolve(h1) {
    this.h1 = h1; var host = h1.parentNode; host.style.position = 'relative';
    var el = document.createElement('canvas'); el.className = 'dissolve'; el.setAttribute('aria-hidden', 'true');
    host.appendChild(el); this.el = el; this.dots = []; var self = this;
    window.addEventListener('scroll', function () { self.kick(); }, { passive: true });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { self.sample(); });
  }
  Dissolve.prototype.sample = function () {
    var h1 = this.h1, cs = getComputedStyle(h1), W = h1.offsetWidth, LH = h1.offsetHeight, fall = 200;
    this.el.style.left = h1.offsetLeft + 'px'; this.el.style.top = h1.offsetTop + 'px';
    this.el.style.width = W + 'px'; this.el.style.height = (LH + fall) + 'px';
    var c = setup(this.el); this.ctx = c.ctx; this.W = c.W; this.H = c.H;
    var off = document.createElement('canvas'); off.width = W; off.height = LH; var o = off.getContext('2d');
    o.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing;
    var m = o.measureText(h1.textContent.trim()), fa = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.8, fd = m.fontBoundingBoxDescent || parseFloat(cs.fontSize) * 0.2;
    o.fillStyle = '#000'; o.fillText(h1.textContent.trim(), 0, (LH - (fa + fd)) / 2 + fa);
    var data = o.getImageData(0, 0, W, LH).data, step = W < 500 ? 4 : 5; this.dots = [];
    for (var y = 0; y < LH; y += step) for (var x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 120) this.dots.push({ x: x, y: y, delay: hash(x, y, 41) * 0.5, fall: 40 + hash(x, y, 42) * (fall - 40), drift: (hash(x, y, 43) - 0.5) * 40, s: step * 0.62 });
    }
    this.top = h1.getBoundingClientRect().top + window.scrollY;
    this.render();
  };
  Dissolve.prototype.kick = function () { var self = this; if (!this.raf) this.raf = requestAnimationFrame(function () { self.raf = 0; self.render(); }); };
  Dissolve.prototype.render = function () {
    if (!this.ctx) return;
    var start = Math.max(0, this.top - 260), p = Math.max(0, Math.min(1, (window.scrollY - start) / 420));
    var ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
    this.h1.style.opacity = p <= 0 ? '' : String(Math.max(0, 1 - p * 2.4));
    if (p <= 0) return;
    ctx.fillStyle = PAL.ink;
    for (var k = 0; k < this.dots.length; k++) {
      var d = this.dots[k], q = Math.max(0, Math.min(1, (p - d.delay * 0.6) / 0.5)), a = 0.8 * (1 - q) * Math.min(1, p * 5);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a; ctx.fillRect(d.x + q * d.drift, d.y + q * q * d.fall, d.s, d.s);
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- hero: halftone flower that reacts to the cursor ---------- */
  function flowerTone(x, y, W, H, wide) {
    var cx = wide ? W * 0.66 : W * 0.64, cy = wide ? H * 0.57 : H * 0.54;
    var R = wide ? Math.min(W, H) * 0.64 : Math.min(W, H) * 0.52;
    var dx = x - cx, dy = y - cy, r = Math.sqrt(dx * dx + dy * dy), th = Math.atan2(dy, dx);
    var layers = [
      { n: 5, R: R, phi: 0.35, base: 0.26 },
      { n: 5, R: R * 0.64, phi: 0.35 + Math.PI / 5, base: 0.42 },
      { n: 5, R: R * 0.36, phi: 0.35, base: 0.58 }
    ];
    var tone = 0;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i], sector = Math.PI * 2 / L.n;
      var a = ((th - L.phi) % sector + sector) % sector - sector / 2;
      var u = a / (sector / 2);
      var edge = L.R * (0.5 + 0.5 * Math.sqrt(Math.max(0, 1 - u * u)));
      if (r < edge) {
        var q = r / edge, v = L.base + 0.42 * q * q;
        if (q > 0.18) v += 0.28 * Math.exp(-u * u * 90);
        v += 0.3 * Math.max(0, (Math.abs(u) - 0.82) / 0.18);
        v -= 0.55 * Math.exp(-(1 - q) * (1 - q) * 900);
        tone = v;
      }
    }
    if (r < R * 0.14 && r > R * 0.115) tone = 0.05;
    if (r <= R * 0.115) tone = 0.82 + 0.18 * hash(Math.round(x), Math.round(y), 2);
    tone += (hash(x, y, 1) - 0.5) * 0.1;
    if (hash(x, y, 4) < 0.05) tone *= 0.25;
    if (wide) { var fx = Math.min(1, Math.max(0, x / (W * 0.34))); tone *= fx * fx * (3 - 2 * fx); }
    else { var fy = Math.min(1, Math.max(0, (H - y) / (H * 0.18))); tone *= fy * fy * (3 - 2 * fy); }
    return Math.max(0, Math.min(1, tone));
  }

  function Hero(el) {
    var self = this;
    this.el = el; this.cells = []; this.mx = -1e4; this.my = -1e4; this.inside = false; this.raf = 0; this.mode = 'art';
    this.keys = {};
    function local(e) { var b = el.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
    el.addEventListener('pointermove', function (e) {
      var q = local(e);
      if (self.mode === 'game') { self.g.paddle.x = q[0]; return; }
      if (e.pointerType === 'touch') return;
      self.mx = q[0]; self.my = q[1]; self.inside = true; self.kick();
    });
    el.addEventListener('pointerleave', function () { self.inside = false; self.mx = self.my = -1e4; self.kick(); });
    el.addEventListener('pointerdown', function (e) {
      var q = local(e);
      if (self.mode === 'game') { self.g.paddle.x = q[0]; self.launch(); return; }
      if (e.pointerType !== 'touch') return;
      self.mx = q[0]; self.my = q[1]; self.inside = true; self.kick();
      setTimeout(function () { self.inside = false; self.mx = self.my = -1e4; self.kick(); }, 450);
    });
    window.addEventListener('keydown', function (e) {
      if (self.mode !== 'game' || !self.visible) return;
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd') { self.keys[k] = true; e.preventDefault(); }
      else if (k === ' ') { self.launch(); e.preventDefault(); }
      else if (k === 'Escape') { self.stopGame(); }
    });
    window.addEventListener('keyup', function (e) { self.keys[e.key] = false; });
    this.visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; if (self.visible) self.kick(); }).observe(el);
  }
  Hero.prototype.build = function (intro) {
    if (!this.el.clientWidth) return;
    var c = setup(this.el); this.ctx = c.ctx; this.W = c.W; this.H = c.H;
    var wide = c.W >= 700, cell = c.W < 600 ? 9 : 12;
    var cols = Math.ceil(c.W / cell), rows = Math.ceil(c.H / cell);
    this.cell = cell; this.cols = cols; this.rows = rows; this.cells = [];
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var x = i * cell + cell / 2, y = j * cell + cell / 2;
      var o = { x: x, y: y, t: flowerTone(x, y, c.W, c.H, wide), micro: (i + j) % 3 === 0 && i % 2 === 0, ox: 0, oy: 0, alive: true };
      if (intro && !reduced) { o.ox = (hash(i, j, 7) - 0.5) * 320; o.oy = (hash(i, j, 8) - 0.5) * 320; }
      this.cells.push(o);
    }
    if (this.mode === 'game') this.resetBoard();
    this.kick();
  };
  Hero.prototype.kick = function () { var self = this; if (this.raf) return; this.raf = requestAnimationFrame(function (t) { self.raf = 0; if (self.mode === 'game') self.gameStep(t); else self.step(); }); };
  Hero.prototype.dot = function (ctx, o, X, Y, hollow) {
    var rad = (0.16 + 0.84 * o.t) * this.cell * 0.48;
    if (hollow) {
      ctx.strokeStyle = PAL.mark; ctx.lineWidth = 1;
      if (o.t > 0.6) cross(ctx, X, Y, rad * 0.7);
      else { ctx.beginPath(); ctx.arc(X, Y, Math.max(1.5, rad), 0, Math.PI * 2); ctx.stroke(); }
    } else if (PAL.dark) { var sq = rad * 1.72; ctx.fillStyle = PAL.mark; ctx.fillRect(X - sq / 2, Y - sq / 2, sq, sq); }
    else { ctx.fillStyle = PAL.mark; ctx.beginPath(); ctx.arc(X, Y, rad, 0, Math.PI * 2); ctx.fill(); }
  };
  Hero.prototype.step = function () {
    var p = PAL, ctx = this.ctx, moving = false, R0 = 110;
    if (!ctx) return;
    ctx.fillStyle = p.field; ctx.fillRect(0, 0, this.W, this.H);
    for (var k = 0; k < this.cells.length; k++) {
      var o = this.cells[k], tx = 0, ty = 0;
      if (!reduced && this.inside) {
        var dx = o.x - this.mx, dy = o.y - this.my, d = Math.sqrt(dx * dx + dy * dy);
        if (d < R0 && d > 0.01) { var f = 1 - d / R0; f = f * f * 26; tx = dx / d * f; ty = dy / d * f; }
      }
      if (!reduced) {
        var nx = o.ox + (tx - o.ox) * 0.14, ny = o.oy + (ty - o.oy) * 0.14;
        if (Math.abs(nx - o.ox) > 0.04 || Math.abs(ny - o.oy) > 0.04) moving = true;
        o.ox = nx; o.oy = ny;
      }
      var X = o.x + o.ox, Y = o.y + o.oy;
      if (o.t < 0.05) {
        if (o.micro) { ctx.fillStyle = p.soft; ctx.globalAlpha = 0.55; ctx.fillRect(X - 0.8, Y - 0.8, 1.6, 1.6); ctx.globalAlpha = 1; }
        continue;
      }
      this.dot(ctx, o, X, Y, o.ox * o.ox + o.oy * o.oy > 25);
    }
    if (moving || this.inside) this.kick();
  };

  /* ---------- Halftone Breakout: knock the dots out of the bloom ---------- */
  Hero.prototype.startGame = function () {
    this.mode = 'game'; this.inside = false;
    var small = this.W < 600;
    this.g = { score: 0, lives: 3, parts: [], msg: null, last: 0, speed: small ? 330 : 430,
      paddle: { x: this.W / 2, w: small ? 84 : 120, h: 8, y: this.H - 44 }, ball: null };
    this.resetBoard(); this.serve();
    this.el.style.cursor = 'none'; this.el.style.touchAction = 'none';
    this.el.parentNode.classList.add('playing');
    this.kick();
  };
  Hero.prototype.resetBoard = function () {
    var n = 0; for (var k = 0; k < this.cells.length; k++) { var o = this.cells[k]; o.ox = o.oy = 0; o.alive = o.t >= 0.05 && o.y < this.H - 90; if (o.alive) n++; }
    this.g.left = n;
  };
  Hero.prototype.serve = function () { this.g.ball = { x: this.g.paddle.x, y: this.g.paddle.y - 7, vx: 0, vy: 0, stuck: true }; };
  Hero.prototype.launch = function () {
    var g = this.g;
    if (g.msg) { g.score = 0; g.lives = 3; g.msg = null; this.resetBoard(); this.serve(); return; }
    if (!g.ball.stuck) return;
    var a = (hash(g.score, g.lives, 3) - 0.5) * 0.9; g.ball.stuck = false; g.ball.vx = Math.sin(a) * g.speed; g.ball.vy = -Math.cos(a) * g.speed;
  };
  Hero.prototype.stopGame = function () {
    this.mode = 'art'; this.el.style.cursor = ''; this.el.style.touchAction = '';
    this.el.parentNode.classList.remove('playing');
    var btn = this.el.parentNode.querySelector('[data-breakout]'); if (btn) { btn.textContent = 'Play Breakout'; btn.setAttribute('aria-pressed', 'false'); }
    for (var k = 0; k < this.cells.length; k++) this.cells[k].alive = true;
    this.build(true);
  };
  Hero.prototype.cellAt = function (x, y) {
    var i = Math.floor(x / this.cell), j = Math.floor(y / this.cell);
    if (i < 0 || j < 0 || i >= this.cols || j >= this.rows) return null;
    var o = this.cells[j * this.cols + i]; return o && o.alive ? j * this.cols + i : null;
  };
  Hero.prototype.smash = function (idx) {
    var i0 = idx % this.cols, j0 = (idx / this.cols) | 0, g = this.g;
    for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
      var i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= this.cols || j >= this.rows) continue;
      var o = this.cells[j * this.cols + i]; if (!o.alive) continue;
      o.alive = false; g.left--; g.score += 1 + Math.round(o.t * 4);
      if (g.parts.length < 400) g.parts.push({ x: o.x, y: o.y, vx: (hash(i, j, 51) - 0.5) * 80, vy: -40 - hash(i, j, 52) * 60, life: 1, t: o.t });
    }
    if (g.left <= 0) { g.msg = 'Bloom cleared. Score ' + g.score + '. Click to play again'; dispatchEvent(new CustomEvent('sprout:cheer', { detail: 'You cleared the whole bloom!' })); }
  };
  Hero.prototype.gameStep = function (now) {
    var g = this.g, ctx = this.ctx; if (!ctx) return;
    var dt = g.last ? Math.min(0.033, (now - g.last) / 1000) : 0.016; g.last = now;
    if (!this.visible) { g.last = 0; return; }
    var P = g.paddle, B = g.ball;
    if (this.keys.ArrowLeft || this.keys.a) P.x -= 620 * dt;
    if (this.keys.ArrowRight || this.keys.d) P.x += 620 * dt;
    P.x = Math.max(P.w / 2, Math.min(this.W - P.w / 2, P.x));
    if (B.stuck) { B.x = P.x; B.y = P.y - 7; }
    else if (!g.msg) {
      var dist = Math.hypot(B.vx, B.vy) * dt, n = Math.max(1, Math.ceil(dist / 3)), r = 4;
      for (var s = 0; s < n; s++) {
        B.x += B.vx * dt / n; B.y += B.vy * dt / n;
        if (B.x < r) { B.x = r; B.vx = Math.abs(B.vx); }
        if (B.x > this.W - r) { B.x = this.W - r; B.vx = -Math.abs(B.vx); }
        if (B.y < r) { B.y = r; B.vy = Math.abs(B.vy); }
        if (B.vy > 0 && B.y + r >= P.y && B.y - r <= P.y + P.h && Math.abs(B.x - P.x) <= P.w / 2 + r) {
          var off = (B.x - P.x) / (P.w / 2), ang = off * 1.05, sp = Math.hypot(B.vx, B.vy) * 1.01;
          sp = Math.min(sp, g.speed * 1.6); B.vx = Math.sin(ang) * sp; B.vy = -Math.cos(ang) * sp; B.y = P.y - r;
        }
        if (B.y > this.H + 10) { g.lives--; if (g.lives <= 0) g.msg = 'Game over. Score ' + g.score + '. Click to play again'; this.serve(); break; }
        var hx = this.cellAt(B.x + Math.sign(B.vx) * r, B.y);
        if (hx !== null) { this.smash(hx); B.vx = -B.vx; continue; }
        var hy = this.cellAt(B.x, B.y + Math.sign(B.vy) * r);
        if (hy !== null) { this.smash(hy); B.vy = -B.vy; }
      }
    }
    ctx.fillStyle = PAL.field; ctx.fillRect(0, 0, this.W, this.H);
    for (var k = 0; k < this.cells.length; k++) {
      var o = this.cells[k];
      if (o.alive) this.dot(ctx, o, o.x, o.y, false);
      else if (o.micro) { ctx.fillStyle = PAL.soft; ctx.globalAlpha = 0.5; ctx.fillRect(o.x - 0.8, o.y - 0.8, 1.6, 1.6); ctx.globalAlpha = 1; }
    }
    ctx.strokeStyle = PAL.mark; ctx.lineWidth = 1;
    for (var q = g.parts.length - 1; q >= 0; q--) {
      var pt = g.parts[q]; pt.vy += 260 * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt * 1.4;
      if (pt.life <= 0) { g.parts.splice(q, 1); continue; }
      ctx.globalAlpha = pt.life; ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.5 + pt.t * 2.5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = PAL.mark;
    for (var px2 = P.x - P.w / 2; px2 < P.x + P.w / 2 - 1; px2 += 6) ctx.fillRect(px2, P.y, 5, P.h);
    ctx.fillRect(B.x - 4, B.y - 4, 8, 8);
    ctx.font = '500 12px "Geist Mono", ui-monospace, monospace'; ctx.textBaseline = 'top';
    var hud = 'SCORE ' + String(g.score).padStart(4, '0') + '   LIVES ' + '■'.repeat(Math.max(0, g.lives)) + '□'.repeat(3 - Math.max(0, g.lives));
    ctx.fillStyle = PAL.field; var tw = ctx.measureText(hud).width; ctx.fillRect(16, 16, tw + 20, 26);
    ctx.fillStyle = PAL.mark; ctx.fillText(hud, 26, 23);
    var msg = g.msg || (B.stuck ? (this.W < 600 ? 'Tap to launch' : 'Click or press space to launch. Esc to stop') : null);
    if (msg) {
      ctx.textAlign = 'center'; var mw = ctx.measureText(msg).width;
      ctx.fillStyle = PAL.field; ctx.fillRect(this.W / 2 - mw / 2 - 12, this.H - 30 - 9, mw + 24, 26);
      ctx.fillStyle = PAL.mark; ctx.fillText(msg, this.W / 2, this.H - 32); ctx.textAlign = 'left';
    }
    this.kick();
  };

  /* ---------- boot ---------- */
  function boot() {
    var hero = null, statics = [], band = null, field = null, dis = null;
    var heroEl = document.querySelector('[data-hero]');
    if (heroEl) {
      hero = new Hero(heroEl); hero.build(true);
      var btn = document.querySelector('[data-breakout]');
      if (btn) btn.addEventListener('click', function () {
        if (hero.mode === 'game') hero.stopGame();
        else { hero.startGame(); btn.textContent = 'Stop game'; btn.setAttribute('aria-pressed', 'true'); }
      });
    }
    document.querySelectorAll('canvas[data-pattern]').forEach(function (el) {
      if (el.getAttribute('data-pattern') === 'band') { band = new Band(el); band.draw(); return; }
      var s = new Static(el);
      if (el.hasAttribute('data-instant')) { s.progress = 1; s.started = true; }
      statics.push(s); s.draw();
      var card = el.closest('.card');
      if (card) card.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        var b = el.getBoundingClientRect(); s.hover(Math.max(0, Math.min(b.width, e.clientX - b.left)), Math.max(0, Math.min(b.height, e.clientY - b.top)));
      });
    });
    if ('IntersectionObserver' in window && !reduced) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          statics.forEach(function (s) { if (s.el === en.target) s.reveal(); });
          io.unobserve(en.target);
        });
      }, { threshold: 0.25 });
      statics.forEach(function (s) { if (!s.started) io.observe(s.el); });
    } else {
      statics.forEach(function (s) { s.progress = 1; s.started = true; s.draw(); });
    }
    var fine = false; try { fine = window.matchMedia('(pointer: fine)').matches; } catch (e) {}
    if (fine && !reduced) field = new Field();
    var h1 = document.querySelector('.hero h1');
    if (h1 && !reduced) dis = new Dissolve(h1);
    window.addEventListener('themechange', function () {
      refreshPal();
      statics.forEach(function (s) { s.draw(); });
      if (band) band.render();
      if (field) field.render();
      if (dis) dis.render();
      if (hero) hero.kick();
    });
    var lastW = window.innerWidth, t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var widthChanged = window.innerWidth !== lastW; lastW = window.innerWidth;
        statics.forEach(function (s) { s.draw(); });
        if (band) band.draw();
        if (field) field.resize();
        if (dis) dis.sample();
        if (hero && widthChanged) hero.build(false);
      }, 120);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
