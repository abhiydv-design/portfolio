/* Project reel: a muted loop floats in the corner of a case study; opening it plays the
   full walkthrough with sound, captions and keyboard controls. */
(function () {
  var root = document.querySelector('[data-reel]'); if (!root) return;
  var slug = root.getAttribute('data-slug'), src = root.getAttribute('data-src'), cc = root.getAttribute('data-captions'), poster = root.getAttribute('data-poster') || '';
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var mini = root.querySelector('video'), openBtn = root.querySelector('[data-reel-open]'), hideBtn = root.querySelector('[data-reel-hide]');
  var dlg = document.getElementById('reel-dialog'), v = dlg.querySelector('video');
  var playB = dlg.querySelector('[data-rp-play]'), muteB = dlg.querySelector('[data-rp-mute]'), ccB = dlg.querySelector('[data-rp-cc]');
  var bar = dlg.querySelector('[data-rp-bar]'), fill = dlg.querySelector('[data-rp-fill]'), timeEl = dlg.querySelector('[data-rp-time]');
  var hidden = false; try { hidden = sessionStorage.getItem('reel-hidden-' + slug) === '1'; } catch (e) {}
  if (hidden) root.hidden = true;

  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); }
  // mini player: muted loop while it's on screen
  mini.muted = true; mini.loop = true; mini.playsInline = true;
  if (!reduced) {
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting && !dlg.open) mini.play().catch(function () {}); else mini.pause(); });
    io.observe(mini);
  } else root.classList.add('still');

  function open() {
    mini.pause();
    if (!v.getAttribute('src')) { v.src = src; if (cc) { var tr = document.createElement('track'); tr.kind = 'captions'; tr.srclang = 'en'; tr.label = 'English'; tr.src = cc; tr.default = true; v.appendChild(tr); } }
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    v.currentTime = 0; v.muted = false; paint();
    v.play().catch(function () { paint(); });
    dispatchEvent(new CustomEvent('achieve', { detail: 'reel' }));
    playB.focus({ preventScroll: true });
  }
  function close() { v.pause(); if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', function () { v.pause(); if (!reduced) mini.play().catch(function () {}); openBtn.focus({ preventScroll: true }); });
  function toggle() { if (v.paused) v.play().catch(function () {}); else v.pause(); }
  function paint() {
    playB.setAttribute('aria-label', v.paused ? 'Play' : 'Pause'); playB.setAttribute('data-state', v.paused ? 'paused' : 'playing');
    muteB.setAttribute('aria-pressed', String(v.muted)); muteB.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute');
    var t = v.textTracks && v.textTracks[0]; if (ccB) { ccB.hidden = !t; if (t) ccB.setAttribute('aria-pressed', String(t.mode === 'showing')); }
  }
  function progress() {
    var d = v.duration || 0, p = d ? v.currentTime / d : 0;
    fill.style.width = (Math.round(p * 60) / 60 * 100) + '%';   // moves in 60 steps, like pixels
    bar.setAttribute('aria-valuenow', String(Math.round(p * 100))); bar.setAttribute('aria-valuetext', fmt(v.currentTime) + ' of ' + fmt(d));
    timeEl.textContent = fmt(v.currentTime) + ' / ' + fmt(d);
  }
  ['play', 'pause', 'volumechange', 'loadedmetadata'].forEach(function (ev) { v.addEventListener(ev, paint); });
  ['timeupdate', 'loadedmetadata'].forEach(function (ev) { v.addEventListener(ev, progress); });
  v.addEventListener('click', toggle);
  playB.addEventListener('click', toggle);
  muteB.addEventListener('click', function () { v.muted = !v.muted; });
  if (ccB) ccB.addEventListener('click', function () { var t = v.textTracks[0]; if (t) { t.mode = t.mode === 'showing' ? 'hidden' : 'showing'; paint(); } });
  function seekAt(clientX) { var r = bar.getBoundingClientRect(), p = Math.max(0, Math.min(1, (clientX - r.left) / r.width)); if (v.duration) v.currentTime = p * v.duration; }
  bar.addEventListener('pointerdown', function (e) { seekAt(e.clientX); bar.setPointerCapture(e.pointerId); });
  bar.addEventListener('pointermove', function (e) { if (e.buttons) seekAt(e.clientX); });
  bar.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { v.currentTime = Math.min(v.duration || 0, v.currentTime + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { v.currentTime = Math.max(0, v.currentTime - 5); e.preventDefault(); }
  });
  dlg.addEventListener('keydown', function (e) {
    if (e.target === bar) return;
    var k = e.key.toLowerCase();
    if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); }
    else if (k === 'm') { v.muted = !v.muted; }
    else if (k === 'c' && ccB) { ccB.click(); }
    else if (k === 'arrowright') { v.currentTime = Math.min(v.duration || 0, v.currentTime + 5); }
    else if (k === 'arrowleft') { v.currentTime = Math.max(0, v.currentTime - 5); }
  });
  dlg.querySelector('[data-rp-close]').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  openBtn.addEventListener('click', open);
  document.querySelectorAll('[data-reel-open-inline]').forEach(function (b) { b.addEventListener('click', open); });
  hideBtn.addEventListener('click', function () { mini.pause(); root.hidden = true; try { sessionStorage.setItem('reel-hidden-' + slug, '1'); } catch (e) {} });
})();
