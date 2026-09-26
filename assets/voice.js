/* "Talk to my portfolio": a voice call with Abhishek's ElevenLabs agent.
   The SDK (600 KB) only loads when someone presses call. */
(function () {
  var root = document.querySelector('[data-voice]'); if (!root) return;
  var AGENT = root.getAttribute('data-agent'), EMAIL = root.getAttribute('data-email');
  var SDK = '/assets/vendor/elevenlabs-1.25.0.js';
  var C = window.themeColors();
  window.addEventListener('themechange', function () { C = window.themeColors(); if (state === 'idle' || state === 'error') drawIcon(performance.now()); });
  var reduced = false; try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var startBtn = root.querySelector('[data-voice-start]'), endBtn = root.querySelector('[data-voice-end]');
  var statusEl = root.querySelector('[data-voice-status]'), timeEl = root.querySelector('[data-voice-time]');
  var capEl = root.querySelector('[data-voice-caption]'), noteEl = root.querySelector('[data-voice-note]');
  var wave = root.querySelector('[data-voice-wave]'), orb = root.querySelector('[data-voice-orb]'), icon = root.querySelector('[data-voice-icon]');
  var AV = null;
  if (window.PORTRAIT_TONES) { var A = window.PORTRAIT_TONES.avatar, rr = atob(A.d), tt = new Float32Array(rr.length);
    for (var z = 0; z < rr.length; z++) tt[z] = rr.charCodeAt(z) / 255; AV = { w: A.w, h: A.h, t: tt }; }
  var convo = null, state = 'idle', mode = 'listening', t0 = 0, tick = 0, raf = 0, sdkP = null, cols = null;

  function setState(s) { state = s; root.setAttribute('data-state', s); }
  function note(msg) {
    noteEl.innerHTML = ''; if (!msg) { noteEl.hidden = true; return; }
    noteEl.hidden = false; noteEl.appendChild(document.createTextNode(msg + ' '));
    var a = document.createElement('a'); a.href = 'mailto:' + EMAIL; a.textContent = 'Email Abhishek'; noteEl.appendChild(a);
  }
  function fmt(s) { s = Math.max(0, Math.floor(s)); return String((s / 60) | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  function loadSDK() {
    if (window.ElevenLabsClient) return Promise.resolve(window.ElevenLabsClient);
    if (sdkP) return sdkP;
    sdkP = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = SDK; s.async = true;
      s.onload = function () { window.ElevenLabsClient ? res(window.ElevenLabsClient) : rej(new Error('sdk')); };
      s.onerror = function () { sdkP = null; rej(new Error('sdk')); };
      document.head.appendChild(s);
    });
    return sdkP;
  }
  function crisp(el) {
    var d = Math.min(2, devicePixelRatio || 1), w = el.clientWidth, h = el.clientHeight;
    el.width = w * d; el.height = h * d; var x = el.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return { x: x, w: w, h: h };
  }

  /* ---- idle icon: a tiny 5x5 dot orb that breathes ---- */
  function drawIcon(t) {
    var c = crisp(icon), x = c.x, n = 5, g = c.w / n; x.clearRect(0, 0, c.w, c.h);
    for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) {
      var dx = i - 2, dy = j - 2, d = Math.sqrt(dx * dx + dy * dy); if (d > 2.4) continue;
      var pulse = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(t / 420 - d * 1.3);
      x.fillStyle = getComputedStyle(startBtn).color; x.beginPath(); x.arc(i * g + g / 2, j * g + g / 2, g * (0.16 + 0.26 * pulse * (1 - d / 3)), 0, Math.PI * 2); x.fill();
    }
  }
  function idleLoop(t) { if (state !== 'idle' && state !== 'error') return; drawIcon(t); if (!reduced) requestAnimationFrame(idleLoop); }

  /* ---- live: orb avatar swells with the agent's voice, dot columns show both voices ---- */
  function live() {
    if (state !== 'live' && state !== 'connecting') return;
    var now = performance.now();
    var outV = 0, inV = 0, freq = null;
    if (convo) {
      try { outV = convo.getOutputVolume() || 0; inV = convo.getInputVolume() || 0; } catch (e) {}
      try { freq = mode === 'speaking' ? convo.getOutputByteFrequencyData() : convo.getInputByteFrequencyData(); } catch (e) { freq = null; }
    }
    // orb: Abhishek's halftone face; dots swell with whoever is talking
    var o = crisp(orb), ox = o.x, lv = Math.min(1, (mode === 'speaking' ? outV : inV) * 2.4);
    ox.fillStyle = C.field; ox.fillRect(0, 0, o.w, o.h);
    if (AV) {
      var g = o.w / AV.w;
      for (var j = 0; j < AV.h; j++) for (var i = 0; i < AV.w; i++) {
        var tv = AV.t[j * AV.w + i]; if (tv < 0.03) continue;
        var wob = state === 'connecting' ? 0.55 + 0.45 * Math.sin(now / 180 - (i + j) * 0.35) : 1;
        var boost = mode === 'speaking' ? 1 + lv * 0.45 * (0.6 + 0.4 * Math.sin(now / 70 + i * 0.9 + j * 0.7)) : 1;
        ox.fillStyle = C.mark; ox.beginPath(); ox.arc((i + 0.5) * g, (j + 0.5) * g, Math.min(g * 0.62, (0.12 + 0.88 * tv) * g * 0.5 * boost * wob), 0, Math.PI * 2); ox.fill();
      }
    }
    // wave: columns of stacked dots
    var w = crisp(wave), wx = w.x, colW = 6, nc = Math.floor(w.w / colW), rows = Math.floor(w.h / 5);
    if (!cols || cols.length !== nc) cols = new Float32Array(nc);
    wx.clearRect(0, 0, w.w, w.h);
    for (var k = 0; k < nc; k++) {
      var target;
      if (state === 'connecting') target = 0.12 + 0.12 * Math.sin(now / 160 + k * 0.5);
      else if (freq && freq.length) {
        var bin = Math.floor(Math.pow(k / nc, 1.6) * freq.length * 0.55);
        target = (freq[bin] || 0) / 255 * (mode === 'speaking' ? 1 : 0.8);
      } else target = (mode === 'speaking' ? outV : inV) * (0.6 + 0.4 * Math.sin(k * 1.7 + now / 90));
      target = Math.max(0.06, Math.min(1, target));
      cols[k] += (target - cols[k]) * 0.35;
      var hDots = Math.max(1, Math.round(cols[k] * rows)), cx = k * colW + colW / 2, mid = w.h / 2;
      wx.fillStyle = mode === 'speaking' ? C.accent : C.soft;
      for (var r = 0; r < hDots; r++) {
        var off = (r - (hDots - 1) / 2) * 5;
        wx.beginPath(); wx.arc(cx, mid + off, 1.6, 0, Math.PI * 2); wx.fill();
      }
    }
    if (state === 'live') timeEl.textContent = fmt((now - t0) / 1000);
    raf = requestAnimationFrame(live);
  }

  function friendly(msg) {
    msg = String(msg || '').toLowerCase();
    if (/quota|credit|limit|exceed/.test(msg)) return 'The voice agent is taking a break right now.';
    if (/origin|host|allow/.test(msg)) return "The voice agent isn't available on this address.";
    return "Couldn't connect to the voice agent.";
  }
  function fail(msg) {
    cancelAnimationFrame(raf); convo = null; setState('error'); note(msg);
    statusEl.textContent = ''; startBtn.focus({ preventScroll: true }); requestAnimationFrame(idleLoop);
  }

  async function start() {
    if (state === 'connecting' || state === 'live') return;
    note(null); capEl.textContent = ''; setState('connecting'); statusEl.textContent = 'Connecting'; timeEl.textContent = '00:00';
    raf = requestAnimationFrame(live);
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(function (t) { t.stop(); });
    } catch (e) {
      return fail('Your microphone is blocked. Allow it in your browser settings to talk, or');
    }
    var SDKmod;
    try { SDKmod = await loadSDK(); } catch (e) { return fail("Couldn't load the voice agent."); }
    try {
      convo = await SDKmod.Conversation.startSession({
        agentId: AGENT,
        onConnect: function () { dispatchEvent(new CustomEvent('achieve', { detail: 'voice' })); setState('live'); t0 = performance.now(); statusEl.textContent = 'Listening'; endBtn.focus({ preventScroll: true }); },
        onModeChange: function (m) { mode = m.mode; dispatchEvent(new CustomEvent('sprout:voice', { detail: m.mode })); if (state === 'live') statusEl.textContent = m.mode === 'speaking' ? 'Speaking' : 'Listening'; },
        onMessage: function (m) { if (m && (m.role === 'agent' || m.source === 'ai') && m.message) capEl.textContent = m.message; },
        onError: function (m) { console.warn('Voice agent:', m); if (state === 'connecting') fail(friendly(m)); },
        onDisconnect: function (d) {
          dispatchEvent(new CustomEvent('sprout:voice', { detail: 'idle' }));
          if (state === 'error') return;
          var dur = t0 ? fmt((performance.now() - t0) / 1000) : null;
          cancelAnimationFrame(raf); convo = null;
          if (d && d.reason === 'error') return fail(friendly(d.message));
          setState('ended'); statusEl.textContent = dur ? 'Call ended, ' + dur : 'Call ended';
          setTimeout(function () { if (state === 'ended') { setState('idle'); capEl.textContent = ''; requestAnimationFrame(idleLoop); startBtn.focus({ preventScroll: true }); } }, 2600);
        }
      });
    } catch (e) {
      console.warn('Voice agent:', e);
      fail(friendly(e && e.message));
    }
  }
  function end() { if (convo) { try { convo.endSession(); } catch (e) {} } else if (state === 'connecting') fail(null); }

  startBtn.addEventListener('click', start);
  endBtn.addEventListener('click', end);
  root.querySelector('[data-voice-dismiss]').addEventListener('click', function () { note(null); setState('idle'); requestAnimationFrame(idleLoop); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && (state === 'live' || state === 'connecting')) end(); });
  window.addEventListener('pagehide', function () { if (convo) try { convo.endSession(); } catch (e) {} });
  document.querySelectorAll('[data-voice-open]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); start(); }); });
  setState('idle'); requestAnimationFrame(idleLoop);
})();
