/* Abhishek's halftone portrait (About section). Dots scatter from the cursor;
   the toggle re-stitches the portrait as cross-stitch. */
(function () {
  var T = window.PORTRAIT_TONES; var el = document.querySelector('[data-portrait]');
  if (!T || !el) return;
  var P = T.portrait, raw = atob(P.d), tones = new Float32Array(raw.length);
  for (var q = 0; q < raw.length; q++) tones[q] = raw.charCodeAt(q) / 255;
  var C = window.themeColors();
  window.addEventListener('themechange', function () { C = window.themeColors(); kick(); });
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var ctx, W, H, cell, dots = [], mx = -1e4, my = -1e4, inside = false, raf = 0, stitch = false, prog = reduced ? 1 : 0;
  function h(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function build() {
    var d = Math.min(2, devicePixelRatio || 1); W = el.clientWidth; H = W * P.h / P.w;
    el.style.height = H + 'px'; el.width = W * d; el.height = H * d; ctx = el.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    cell = W / P.w; dots = [];
    for (var j = 0; j < P.h; j++) for (var i = 0; i < P.w; i++) {
      var v = tones[j * P.w + i]; if (v < 0.03) continue;
      dots.push({ x: (i + 0.5) * cell, y: (j + 0.5) * cell, v: v, ox: 0, oy: 0, r: h(i, j) });
    }
    kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; draw(); }); }
  function draw() {
    var moving = false, R0 = W * 0.2;
    ctx.fillStyle = C.field; ctx.fillRect(0, 0, W, H);
    for (var k = 0; k < dots.length; k++) {
      var o = dots[k]; if (o.r > prog) continue;
      var tx = 0, ty = 0;
      if (inside && !reduced) { var dx = o.x - mx, dy = o.y - my, d = Math.sqrt(dx * dx + dy * dy);
        if (d < R0 && d > 0.01) { var f = 1 - d / R0; f = f * f * cell * 2.6; tx = dx / d * f; ty = dy / d * f; } }
      var nx = o.ox + (tx - o.ox) * 0.16, ny = o.oy + (ty - o.oy) * 0.16;
      if (Math.abs(nx - o.ox) > 0.03 || Math.abs(ny - o.oy) > 0.03) moving = true;
      o.ox = nx; o.oy = ny;
      var X = o.x + o.ox, Y = o.y + o.oy;
      if (stitch) {
        var s = cell * (0.14 + 0.3 * o.v); ctx.strokeStyle = o.v > 0.45 ? C.mark : C.soft; ctx.lineWidth = Math.max(1, cell * 0.16); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X - s, Y - s); ctx.lineTo(X + s, Y + s); ctx.moveTo(X + s, Y - s); ctx.lineTo(X - s, Y + s); ctx.stroke();
      } else {
        var rr = (0.1 + 0.9 * o.v) * cell * 0.5; ctx.fillStyle = C.mark;
        if (C.dark) { var sq = rr * 1.72; ctx.fillRect(X - sq / 2, Y - sq / 2, sq, sq); } else { ctx.beginPath(); ctx.arc(X, Y, rr, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    if (moving || inside) kick();
  }
  el.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var b = el.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; inside = true; kick(); });
  el.addEventListener('pointerleave', function () { inside = false; kick(); });
  var btn = document.querySelector('[data-portrait-toggle]');
  if (btn) btn.addEventListener('click', function () {
    stitch = !stitch; btn.setAttribute('aria-pressed', String(stitch)); btn.textContent = stitch ? 'Back to dots' : 'Stitch it';
    if (reduced) { draw(); return; }
    prog = 0; var t0 = performance.now();
    (function tk(now) { prog = Math.min(1, (now - t0) / 700); draw(); if (prog < 1) requestAnimationFrame(tk); })(t0);
  });
  build();
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return; io.disconnect(); var t0 = performance.now();
      (function tk(now) { prog = Math.min(1, (now - t0) / 1200); prog = 1 - Math.pow(1 - prog, 3); draw(); if (prog < 1) requestAnimationFrame(tk); })(t0);
    }, { threshold: 0.3 });
    io.observe(el);
  } else { prog = 1; draw(); }
  var lw = innerWidth; addEventListener('resize', function () { if (innerWidth !== lw) { lw = innerWidth; build(); } });
})();
