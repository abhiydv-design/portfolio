/* Fun layer: 8-bit sound, stickers (achievements) with a secret palette, Konami stitch mode,
   screensaver, keyboard shortcuts, the shared pixel garden, and a note for developers. */
(function () {
  var html = document.documentElement;
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function typing(e) { var t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
  function gaming() {
    var d = document.getElementById('snake-dialog');
    return !!document.querySelector('.hero-art.playing') || (d && d.open) || !!document.querySelector('[data-snake-inline]');
  }
  function emit(name, detail) { dispatchEvent(new CustomEvent(name, { detail: detail })); }

  /* ================= 8-bit sound (off until switched on) ================= */
  var AC = null, soundOn = store.get('sound', false), last = {};
  function ctx() {
    if (!AC) { var K = window.AudioContext || window.webkitAudioContext; if (!K) return null; AC = new K(); }
    if (AC.state === 'suspended') AC.resume(); return AC;
  }
  function beep(f, dur, type, vol, delay) {
    var a = ctx(); if (!a) return; var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.04, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
  }
  var SFX = {
    hover: function () { beep(1046, 0.04, 'square', 0.012); },
    click: function () { beep(523, 0.035, 'square', 0.025); },
    stitch: function () { beep(660 + Math.random() * 160, 0.07, 'triangle', 0.05); },
    hit: function (p) { beep(280 + (p || 0) * 700, 0.045, 'square', 0.02); },
    eat: function () { beep(523, 0.06, 'square', 0.035); beep(784, 0.08, 'square', 0.035, 0.06); },
    lose: function () { beep(330, 0.12, 'square', 0.035); beep(196, 0.22, 'square', 0.035, 0.12); },
    water: function () { beep(392, 0.08, 'sine', 0.06); beep(587, 0.12, 'sine', 0.05, 0.07); },
    sticker: function () { [523, 659, 784, 1046].forEach(function (f, i) { beep(f, 0.09, 'square', 0.03, i * 0.075); }); },
    toggle: function () { beep(740, 0.05, 'triangle', 0.05); }
  };
  window.pixelSound = function (n, p) {
    if (!soundOn || !SFX[n]) return; var now = performance.now();
    if (last[n] && now - last[n] < 38) return; last[n] = now; try { SFX[n](p); } catch (e) {}
  };
  var sBtn = document.querySelector('[data-sound-toggle]');
  function paintSound() { if (sBtn) { sBtn.setAttribute('aria-pressed', String(soundOn)); sBtn.setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on'); } }
  function toggleSound() { soundOn = !soundOn; store.set('sound', soundOn); paintSound(); if (soundOn) { ctx(); pixelSound('toggle'); } }
  if (sBtn) sBtn.addEventListener('click', toggleSound);
  paintSound();
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse' || !e.target.closest) return;
    var c = e.target.closest('.card'); if (c && !(e.relatedTarget && c.contains(e.relatedTarget))) pixelSound('hover');
  });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a, button') && !e.target.closest('[data-sound-toggle]')) pixelSound('click'); });

  /* ================= toast ================= */
  var toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); toastEl.hidden = true;
  document.body.appendChild(toastEl); var toastT = 0;
  function toast(node) {
    toastEl.innerHTML = ''; toastEl.appendChild(node); toastEl.hidden = false; toastEl.classList.remove('out');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.add('out'); setTimeout(function () { toastEl.hidden = true; }, 300); }, 3800);
  }

  /* ================= stickers ================= */
  var ICON = {
    explorer: ['#.......', '####....', '######..', '####....', '#.......', '#.......', '#.......', '#.......'],
    gardener: ['...#....', '..###...', '..###...', '.#####..', '.#####..', '.##.##..', '..###...', '........'],
    snake: ['........', '.#####..', '.#......', '.#####..', '.....#..', '.#####.#', '.......#', '........'],
    breakout: ['##.##.##', '##.##.##', '........', '...##...', '...##...', '........', '........', '.######.'],
    stitcher: ['#......#', '.#....#.', '..#..#..', '...##...', '...##...', '..#..#..', '.#....#.', '#......#'],
    night: ['..###...', '.##.....', '##......', '##......', '##......', '.##.....', '..###...', '........'],
    voice: ['........', '...#....', '.#.#.#..', '.#.#.##.', '##.#.##.', '.#.#.#..', '...#....', '........'],
    portrait: ['.######.', '#......#', '#.#..#.#', '#......#', '#......#', '#.#..#.#', '#..##..#', '.######.'],
    konami: ['...##...', '..####..', '.######.', '...##...', '...##...', '...##...', '...##...', '........'],
    dreamer: ['........', '#####...', '...#....', '..#.....', '#####...', '.....###', '......#.', '.....###']
  };
  var LIST = [
    ['explorer', 'Explorer', 'Scroll to the end so Sprout blooms'],
    ['gardener', 'Gardener', 'Water Sprout five times'],
    ['snake', 'Charmer', 'Play a round of Snake'],
    ['breakout', 'Wrecker', 'Score 150 in Breakout'],
    ['stitcher', 'Stitcher', 'Finish the stitch game'],
    ['night', 'Night owl', 'Switch the colour theme'],
    ['voice', 'Chatterbox', 'Talk to the AI voice agent'],
    ['portrait', 'Tailor', 'Stitch the portrait'],
    ['konami', 'Old school', 'Enter the Konami code'],
    ['dreamer', 'Dreamer', 'Let the screensaver start']
  ];
  function iconSVG(id) {
    var rows = ICON[id], r = '';
    rows.forEach(function (row, y) { for (var x = 0; x < 8; x++) if (row[x] === '#') r += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; });
    return '<svg viewBox="0 0 8 8" width="32" height="32" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor">' + r + '</svg>';
  }
  var got = store.get('stickers', {}), waters = 0;
  function count() { return LIST.filter(function (s) { return got[s[0]]; }).length; }
  function paintCount() { document.querySelectorAll('[data-sticker-count]').forEach(function (n) { n.textContent = count() + '/' + LIST.length; }); }
  function unlock(id) {
    if (got[id] || !ICON[id]) return;
    got[id] = Date.now(); store.set('stickers', got); paintCount(); pixelSound('sticker');
    var s = LIST.filter(function (x) { return x[0] === id; })[0];
    var n = document.createElement('div'); n.className = 'toast-body';
    n.innerHTML = iconSVG(id) + '<span><b>Sticker unlocked: ' + s[1] + '</b><br>' + count() + ' of ' + LIST.length + ' collected. Press S to see them.</span>';
    toast(n);
    if (count() === LIST.length && !store.get('ember', false)) setTimeout(unlockEmber, 2400);
    if (sheet && sheet.open) renderSheet();
  }
  addEventListener('achieve', function (e) { unlock(e.detail); });
  addEventListener('sprout:watered', function () { waters++; if (waters >= 5) unlock('gardener'); });
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) { b.addEventListener('click', function () { pixelSound('toggle'); unlock('night'); }); });

  function unlockEmber() {
    store.set('ember', true);
    var n = document.createElement('div'); n.className = 'toast-body';
    n.innerHTML = iconSVG('explorer') + '<span><b>All ten! Secret Ember palette unlocked.</b><br>The theme button now has a third setting.</span>';
    toast(n); pixelSound('sticker');
    html.setAttribute('data-theme', 'ember'); try { localStorage.setItem('theme', 'ember'); } catch (e) {}
    emit('themechange');
  }

  var sheet = document.createElement('dialog'); sheet.className = 'sheet'; sheet.setAttribute('aria-label', 'Sticker sheet');
  document.body.appendChild(sheet);
  function renderSheet() {
    var items = LIST.map(function (s) {
      var have = !!got[s[0]];
      return '<li class="sticker' + (have ? ' have' : '') + '">' + iconSVG(s[0]) + '<span class="st-name">' + (have ? s[1] : 'Locked') + '</span><span class="st-hint">' + s[2] + '</span></li>';
    }).join('');
    sheet.innerHTML = '<div class="game-bar"><span>Sticker sheet, <span data-sticker-count></span></span><button type="button" data-close-sheet>Close</button></div>' +
      '<ul class="stickers">' + items + '</ul>' +
      '<p class="sheet-foot">' + (store.get('ember', false) ? 'Ember palette unlocked. Use the theme button to switch to it.' : 'Collect all ten to unlock a secret palette.') + '</p>';
    sheet.querySelector('[data-close-sheet]').addEventListener('click', function () { sheet.close(); });
    paintCount();
  }
  function openSheet() { renderSheet(); if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', ''); }
  sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
  document.querySelectorAll('[data-open-stickers]').forEach(function (b) { b.addEventListener('click', openSheet); });
  paintCount();

  /* ================= Konami code: the page becomes cross-stitch ================= */
  var KON = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], kp = 0;
  addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kp = k === KON[kp] ? kp + 1 : (k === KON[0] ? 1 : 0);
    if (kp === KON.length) { kp = 0; unlock('konami'); stitchMode(); }
  });
  var stitching = false;
  function stitchMode() {
    if (stitching) return; stitching = true;
    var cv = document.createElement('canvas'); cv.className = 'curtain'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    var d = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight; cv.width = W * d; cv.height = H * d;
    var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
    var T = window.themeColors(), cell = 16, cols = Math.ceil(W / cell), rows = Math.ceil(H / cell), t0 = performance.now();
    var sew = reduced ? 1 : 900, hold = 500, unsew = reduced ? 1 : 900;
    function rnd(i, j) { var n = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return n - Math.floor(n); }
    function frame(now) {
      var t = now - t0; c.clearRect(0, 0, W, H);
      c.lineWidth = 2; c.lineCap = 'round';
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
        var appear = ((j + rnd(i, j) * 3) / (rows + 3)) * sew, vanish = sew + hold + rnd(j, i) * unsew;
        if (t < appear || t > vanish) continue;
        var x = i * cell + cell / 2, y = j * cell + cell / 2, s = 5;
        c.strokeStyle = (i + j) % 7 === 0 ? T.soft : T.accent;
        c.beginPath(); c.moveTo(x - s, y - s); c.lineTo(x + s, y + s); c.moveTo(x + s, y - s); c.lineTo(x - s, y + s); c.stroke();
      }
      if (t > sew && !window.__stitch) { window.__stitch = true; html.classList.add('stitch-mode'); emit('stitchmode'); }
      if (t < sew + hold + unsew) requestAnimationFrame(frame);
      else {
        cv.remove();
        setTimeout(function () { window.__stitch = false; html.classList.remove('stitch-mode'); emit('stitchmode'); stitching = false; }, 5000);
      }
    }
    requestAnimationFrame(frame);
  }

  /* ================= screensaver: the bloom bounces around ================= */
  var idleT = 0, saver = null;
  function resetIdle() { clearTimeout(idleT); if (saver) stopSaver(); if (!reduced) idleT = setTimeout(startSaver, 60000); }
  ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(function (ev) { addEventListener(ev, resetIdle, { passive: true }); });
  function busy() {
    var v = document.querySelector('[data-voice]'), st = v && v.getAttribute('data-state');
    return gaming() || st === 'live' || st === 'connecting' || document.hidden || (sheet && sheet.open);
  }
  function startSaver() {
    if (busy()) { resetIdle(); return; }
    var T = window.themeColors(), wrap = document.createElement('div'); wrap.className = 'saver'; wrap.setAttribute('aria-hidden', 'true');
    var cv = document.createElement('canvas'); wrap.appendChild(cv); document.body.appendChild(wrap);
    var d = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight; cv.width = W * d; cv.height = H * d;
    var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
    var R = Math.min(120, W * 0.18), cell = 8, pts = [];
    for (var y = -R; y <= R; y += cell) for (var x = -R; x <= R; x += cell) {
      var r = Math.hypot(x, y), th = Math.atan2(y, x), petal = Math.abs(Math.cos(th * 2.5));
      var edge = R * (0.55 + 0.45 * petal); if (r > edge) continue;
      var v = r < R * 0.16 ? 0.95 : (r < R * 0.2 ? 0 : 0.35 + 0.55 * (r / edge));
      if (v > 0.05) pts.push([x, y, v]);
    }
    var colors = [T.mark, T.accent, T.soft, T.deep], ci = 0, px = Math.random() * (W - 2 * R) + R, py = Math.random() * (H - 2 * R) + R, vx = 1.4, vy = 1.1;
    saver = { wrap: wrap, raf: 0 };
    unlock('dreamer');
    (function step() {
      px += vx; py += vy; var hitX = px < R || px > W - R, hitY = py < R || py > H - R;
      if (hitX) vx = -vx; if (hitY) vy = -vy; if (hitX || hitY) ci = (ci + 1) % colors.length;
      c.fillStyle = T.page; c.fillRect(0, 0, W, H); c.fillStyle = colors[ci];
      pts.forEach(function (p) { var s = (0.2 + 0.8 * p[2]) * cell * 0.9; if (T.dark) c.fillRect(px + p[0] - s / 2, py + p[1] - s / 2, s, s); else { c.beginPath(); c.arc(px + p[0], py + p[1], s / 2, 0, Math.PI * 2); c.fill(); } });
      if (saver) saver.raf = requestAnimationFrame(step);
    })();
  }
  function stopSaver() { if (!saver) return; cancelAnimationFrame(saver.raf); var w = saver.wrap; saver = null; w.classList.add('out'); setTimeout(function () { w.remove(); }, 300); }
  resetIdle();

  /* ================= keyboard shortcuts ================= */
  var help = document.createElement('dialog'); help.className = 'sheet help'; help.setAttribute('aria-label', 'Keyboard shortcuts');
  help.innerHTML = '<div class="game-bar"><span>Secrets and shortcuts</span><button type="button" data-close-help>Close</button></div>' +
    '<dl class="keys">' +
    '<div><dt><kbd>?</kbd></dt><dd>Show this panel</dd></div>' +
    '<div><dt><kbd>T</kbd></dt><dd>Switch colour theme</dd></div>' +
    '<div><dt><kbd>W</kbd></dt><dd>Water Sprout</dd></div>' +
    '<div><dt><kbd>S</kbd></dt><dd>Open the sticker sheet</dd></div>' +
    '<div><dt><kbd>M</kbd></dt><dd>Sound on or off</dd></div>' +
    '<div><dt>type <kbd>play</kbd></dt><dd>Open Snake</dd></div>' +
    '<div><dt><kbd>↑↑↓↓←→←→BA</kbd></dt><dd>You know what this does</dd></div>' +
    '</dl>';
  document.body.appendChild(help);
  help.querySelector('[data-close-help]').addEventListener('click', function () { help.close(); });
  help.addEventListener('click', function (e) { if (e.target === help) help.close(); });
  addEventListener('keydown', function (e) {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || gaming() || e.repeat) return;
    var k = e.key;
    if (k === '?') { e.preventDefault(); if (help.open) help.close(); else { help.showModal ? help.showModal() : help.setAttribute('open', ''); } return; }
    if (document.querySelector('dialog[open]')) return;
    var lk = k.toLowerCase();
    if (lk === 't') { var tb = document.querySelector('[data-theme-toggle]'); if (tb) tb.click(); }
    else if (lk === 'w') { var sp = document.querySelector('[data-sprout]'); if (sp) sp.click(); }
    else if (lk === 's') openSheet();
    else if (lk === 'm') toggleSound();
  });

  /* ================= shared pixel garden ================= */
  var garden = document.querySelector('[data-garden]');
  function drawGarden(n) {
    if (!garden) return; var cv = garden.querySelector('canvas'), T = window.themeColors();
    var W = cv.clientWidth, H = 30, d = Math.min(2, devicePixelRatio || 1); cv.width = W * d; cv.height = H * d;
    var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, W, H);
    var fg = getComputedStyle(garden).color, acc = getComputedStyle(garden).getPropertyValue('--foot-accent').trim() || T.soft;
    var slots = Math.floor(W / 12), show = Math.min(n, slots), P = 2;
    for (var k = 0; k < show; k++) {
      var x = k * 12 + 2, hgt = 3 + ((k * 7) % 4);
      c.fillStyle = fg; for (var y = 0; y < hgt; y++) c.fillRect(x + 2 * P, H - (y + 1) * P, P, P);
      var top = H - (hgt + 1) * P; c.fillStyle = k % 3 === 0 ? acc : fg;
      [[1, 0], [3, 0], [2, -1], [2, 1]].forEach(function (q) { c.fillRect(x + q[0] * P, top + q[1] * P - P, P, P); });
    }
  }
  function showGarden(n, mine) {
    if (!garden || typeof n !== 'number') return;
    garden.hidden = false; garden.setAttribute('data-n', n); drawGarden(n);
    garden.querySelector('[data-garden-text]').textContent = mine
      ? 'You planted flower #' + n + '. Thanks for visiting.'
      : n + (n === 1 ? ' flower' : ' flowers') + ' planted by visitors. Scroll to the end to plant yours.';
  }
  if (garden) {
    fetch('/api/garden').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && typeof j.count === 'number') showGarden(j.count, store.get('planted', false));
    }).catch(function () {});
    addEventListener('sprout:bloom', function () {
      unlock('explorer');
      if (store.get('planted', false)) return;
      fetch('/api/garden', { method: 'POST' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (j && typeof j.count === 'number') { store.set('planted', true); showGarden(j.count, true); }
      }).catch(function () {});
    });
    addEventListener('themechange', function () { if (!garden.hidden) drawGarden(parseInt(garden.getAttribute('data-n') || '0', 10)); });
  } else addEventListener('sprout:bloom', function () { unlock('explorer'); });

  /* ================= a note for anyone who opens dev tools ================= */
  try {
    console.log('%c' +
      '      ##\n' +
      '    ## ##\n' +
      '  ##   #\n' +
      '     ##\n' +
      ' ##########\n' +
      '  # o  o #\n' +
      '  #  \\/  #\n' +
      '   ######', 'color:#315BEF;font:12px/1.1 monospace');
    console.log('%cHi, fellow nerd. I design and build with code too.\nThis site is hand-rolled HTML, CSS and canvas. Say hi: abhiydv1002@gmail.com\n\nPsst: press ? on the page for secrets.', 'font:13px/1.5 monospace');
  } catch (e) {}
})();
