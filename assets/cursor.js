/* Pixel cursor: an exact accent square plus a trailing ring that moves in 4 px steps.
   Only for mouse and trackpad users; touch devices keep their normal behaviour. */
(function () {
  var fine = false; try { fine = matchMedia('(pointer: fine) and (hover: hover)').matches; } catch (e) {}
  if (!fine) return;
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var html = document.documentElement;
  var dot = document.createElement('div'), ring = document.createElement('div');
  dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
  ring.innerHTML = '<i></i><i></i><i></i><i></i>';
  dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring); document.body.appendChild(dot);
  html.classList.add('has-cursor');

  var x = -100, y = -100, rx = -100, ry = -100, raf = 0, shown = false, mode = '';
  var LINK = 'a, button, [role="button"], summary, label';
  var CROSS = 'canvas[data-hero], [data-portrait], .band canvas, .hoop canvas, .snake-canvas';

  function setMode(m) { if (m !== mode) { ring.setAttribute('data-mode', m); dot.setAttribute('data-mode', m); mode = m; } }
  function place() {
    raf = 0;
    var k = reduced ? 1 : 0.22; rx += (x - rx) * k; ry += (y - ry) * k;
    var sx = Math.round(rx / 4) * 4, sy = Math.round(ry / 4) * 4;
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    ring.style.transform = 'translate3d(' + sx + 'px,' + sy + 'px,0)';
    if (Math.abs(x - rx) > 0.5 || Math.abs(y - ry) > 0.5) raf = requestAnimationFrame(place);
  }
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!shown) { rx = x; ry = y; shown = true; html.classList.add('cursor-on'); }
    var t = e.target && e.target.closest ? e.target : null;
    var onFooter = t && t.closest('.footer');
    html.classList.toggle('cursor-footer', !!onFooter);
    var inGame = t && t.closest('.hero-art.playing');
    if (inGame) setMode('hide');
    else if (t && t.closest(CROSS)) setMode('cross');
    else if (t && t.closest(LINK)) setMode('link');
    else setMode('');
    if (!raf) raf = requestAnimationFrame(place);
  }, { passive: true });
  document.addEventListener('mouseleave', function () { html.classList.remove('cursor-on'); shown = false; });
  addEventListener('blur', function () { html.classList.remove('cursor-on'); shown = false; });
  addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    ring.classList.add('down');
    if (reduced || mode === 'hide') return;
    for (var i = 0; i < 6; i++) {
      var p = document.createElement('b'), a = i / 6 * Math.PI * 2 + Math.random() * 0.6, d = 14 + Math.random() * 12;
      p.className = 'cursor-bit'; p.setAttribute('aria-hidden', 'true');
      p.style.left = x + 'px'; p.style.top = y + 'px';
      p.style.setProperty('--dx', Math.round(Math.cos(a) * d / 2) * 2 + 'px');
      p.style.setProperty('--dy', Math.round(Math.sin(a) * d / 2) * 2 + 'px');
      document.body.appendChild(p); setTimeout(function (n) { return function () { n.remove(); }; }(p), 420);
    }
  });
  addEventListener('pointerup', function () { ring.classList.remove('down'); });
  // the snake dialog sits in the browser's top layer, above everything, so use the normal cursor there
  new MutationObserver(function () { html.classList.toggle('cursor-native', !!document.querySelector('dialog[open]')); })
    .observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
})();
