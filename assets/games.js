/* Grid Snake and Stitch the Flower. */
(function () {
  var C = {};
  function refresh() { var t = window.themeColors(); for (var k in t) C[k] = t[k];
    THREADS.A.color = C.ta; THREADS.B.color = C.tb; THREADS.C.color = C.tc; THREADS.D.color = C.td; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function crisp(el, W, H) {
    var d = Math.min(2, window.devicePixelRatio || 1); el.width = W * d; el.height = H * d;
    var ctx = el.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); return ctx;
  }
  function typing(e) { var t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }

  /* ================= Grid Snake ================= */
  function Snake(canvas, scoreEl) {
    this.el = canvas; this.scoreEl = scoreEl; this.cols = 28; this.rows = 18; this.cell = 20;
    this.W = this.cols * this.cell; this.H = this.rows * this.cell;
    this.ctx = crisp(canvas, this.W, this.H); this.active = false; this.timer = 0;
    this.best = parseInt(store('snake-best') || '0', 10) || 0;
    var self = this;
    this.onKey = function (e) {
      if (!self.active || typing(e)) return;
      var k = e.key.toLowerCase(), map = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
      if (map[k]) { e.preventDefault(); self.turn(map[k]); if (!self.running) self.go(); }
      else if (k === ' ' || k === 'enter') { e.preventDefault(); if (!self.running) { if (self.dead) self.reset(); self.go(); } }
    };
    var sx = 0, sy = 0;
    canvas.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    canvas.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) { if (!self.running) { if (self.dead) self.reset(); self.go(); } return; }
      self.turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]); if (!self.running) self.go();
    });
    canvas.addEventListener('click', function () { if (!self.running) { if (self.dead) self.reset(); self.go(); } });
    this.reset();
  }
  Snake.prototype.reset = function () {
    var y = (this.rows / 2) | 0; this.body = [[6, y], [5, y], [4, y]]; this.dir = [1, 0]; this.queue = [];
    this.score = 0; this.dead = false; this.running = false; this.eaten = []; this.place(); this.draw();
  };
  Snake.prototype.place = function () {
    var free; do { free = [(Math.random() * this.cols) | 0, (Math.random() * this.rows) | 0]; }
    while (this.body.some(function (b) { return b[0] === free[0] && b[1] === free[1]; }));
    this.food = free;
  };
  Snake.prototype.turn = function (d) {
    var last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (d[0] === -last[0] && d[1] === -last[1]) return;
    if (d[0] === last[0] && d[1] === last[1]) return;
    if (this.queue.length < 3) this.queue.push(d);
  };
  Snake.prototype.go = function () {
    if (this.running || this.dead) return; this.running = true; var self = this;
    (function loop() {
      if (!self.running) return;
      self.tick(); self.draw();
      self.timer = setTimeout(loop, Math.max(62, 118 - self.score * 2));
    })();
  };
  Snake.prototype.stop = function () { this.running = false; clearTimeout(this.timer); };
  Snake.prototype.tick = function () {
    if (this.queue.length) this.dir = this.queue.shift();
    var h = this.body[0], n = [h[0] + this.dir[0], h[1] + this.dir[1]];
    var hit = n[0] < 0 || n[1] < 0 || n[0] >= this.cols || n[1] >= this.rows ||
      this.body.some(function (b, i) { return i < this.body.length - 1 && b[0] === n[0] && b[1] === n[1]; }, this);
    if (hit) {
      this.dead = true; this.stop();
      if (this.score > this.best) { this.best = this.score; store('snake-best', String(this.best)); if (this.score > 2) dispatchEvent(new CustomEvent('sprout:cheer', { detail: 'New snake record: ' + this.score + '!' })); }
      return;
    }
    this.body.unshift(n);
    if (n[0] === this.food[0] && n[1] === this.food[1]) { this.score++; this.eaten.push(this.food.slice()); this.place(); }
    else this.body.pop();
  };
  Snake.prototype.draw = function () {
    var ctx = this.ctx, c = this.cell, self = this;
    ctx.fillStyle = C.page; ctx.fillRect(0, 0, this.W, this.H);
    ctx.fillStyle = C.ink; ctx.globalAlpha = 0.18;
    for (var j = 0; j < this.rows; j++) for (var i = 0; i < this.cols; i++) ctx.fillRect(i * c + c / 2 - 1, j * c + c / 2 - 1, 2, 2);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.soft; ctx.lineWidth = 1.2;
    this.eaten.forEach(function (e) { ctx.strokeRect(e[0] * c + 5.5, e[1] * c + 5.5, c - 11, c - 11); });
    ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(this.food[0] * c + c / 2, this.food[1] * c + c / 2, 5, 0, Math.PI * 2); ctx.fill();
    this.body.forEach(function (b, i) {
      if (i === 0) { ctx.fillStyle = C.accent; ctx.fillRect(b[0] * c + 2, b[1] * c + 2, c - 4, c - 4); }
      else { ctx.fillStyle = C.ink; var s = Math.max(8, c - 4 - i * 0.25); ctx.fillRect(b[0] * c + (c - s) / 2, b[1] * c + (c - s) / 2, s, s); }
    });
    var msg = this.dead ? 'Game over. Press space or tap to go again' : (!this.running ? 'Arrow keys or swipe to start' : null);
    if (msg) {
      ctx.font = '500 13px "Geist Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var w = ctx.measureText(msg).width; ctx.fillStyle = C.ink; ctx.fillRect(this.W / 2 - w / 2 - 14, this.H / 2 - 16, w + 28, 32);
      ctx.fillStyle = C.page; ctx.fillText(msg, this.W / 2, this.H / 2); ctx.textAlign = 'left';
    }
    if (this.scoreEl) this.scoreEl.textContent = 'Score ' + this.score + '   Best ' + this.best;
  };
  Snake.prototype.activate = function (on) {
    this.active = on;
    if (on) window.addEventListener('keydown', this.onKey); else { window.removeEventListener('keydown', this.onKey); this.stop(); }
  };

  /* ================= Stitch the Flower ================= */
  var PATTERN = [
    '................',
    '......BAAB......',
    '.....BAAAAB.....',
    '..BB.BAAAAB.BB..',
    '.BAAB.BAAB.BAAB.',
    '.BAAAB.BB.BAAAB.',
    '..BAAAACCAAAAB..',
    '...BAACCCCAAB...',
    '...BAACCCCAAB...',
    '..BAAAACCAAAAB..',
    '.BAAAB.CC.BAAAB.',
    '.BAAB..CC..BAAB.',
    '..BB...CC...BB..',
    '..DDD..CC..DDD..',
    '.DDDDD.CC.DDDDD.',
    '..DDDDDCCDDDDD..',
    '....DDDCCDDD....',
    '.......CC.......'
  ];
  var THREADS = { A: { color: '', sym: 'dot' }, B: { color: '', sym: 'ring' }, C: { color: '', sym: 'cross' }, D: { color: '', sym: 'square' } };
  refresh();

  function Stitch(root) {
    this.root = root; this.el = root.querySelector('canvas'); this.cols = 16; this.rows = PATTERN.length;
    this.thread = 'A'; this.done = {}; this.t0 = 0; this.timer = 0; this.total = 0; this.mistakes = 0;
    for (var j = 0; j < this.rows; j++) for (var i = 0; i < this.cols; i++) if (PATTERN[j][i] !== '.') this.total++;
    this.best = parseFloat(store('stitch-best') || '0') || 0;
    var self = this;
    root.querySelectorAll('[data-thread]').forEach(function (b) {
      b.addEventListener('click', function () { self.pick(b.getAttribute('data-thread')); });
    });
    window.addEventListener('keydown', function (e) {
      if (typing(e)) return; var m = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' }[e.key]; if (m) self.pick(m);
    });
    root.querySelector('[data-clear]').addEventListener('click', function () { self.clear(); });
    var down = false;
    this.el.addEventListener('pointerdown', function (e) { down = true; try { self.el.setPointerCapture(e.pointerId); } catch (x) {} self.stitchAt(e); });
    this.el.addEventListener('pointermove', function (e) { if (down) self.stitchAt(e); });
    this.el.addEventListener('pointerup', function () { down = false; });
    this.el.addEventListener('pointercancel', function () { down = false; });
    window.addEventListener('resize', function () { self.size(); });
    this.size(); this.pick('A'); this.stats();
  }
  Stitch.prototype.size = function () {
    var w = this.el.clientWidth; this.cell = w / this.cols; this.W = w; this.H = this.cell * this.rows;
    this.el.style.height = this.H + 'px'; this.ctx = crisp(this.el, w, this.H); this.draw();
  };
  Stitch.prototype.pick = function (t) {
    this.thread = t;
    this.root.querySelectorAll('[data-thread]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-thread') === t ? 'true' : 'false'); });
  };
  Stitch.prototype.stitchAt = function (e) {
    var b = this.el.getBoundingClientRect(), i = Math.floor((e.clientX - b.left) / this.cell), j = Math.floor((e.clientY - b.top) / this.cell);
    if (i < 0 || j < 0 || i >= this.cols || j >= this.rows || PATTERN[j][i] === '.') return;
    var k = j * this.cols + i; if (this.done[k] === this.thread) return;
    if (this.complete()) return;
    if (!this.t0) { this.t0 = performance.now(); var self = this; this.timer = setInterval(function () { self.stats(); }, 100); }
    if (this.thread !== PATTERN[j][i]) this.mistakes++;
    this.done[k] = this.thread; this.draw(); this.stats();
    if (this.complete()) this.finish();
  };
  Stitch.prototype.correct = function () {
    var n = 0; for (var k in this.done) { var i = k % this.cols, j = (k / this.cols) | 0; if (PATTERN[j][i] === this.done[k]) n++; } return n;
  };
  Stitch.prototype.complete = function () { return this.correct() === this.total; };
  Stitch.prototype.elapsed = function () { return this.t0 ? ((this.endT || performance.now()) - this.t0) / 1000 : 0; };
  Stitch.prototype.finish = function () {
    clearInterval(this.timer); this.endT = performance.now(); var t = this.elapsed();
    var rec = !this.best || t < this.best; if (rec) { this.best = t; store('stitch-best', t.toFixed(1)); }
    dispatchEvent(new CustomEvent('sprout:cheer', { detail: rec ? 'New best stitch time!' : 'Beautiful stitching.' }));
    this.root.querySelector('[data-msg]').textContent = 'Finished in ' + t.toFixed(1) + ' s' + (rec ? '. New best.' : '.') + ' Clear the hoop to go again.';
    this.stats();
  };
  Stitch.prototype.clear = function () {
    clearInterval(this.timer); this.done = {}; this.t0 = 0; this.endT = 0; this.mistakes = 0;
    this.root.querySelector('[data-msg]').textContent = ''; this.draw(); this.stats();
  };
  Stitch.prototype.stats = function () {
    var q = function (s) { return this.root.querySelector(s); }.bind(this);
    q('[data-progress]').textContent = Math.round(this.correct() / this.total * 100) + '%';
    q('[data-time]').textContent = this.elapsed().toFixed(1) + ' s';
    q('[data-best]').textContent = this.best ? this.best.toFixed(1) + ' s' : 'None yet';
    q('[data-miss]').textContent = String(this.mistakes);
  };
  Stitch.prototype.draw = function () {
    var ctx = this.ctx, c = this.cell; if (!ctx) return;
    ctx.fillStyle = C.page; ctx.fillRect(0, 0, this.W, this.H);
    ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.1; ctx.lineWidth = 1;
    for (var i = 0; i <= this.cols; i++) { ctx.beginPath(); ctx.moveTo(Math.round(i * c) + 0.5, 0); ctx.lineTo(Math.round(i * c) + 0.5, this.H); ctx.stroke(); }
    for (var j = 0; j <= this.rows; j++) { ctx.beginPath(); ctx.moveTo(0, Math.round(j * c) + 0.5); ctx.lineTo(this.W, Math.round(j * c) + 0.5); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (j = 0; j < this.rows; j++) for (i = 0; i < this.cols; i++) {
      var want = PATTERN[j][i]; if (want === '.') continue;
      var k = j * this.cols + i, got = this.done[k], x = i * c + c / 2, y = j * c + c / 2;
      if (got) {
        ctx.strokeStyle = THREADS[got].color; ctx.lineWidth = Math.max(2, c * 0.12); ctx.lineCap = 'round';
        var s = c * 0.32; ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
        if (got !== want) { ctx.fillStyle = C.ink; ctx.globalAlpha = 0.5; ctx.fillRect(x + c * 0.28, y - c * 0.44, c * 0.14, c * 0.14); ctx.globalAlpha = 1; }
      } else {
        var t = THREADS[want], r = c * 0.13; ctx.globalAlpha = 0.42; ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 1;
        if (t.sym === 'dot') { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
        else if (t.sym === 'ring') { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
        else if (t.sym === 'cross') { ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke(); }
        else ctx.strokeRect(x - r, y - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      }
    }
  };

  /* ================= wiring ================= */
  function boot() {
    var dlg = document.getElementById('snake-dialog'), modal = null;
    function openSnake() {
      if (!dlg || dlg.open) return;
      if (!modal) modal = new Snake(dlg.querySelector('canvas'), dlg.querySelector('[data-score]'));
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      modal.reset(); modal.activate(true);
    }
    if (dlg) {
      dlg.addEventListener('close', function () { if (modal) modal.activate(false); });
      dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
      document.querySelectorAll('[data-open-snake]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openSnake(); }); });
      var buf = '';
      window.addEventListener('keydown', function (e) {
        if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
        buf = (buf + e.key.toLowerCase()).slice(-4); if (buf === 'play') { buf = ''; openSnake(); }
      });
    }
    var inline = document.querySelector('[data-snake-inline]');
    var inlineSnake = null;
    if (inline) { inlineSnake = new Snake(inline.querySelector('canvas'), inline.querySelector('[data-score]')); inlineSnake.activate(true); }
    var st = document.querySelector('[data-stitch]'), stitch = st ? new Stitch(st) : null;
    window.addEventListener('themechange', function () {
      refresh(); if (modal) modal.draw(); if (inlineSnake) inlineSnake.draw(); if (stitch) stitch.draw();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
