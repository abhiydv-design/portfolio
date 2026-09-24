/* Pixel / halftone pattern system for Abhishek's portfolio.
   Every graphic on the site is drawn here from a small grid of marks. */
(function () {
  var PAL = {
    page: '#F7F7F2', ink: '#111111', field: '#315BEF', mark: '#F7F7F2',
    soft: '#8EA4FF', deep: '#2146C7', dark: '#111111'
  };
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
        else { ctx.strokeStyle = p.field; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.stroke(); }
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
            col = sn < 0.16 ? p.ink : (sn > 0.8 ? p.deep : (across * lf.side > 0 ? p.field : p.soft));
            break;
          }
        }
      }
      if (col) { ctx.strokeStyle = col; cross(ctx, x, y, 3.6); }
    }
  };

  DRAW.land = function (ctx, W, H, p, show) {
    ctx.fillStyle = p.dark; ctx.fillRect(0, 0, W, H);
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
    ctx.fillStyle = p.dark;
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
  }
  Static.prototype.draw = function () {
    if (!this.el.clientWidth) return;
    var c = setup(this.el), pr = this.progress;
    var show = pr >= 1 ? function () { return true; } : function (i, j) { return hash(i, j, 99) < pr; };
    DRAW[this.name](c.ctx, c.W, c.H, PAL, show);
  };
  Static.prototype.reveal = function () {
    if (this.started) return; this.started = true;
    var self = this, t0 = performance.now(), dur = 1100;
    (function tick(now) {
      var k = Math.min(1, (now - t0) / dur); self.progress = 1 - Math.pow(1 - k, 3); self.draw();
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
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
    this.el = el; this.cells = []; this.mx = -1e4; this.my = -1e4; this.inside = false; this.raf = 0;
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var b = el.getBoundingClientRect(); self.mx = e.clientX - b.left; self.my = e.clientY - b.top; self.inside = true; self.kick();
    });
    el.addEventListener('pointerleave', function () { self.inside = false; self.mx = self.my = -1e4; self.kick(); });
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      var b = el.getBoundingClientRect(); self.mx = e.clientX - b.left; self.my = e.clientY - b.top; self.inside = true; self.kick();
      setTimeout(function () { self.inside = false; self.mx = self.my = -1e4; self.kick(); }, 450);
    });
  }
  Hero.prototype.build = function (intro) {
    if (!this.el.clientWidth) return;
    var c = setup(this.el); this.ctx = c.ctx; this.W = c.W; this.H = c.H;
    var wide = c.W >= 700, cell = c.W < 600 ? 9 : 12;
    var cols = Math.ceil(c.W / cell), rows = Math.ceil(c.H / cell);
    this.cell = cell; this.cells = [];
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var x = i * cell + cell / 2, y = j * cell + cell / 2;
      var o = { x: x, y: y, t: flowerTone(x, y, c.W, c.H, wide), micro: (i + j) % 3 === 0 && i % 2 === 0, ox: 0, oy: 0 };
      if (intro && !reduced) { o.ox = (hash(i, j, 7) - 0.5) * 320; o.oy = (hash(i, j, 8) - 0.5) * 320; }
      this.cells.push(o);
    }
    this.kick();
  };
  Hero.prototype.kick = function () { var self = this; if (this.raf) return; this.raf = requestAnimationFrame(function () { self.raf = 0; self.step(); }); };
  Hero.prototype.step = function () {
    var p = PAL, ctx = this.ctx, moving = false, R0 = 110, cell = this.cell;
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
      var X = o.x + o.ox, Y = o.y + o.oy, disturbed = o.ox * o.ox + o.oy * o.oy > 25;
      if (o.t < 0.05) {
        if (o.micro) { ctx.fillStyle = p.soft; ctx.globalAlpha = 0.55; ctx.fillRect(X - 0.8, Y - 0.8, 1.6, 1.6); ctx.globalAlpha = 1; }
        continue;
      }
      var rad = (0.16 + 0.84 * o.t) * cell * 0.48;
      if (disturbed) {
        ctx.strokeStyle = p.mark; ctx.lineWidth = 1;
        if (o.t > 0.6) cross(ctx, X, Y, rad * 0.7);
        else { ctx.beginPath(); ctx.arc(X, Y, Math.max(1.5, rad), 0, Math.PI * 2); ctx.stroke(); }
      } else {
        ctx.fillStyle = p.mark; ctx.beginPath(); ctx.arc(X, Y, rad, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (moving || this.inside) this.kick();
  };

  /* ---------- boot ---------- */
  function boot() {
    var hero = null, statics = [];
    var heroEl = document.querySelector('[data-hero]');
    if (heroEl) { hero = new Hero(heroEl); hero.build(true); }
    document.querySelectorAll('canvas[data-pattern]').forEach(function (el) {
      var s = new Static(el);
      if (el.hasAttribute('data-instant')) { s.progress = 1; s.started = true; }
      statics.push(s); s.draw();
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
    var lastW = window.innerWidth, t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var widthChanged = window.innerWidth !== lastW; lastW = window.innerWidth;
        statics.forEach(function (s) { s.draw(); });
        if (hero && widthChanged) hero.build(false);
      }, 120);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
