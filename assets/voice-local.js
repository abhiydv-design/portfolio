/* Offline voice assistant: used when the ElevenLabs agent can't connect (for example, out of credits).
   Listens with the browser's speech recognition, answers from a small knowledge base built from
   the portfolio, and speaks with the browser's own voice. No external service, no cost. */
(function () {
  function norm(s) { return ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' '; }
  function pickVoice(synth) {
    var vs = synth.getVoices() || [], score = function (v) {
      var n = (v.name + ' ' + v.lang).toLowerCase(), s = 0;
      if (/^en/.test(v.lang.toLowerCase())) s += 5; if (/en[-_]in/.test(v.lang.toLowerCase())) s += 4;
      if (/natural|neural|google|samantha|daniel|rishi|veena|microsoft/.test(n)) s += 3; if (v.localService) s += 1;
      return s; };
    return vs.slice().sort(function (a, b) { return score(b) - score(a); })[0] || null;
  }

  window.LocalVoice = { start: function (o) {
    var kb = { intents: [] }; try { kb = JSON.parse(document.getElementById('voice-kb').textContent); } catch (e) {}
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition, synth = window.speechSynthesis;
    var active = true, mode = 'listening', rec = null, stream = null, ac = null, an = null, buf = null, t0 = performance.now(), speakT = 0, voice = null, restarts = 0;
    var CAP = (kb.cap_seconds || 150) * 1000;

    // real input level from the microphone, for the waveform
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
      if (!active) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s; var K = window.AudioContext || window.webkitAudioContext; if (!K) return;
      ac = new K(); an = ac.createAnalyser(); an.fftSize = 256; buf = new Uint8Array(an.frequencyBinCount); ac.createMediaStreamSource(s).connect(an);
    }).catch(function () {});

    function setMode(m) { mode = m; if (o.onModeChange) o.onModeChange({ mode: m }); }
    function answerFor(q) {
      var n = norm(q), best = null, bestScore = 0;
      (kb.intents || []).forEach(function (it) {
        var s = 0; (it.keys || []).forEach(function (k) { k = k.toLowerCase();
          if (k.indexOf(' ') > -1) { if (n.indexOf(' ' + k + ' ') > -1 || n.indexOf(k) > -1) s += 2; }
          else if (n.indexOf(' ' + k) > -1) s += 1; });
        if (s > bestScore) { bestScore = s; best = it; }
      });
      return best || { answer: kb.fallback || "I can answer questions about Abhishek's work, projects and how to reach him." };
    }
    function speak(text, then) {
      if (!active) return;
      if (rec) try { rec.abort(); } catch (e) {}
      if (o.onMessage) o.onMessage({ role: 'agent', source: 'ai', message: text });
      setMode('speaking');
      var done = false, finish = function () { if (done) return; done = true; clearTimeout(speakT); if (!active) return; setMode('listening'); if (then) then(); else listen(); };
      if (!synth) { speakT = setTimeout(finish, 900 + text.length * 55); return; }
      try { synth.cancel(); } catch (e) {}
      var u = new SpeechSynthesisUtterance(text); voice = voice || pickVoice(synth); if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-IN';
      u.rate = 1.02; u.pitch = 1; u.onend = finish; u.onerror = finish;
      synth.speak(u);
      speakT = setTimeout(finish, 2500 + text.split(' ').length * 450);   // Chrome sometimes never fires onend
    }
    function listen() {
      if (!active) return;
      if (performance.now() - t0 > CAP) { speak(kb.cap || "That's our time. Thanks for chatting!", end); return; }
      if (!Rec) return;                       // no speech recognition here: the question buttons still work
      try {
        rec = new Rec(); rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;
        var got = false;
        rec.onresult = function (e) { got = true; restarts = 0; var q = e.results[0][0].transcript; if (o.onMessage) o.onMessage({ role: 'user', message: q }); reply(q); };
        rec.onerror = function () {};
        rec.onend = function () { if (!active || got || mode !== 'listening') return; if (++restarts < 12) setTimeout(listen, 250); };
        rec.start();
      } catch (e) {}
    }
    function reply(q) { var it = answerFor(q); speak(it.answer, it.end ? end : null); }
    function end() {
      if (!active) return; active = false; clearTimeout(speakT);
      if (rec) try { rec.abort(); } catch (e) {}
      try { synth && synth.cancel(); } catch (e) {}
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (ac) try { ac.close(); } catch (e) {}
      if (chips) chips.remove();
      if (o.onDisconnect) o.onDisconnect({ reason: 'user' });
    }

    // tappable questions, for browsers without speech recognition and for anyone who prefers tapping
    var chips = null;
    if (o.root && kb.suggestions) {
      chips = document.createElement('div'); chips.className = 'voice-chips'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Suggested questions');
      kb.suggestions.forEach(function (q) { var b = document.createElement('button'); b.type = 'button'; b.textContent = q;
        b.addEventListener('click', function () { if (!active) return; try { synth && synth.cancel(); } catch (e) {} if (o.onMessage) o.onMessage({ role: 'user', message: q }); reply(q); }); chips.appendChild(b); });
      o.root.insertBefore(chips, o.root.querySelector('.voice-bar'));
    }

    if (synth && synth.getVoices().length === 0 && 'onvoiceschanged' in synth) synth.onvoiceschanged = function () { voice = pickVoice(synth); };
    setTimeout(function () { if (!active) return; if (o.onConnect) o.onConnect(); speak(Rec ? kb.greeting : (kb.greeting_tap || kb.greeting)); }, 150);

    var tick = 0;
    return {
      local: true,
      getOutputVolume: function () { return mode === 'speaking' ? 0.32 + 0.18 * Math.abs(Math.sin(performance.now() / 110)) : 0; },
      getInputVolume: function () { if (!an) return 0.04; an.getByteFrequencyData(buf); var s = 0; for (var i = 0; i < buf.length; i++) s += buf[i]; return s / buf.length / 255 * 2.2; },
      getOutputByteFrequencyData: function () { var a = new Uint8Array(64), t = performance.now() / 90; if (mode === 'speaking') for (var i = 0; i < 64; i++) a[i] = Math.max(0, 170 - i * 2 + 70 * Math.sin(t + i * 0.7)); return a; },
      getInputByteFrequencyData: function () { if (!an) return new Uint8Array(64); an.getByteFrequencyData(buf); return buf; },
      endSession: end
    };
  } };
})();
