/* Sprout: a pixel seedling in a pot. It grows as you scroll (seed, sprout, leaves, bud, bloom),
   watches your cursor, droops when ignored, and perks up when you water it (click). */
(function () {
  var root = document.querySelector('[data-sprout]'); if (!root) return;
  var cv = root.querySelector('canvas'), bubble = document.querySelector('[data-sprout-bubble]');
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var GW = 16, GH = 25, P = 3, ctx, C = window.themeColors();
  var grow = 0, lastActive = performance.now(), tickN = 0, blinkAt = 30, hover = false;
  var happyUntil = 0, drops = [], look = [1, 1], swayFast = false, lost = !!document.querySelector('[data-snake-inline]');
  var hour = new Date().getHours(), night = hour >= 22 || hour < 6, morning = hour >= 6 && hour < 10, wokeUntil = 0;
  var seen = {}; try { seen = JSON.parse(sessionStorage.getItem('sprout-said') || '{}'); } catch (e) {}

  function setup() {
    var d = Math.min(2, devicePixelRatio || 1); P = innerWidth < 640 ? 2.5 : 3;
    cv.style.width = GW * P + 'px'; cv.style.height = GH * P + 'px';
    cv.width = GW * P * d; cv.height = GH * P * d; ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(x * P, y * P, P, P); }

  /* ---- speech bubble ---- */
  var hideT = 0;
  function say(key, text, force) {
    if (!bubble || (!force && seen[key])) return;
    seen[key] = 1; try { sessionStorage.setItem('sprout-said', JSON.stringify(seen)); } catch (e) {}
    bubble.textContent = text; bubble.hidden = false; bubble.classList.remove('out');
    clearTimeout(hideT); hideT = setTimeout(function () { bubble.classList.add('out'); setTimeout(function () { bubble.hidden = true; }, 300); }, 4200);
  }

  /* ---- growth follows the furthest point you've scrolled to ---- */
  function onScroll() {
    lastActive = performance.now();
    var max = document.documentElement.scrollHeight - innerHeight;
    var g = max > 40 ? Math.min(1, scrollY / max) : 1;
    if (g > grow) {
      var before = grow; grow = g;
      if (before < 0.1 && grow >= 0.1) say('sprout', 'Ooh, a sprout. Keep going.');
      if (before < 0.45 && grow >= 0.45) say('play', 'Psst: type "play" anywhere.');
      if (before < 0.75 && grow >= 0.75) say('bud', 'Almost blooming...');
      if (before < 0.95 && grow >= 0.95) { say('bloom', 'Fully grown. Thanks for reading!'); happyUntil = performance.now() + 2500; dispatchEvent(new Event('sprout:bloom')); }
    }
  }

  function draw() {
    var now = performance.now(), asleep = night && now > wokeUntil && now > happyUntil, idle = now - lastActive, droopy = !asleep && idle > 22000 && now > happyUntil && !reduced;
    var happy = now < happyUntil, pot = C.ink, face = C.page, leaf = C.accent, hi = C.soft, bud = C.deep;
    ctx.clearRect(0, 0, GW * P, GH * P);

    // plant
    var h = grow < 0.06 ? 0 : Math.round(2 + Math.min(grow, 0.92) / 0.92 * 10);
    var top = 16 - h + 1, sway = 0;
    if (!reduced) {
      var period = swayFast ? 2 : 9;
      sway = (Math.floor(tickN / period) % 4 === 1) ? 1 : ((Math.floor(tickN / period) % 4 === 3) ? -1 : 0);
    }
    var bend = droopy ? -1 : sway;
    function sx(y) { return y < top + 3 ? bend : 0; }
    if (h === 0) { px(7, 16, bud); px(8, 16, bud); if (!reduced && tickN % 20 < 10) px(7, 15, leaf); }
    for (var y = 16; y >= top; y--) px(7 + sx(y), y, leaf);
    var wave = hover && !reduced && tickN % 4 < 2 ? -1 : 0, dy = droopy ? 1 : 0;
    function leafR(y) { var o = sx(y); px(8 + o, y + dy, leaf); px(9 + o, y + dy + wave, leaf); px(9 + o, y - 1 + dy + wave, hi); px(10 + o, y - 1 + dy + wave, leaf); px(11 + o, y - 2 + dy * 2 + wave, leaf); }
    function leafL(y) { var o = sx(y); px(6 + o, y + dy, leaf); px(5 + o, y + dy + wave, leaf); px(5 + o, y - 1 + dy + wave, hi); px(4 + o, y - 1 + dy + wave, leaf); px(3 + o, y - 2 + dy * 2 + wave, leaf); }
    if (h >= 3) leafL(14);
    if (h >= 5) leafR(12);
    if (h >= 7) leafL(10);
    if (h >= 9) leafR(8);
    var tx = 7 + bend;
    if (grow >= 0.93) {
      var t = top;
      [[-1, -1], [1, -1], [0, -2], [0, 0], [-1, -2], [1, -2], [-1, 0], [1, 0]].forEach(function (d, i) { px(tx + d[0], t - 1 + d[1], i % 2 ? hi : bud); });
      [[-2, -1], [2, -1], [0, -3]].forEach(function (d) { px(tx + d[0], t - 1 + d[1], bud); });
      px(tx, t - 1, pot);
    } else if (grow >= 0.72) { px(tx, top - 1, bud); px(tx + 1, top - 1, bud); px(tx, top - 2, bud); }

    // water drops
    for (var k = drops.length - 1; k >= 0; k--) { var dp = drops[k]; if (dp.y >= 0) px(dp.x, dp.y, hi); }

    // pot
    for (var x = 1; x <= 14; x++) { px(x, 17, pot); px(x, 18, pot); }
    for (y = 19; y <= 24; y++) { var a = y <= 21 ? 2 : (y <= 23 ? 3 : 4); for (x = a; x <= 15 - a; x++) px(x, y, pot); }
    px(2, 17, C.meta); px(13, 17, C.meta);

    // face
    var blink = !reduced && tickN % 42 === blinkAt;
    [5, 9].forEach(function (ex) {
      if (happy) { px(ex, 21, face); px(ex + 1, 20, face); }
      else if (asleep) { px(ex, 21, face); px(ex + 1, 21, face); }
      else if (blink) { px(ex, 21, face); px(ex + 1, 21, face); }
      else {
        if (!droopy) { px(ex, 20, face); px(ex + 1, 20, face); }
        px(ex, 21, face); px(ex + 1, 21, face);
        var lx = lost ? (Math.floor(tickN / 6) % 2) : look[0], ly = droopy ? 1 : look[1];
        px(ex + lx, 20 + ly, pot);
      }
    });
    if (asleep) {
      px(7, 23, face);
      if (!reduced) { var zy = 8 - (tickN % 24) / 3 | 0, zc = C.meta; [[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]].forEach(function (q) { if (zy + q[1] >= 0) px(12 + q[0], zy + q[1], zc); }); }
    }
    else if (droopy) { px(7, 23, face); px(8, 23, face); }
    else if (lost) { px(7, 23, face); }
    else { px(6, 22, face); px(7, 23, face); px(8, 23, face); px(9, 22, face); }

    if (droopy && !seen.thirsty) say('thirsty', 'A little water? Click me.');
  }

  function tick() {
    tickN++;
    for (var k = drops.length - 1; k >= 0; k--) { drops[k].y++; if (drops[k].y > 15) drops.splice(k, 1); }
    draw();
  }
  function water() {
    lastActive = performance.now(); happyUntil = performance.now() + 2200; wokeUntil = performance.now() + 20000;
    dispatchEvent(new Event('sprout:watered')); if (window.pixelSound) pixelSound('water');
    if (!reduced) for (var i = 0; i < 7; i++) drops.push({ x: 4 + Math.floor(Math.random() * 8), y: -Math.floor(Math.random() * 6) - 1 });
    root.classList.remove('hop'); void root.offsetWidth; root.classList.add('hop');
    say('water' + Math.floor(Math.random() * 3), ['Ahh. Much better.', 'Thank you!', 'Glug glug.'][Math.floor(Math.random() * 3)], true);
  }
  function cheer(msg) { happyUntil = performance.now() + 3000; root.classList.remove('hop'); void root.offsetWidth; root.classList.add('hop', 'hop3'); if (msg) say('cheer' + Date.now(), msg, true); setTimeout(function () { root.classList.remove('hop3'); }, 1500); }

  root.addEventListener('click', water);
  root.addEventListener('pointerenter', function () { hover = true; if (night && performance.now() > wokeUntil) say('sleepy', "Zzz... it's late here. Water me to wake me up."); else say('hello', "Hi, I'm Sprout. I grow as you scroll."); });
  root.addEventListener('pointerleave', function () { hover = false; });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('keydown', function () { lastActive = performance.now(); });
  addEventListener('pointermove', function (e) {
    lastActive = performance.now();
    var b = cv.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height * 0.8;
    look = [e.clientX > cx ? 1 : 0, e.clientY > cy ? 1 : 0];
  }, { passive: true });
  addEventListener('themechange', function () { C = window.themeColors(); draw(); });
  addEventListener('resize', function () { setup(); draw(); });
  addEventListener('sprout:cheer', function (e) { cheer(e.detail); });
  addEventListener('sprout:voice', function (e) { swayFast = e.detail === 'speaking'; });

  setup(); onScroll(); draw();
  if (lost) setTimeout(function () { say('lost', "Hmm. I think we're lost.", true); }, 900);
  else if (!night) setTimeout(function () { if (grow < 0.1) say('intro', morning ? "Good morning! Scroll and I'll grow." : "Hi, I'm Sprout. Scroll and I'll grow."); }, 5000);
  var iv = setInterval(tick, 120);
  document.addEventListener('visibilitychange', function () { clearInterval(iv); if (!document.hidden) iv = setInterval(tick, 120); });
})();
