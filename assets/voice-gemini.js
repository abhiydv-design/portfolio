/* Gemini Live voice: streams the microphone to Gemini and plays its voice back, with captions.
   Gets a single-use token from /api/voice-token, so the real API key never reaches the browser.
   Exposes the same small interface as the other voice modes, so the call bar works unchanged. */
(function () {
  var SDK = '/assets/vendor/genai-2.24.0.js', sdkP = null;
  function loadSDK() {
    if (window.GoogleGenAILib) return Promise.resolve(window.GoogleGenAILib);
    if (sdkP) return sdkP;
    sdkP = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = SDK; s.async = true;
      s.onload = function () { window.GoogleGenAILib ? res(window.GoogleGenAILib) : rej(new Error('sdk')); }; s.onerror = function () { sdkP = null; rej(new Error('sdk')); };
      document.head.appendChild(s); });
    return sdkP;
  }
  function b64FromInt16(i16) { var u8 = new Uint8Array(i16.buffer), s = '', CH = 0x8000; for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
  function int16FromB64(b64) { var bin = atob(b64), n = bin.length, u8 = new Uint8Array(n); for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i); return new Int16Array(u8.buffer, 0, n >> 1); }

  var warmed = false;
  function warm() {
    if (warmed) return; warmed = true;
    try { fetch('/api/voice-token', { method: 'GET', cache: 'no-store' }).catch(function () {}); } catch (e) {}
    loadSDK().catch(function () {});
  }
  // mic capture on the audio thread: downsample to 16 kHz and send ~40 ms blocks of 16-bit PCM
  var WORKLET = "class P extends AudioWorkletProcessor{constructor(){super();this.r=sampleRate/16000;this.b=new Int16Array(640);this.n=0;this.p=0}" +
    "process(i){var c=i[0]&&i[0][0];if(!c)return true;for(;this.p<c.length;this.p+=this.r){var v=Math.max(-1,Math.min(1,c[Math.floor(this.p)]));this.b[this.n++]=v<0?v*32768:v*32767;" +
    "if(this.n===this.b.length){this.port.postMessage(this.b.slice(0));this.n=0}}this.p-=c.length;return true}}registerProcessor('pcm16k',P);";

  window.GeminiVoice = { warm: warm, start: async function (o) {
    var kb = {}; try { kb = JSON.parse(document.getElementById('voice-kb').textContent); } catch (e) {}
    var r = await fetch('/api/voice-token', { method: 'POST' });
    if (!r.ok) { var why = ''; try { why = (await r.json()).error; } catch (e) {} throw new Error('gemini token: ' + r.status + ' ' + why); }
    var tk = await r.json(); console.info('Voice: gemini model ' + tk.model);
    var Lib = await loadSDK();
    var ai = new Lib.GoogleGenAI({ apiKey: tk.token, httpOptions: { apiVersion: 'v1alpha' } });

    var active = true, opened = false, mode = 'listening', caption = '', CAP = (kb.cap_seconds || 150) * 1000, t0 = 0, capT = 0;
    var shared = window.__voiceOutCtx, outCtx = shared || new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    try { outCtx.resume(); } catch (e) {}
    var outAn = outCtx.createAnalyser(); outAn.fftSize = 256;
    var outEl = null;
    try { var dest = outCtx.createMediaStreamDestination(); outAn.connect(dest); outEl = new Audio(); outEl.autoplay = true; outEl.srcObject = dest.stream; outEl.play().catch(function () {}); }
    catch (e) { outAn.connect(outCtx.destination); }
    var outBuf = new Uint8Array(outAn.frequencyBinCount), playHead = 0, sources = [];
    var mic = null, inCtx = null, inAn = null, inBuf = null, proc = null, session = null;

    function setMode(m) { if (m !== mode) { mode = m; if (o.onModeChange) o.onModeChange({ mode: m }); } }
    function stopPlayback() { sources.forEach(function (s) { try { s.stop(); } catch (e) {} }); sources = []; playHead = 0; }
    function play(b64) {
      var i16 = int16FromB64(b64), f32 = new Float32Array(i16.length);
      for (var i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
      var buf = outCtx.createBuffer(1, f32.length, 24000); buf.copyToChannel(f32, 0);
      var src = outCtx.createBufferSource(); src.buffer = buf; src.connect(outAn);
      var lead = sources.length ? 0.02 : 0.15;                 // a small buffer at the start of each reply smooths network jitter
      var at = Math.max(outCtx.currentTime + lead, playHead); src.start(at); playHead = at + buf.duration;
      sources.push(src); setMode('speaking');
      src.onended = function () { sources = sources.filter(function (x) { return x !== src; }); if (!sources.length && active) setMode('listening'); };
    }
    function end(reason) {
      if (!active) return; active = false; clearTimeout(capT);
      try { session && session.close(); } catch (e) {}
      try { proc && proc.disconnect(); } catch (e) {}
      if (mic) mic.getTracks().forEach(function (t) { t.stop(); });
      stopPlayback();
      try { inCtx && inCtx.close(); } catch (e) {} if (!shared) try { outCtx.close(); } catch (e) {}
      if (outEl) try { outEl.pause(); outEl.srcObject = null; } catch (e) {}
      document.documentElement.classList.remove('in-call');
      if (o.onDisconnect) o.onDisconnect({ reason: reason || 'user' });
    }

    var openedP = new Promise(function (resolve, reject) {
      ai.live.connect({
        model: tk.model,
        config: {
          responseModalities: [Lib.Modality.AUDIO],
          systemInstruction: kb.system_prompt || '',
          outputAudioTranscription: {},
          realtimeInputConfig: { automaticActivityDetection: {
            startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',   // background noise and echo shouldn't count as the visitor talking
            endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',      // but reply promptly once they stop
            prefixPaddingMs: 120, silenceDurationMs: 450 } }
        },
        callbacks: {
          onopen: function () {},
          onmessage: function (m) {
            if (m.setupComplete && !opened) { opened = true; resolve(); }
            var sc = m.serverContent; if (!sc) return;
            if (sc.interrupted) { stopPlayback(); caption = ''; setMode('listening'); }
            var parts = sc.modelTurn && sc.modelTurn.parts || [];
            parts.forEach(function (pt) { if (pt.inlineData && pt.inlineData.data) play(pt.inlineData.data); });
            if (sc.outputTranscription && sc.outputTranscription.text) { caption += sc.outputTranscription.text; if (o.onMessage) o.onMessage({ role: 'agent', source: 'ai', message: caption.trim() }); }
            if (sc.turnComplete) caption = '';
          },
          onerror: function (e) { if (!opened) reject(new Error('gemini socket error')); else console.warn('Gemini:', e); },
          onclose: function (e) { if (!opened) reject(new Error('gemini closed: ' + (e && (e.reason || e.code)))); else end('user'); }
        }
      }).then(function (s) { session = s; if (!opened) { opened = true; resolve(); } }).catch(reject);
    });
    var timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('gemini timeout')); }, 9000); });
    try { await Promise.race([openedP, timeout]); } catch (e) { active = false; try { session && session.close(); } catch (x) {} if (!shared) try { outCtx.close(); } catch (x) {} throw e; }
    // wait until the session object exists (connect resolves right after setup)
    for (var w = 0; !session && w < 40; w++) await new Promise(function (r2) { setTimeout(r2, 50); });

    // microphone -> 16 kHz 16-bit PCM -> Gemini
    mic = window.__voiceMic && window.__voiceMic.active ? window.__voiceMic : await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    window.__voiceMic = null;
    inCtx = new (window.AudioContext || window.webkitAudioContext)();
    var srcNode = inCtx.createMediaStreamSource(mic); inAn = inCtx.createAnalyser(); inAn.fftSize = 256; inBuf = new Uint8Array(inAn.frequencyBinCount); srcNode.connect(inAn);
    function sendPcm(i16) {
      if (!active || !session) return;
      if (mode === 'speaking') {                // while Gemini talks, only pass clear speech (lets the visitor interrupt, blocks echo)
        var sum = 0; for (var i = 0; i < i16.length; i += 4) sum += i16[i] * i16[i];
        if (Math.sqrt(sum / (i16.length / 4)) / 32768 < 0.06) return;
      }
      try { session.sendRealtimeInput({ audio: { data: b64FromInt16(i16), mimeType: 'audio/pcm;rate=16000' } }); } catch (e) {}
    }
    var usedWorklet = false;
    if (inCtx.audioWorklet && window.AudioWorkletNode) {
      try {
        var url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
        await inCtx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
        proc = new AudioWorkletNode(inCtx, 'pcm16k'); proc.port.onmessage = function (ev) { sendPcm(ev.data); };
        srcNode.connect(proc); usedWorklet = true;
      } catch (e) { usedWorklet = false; }
    }
    if (!usedWorklet) {                          // older browsers
      proc = inCtx.createScriptProcessor(4096, 1, 1); var ratio = inCtx.sampleRate / 16000;
      proc.onaudioprocess = function (ev) {
        var input = ev.inputBuffer.getChannelData(0), n = Math.floor(input.length / ratio), out = new Int16Array(n);
        for (var i = 0; i < n; i++) { var v = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)])); out[i] = v < 0 ? v * 0x8000 : v * 0x7fff; }
        sendPcm(out);
      };
      srcNode.connect(proc); var mute = inCtx.createGain(); mute.gain.value = 0; proc.connect(mute); mute.connect(inCtx.destination);
    }
    document.documentElement.classList.add('in-call');

    t0 = performance.now();
    if (o.onConnect) o.onConnect();
    try { session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: kb.gemini_kickoff || 'The visitor just started the call. Greet them warmly in one short sentence and invite a question.' }] }], turnComplete: true }); } catch (e) {}
    capT = setTimeout(function () { end('user'); }, CAP);

    return {
      gemini: true,
      getOutputVolume: function () { if (!outAn) return 0; outAn.getByteFrequencyData(outBuf); var s = 0; for (var i = 0; i < outBuf.length; i++) s += outBuf[i]; return mode === 'speaking' ? s / outBuf.length / 255 * 2.4 : 0; },
      getInputVolume: function () { if (!inAn) return 0; inAn.getByteFrequencyData(inBuf); var s = 0; for (var i = 0; i < inBuf.length; i++) s += inBuf[i]; return s / inBuf.length / 255 * 2.2; },
      getOutputByteFrequencyData: function () { if (outAn) outAn.getByteFrequencyData(outBuf); return outBuf; },
      getInputByteFrequencyData: function () { if (inAn) inAn.getByteFrequencyData(inBuf); return inBuf || new Uint8Array(64); },
      endSession: function () { end('user'); }
    };
  } };
})();
