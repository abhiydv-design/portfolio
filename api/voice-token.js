// Issues a short-lived, single-use Gemini Live token so the browser never sees the real API key.
// Needs GEMINI_API_KEY in Vercel. Optional: GEMINI_LIVE_MODEL to force a model.
const crypto = require('crypto');
const { GoogleGenAI } = require('@google/genai');
const CONTENT = require('../content.json');   // the assistant's prompt lives with the rest of the site's content
const PROMPT = (CONTENT.voice_kb && CONTENT.voice_kb.system_prompt) || '';

const KEY = process.env.GEMINI_API_KEY;
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const DAILY_LIMIT = 12;           // calls per visitor per day
let cachedModel = null;

async function redis(cmd) {
  const r = await fetch(KV_URL, { method: 'POST', headers: { Authorization: `Bearer ${KV_TOKEN}` }, body: JSON.stringify(cmd) });
  return (await r.json()).result;
}

// Ask Google which models this key can use for live voice, and prefer native-audio ones.
async function pickModel() {
  if (process.env.GEMINI_LIVE_MODEL) return process.env.GEMINI_LIVE_MODEL;
  if (cachedModel) return cachedModel;
  if (KV_URL && KV_TOKEN) { try { const m = await redis(['GET', 'voice:model']); if (m) return (cachedModel = m); } catch (e) {} }
  let names = [], page = '';
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200${page ? '&pageToken=' + page : ''}`, { headers: { 'x-goog-api-key': KEY } });
    if (!r.ok) break;
    const j = await r.json();
    (j.models || []).forEach(m => { if ((m.supportedGenerationMethods || []).includes('bidiGenerateContent')) names.push(m.name.replace(/^models\//, '')); });
    if (!j.nextPageToken) break; page = j.nextPageToken;
  }
  const score = n => (/native-audio/.test(n) ? 100 : 0) + (/live/.test(n) ? 40 : 0) + (/flash/.test(n) ? 10 : 0) - (/preview/.test(n) ? 1 : 0) - (/thinking|exp/.test(n) ? 5 : 0);
  names.sort((a, b) => score(b) - score(a) || b.localeCompare(a));
  cachedModel = names[0] || null;
  if (cachedModel && KV_URL && KV_TOKEN) { try { await redis(['SET', 'voice:model', cachedModel, 'EX', '86400']); } catch (e) {} }
  return cachedModel;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {            // warm-up ping: wakes the function and caches the model, issues nothing
    if (KEY) { try { await pickModel(); } catch (e) {} }
    return res.status(204).end();
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'method not allowed' }); }
  if (!KEY) return res.status(503).json({ error: 'gemini not set up' });

  // only pages on this site may ask for tokens
  const origin = String(req.headers.origin || req.headers.referer || '');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  if (origin && host && !origin.includes(host)) return res.status(403).json({ error: 'forbidden' });

  // a small daily limit per visitor, so nobody can burn through the free quota
  if (KV_URL && KV_TOKEN) {
    try {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
      const id = crypto.createHash('sha256').update('voice:' + ip).digest('hex').slice(0, 24);
      const n = await redis(['INCR', 'voice:day:' + id]);
      if (n === 1) await redis(['EXPIRE', 'voice:day:' + id, '86400']);
      if (n > DAILY_LIMIT) return res.status(429).json({ error: 'daily limit reached' });
    } catch (e) { /* if the counter is down, still allow the call */ }
  }

  try {
    const model = await pickModel();
    if (!model) return res.status(503).json({ error: 'no live model available for this key' });
    const ai = new GoogleGenAI({ apiKey: KEY, httpOptions: { apiVersion: 'v1alpha' } });
    const now = Date.now();
    const token = await ai.authTokens.create({ config: {
      uses: 1,
      expireTime: new Date(now + 5 * 60 * 1000).toISOString(),          // the call itself can run a few minutes
      newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),     // but it must start within a minute
      // Locking a token applies to every field, so the whole assistant setup is fixed here, on the server.
      // Browsers can't change the prompt, and the prompt always arrives.
      liveConnectConstraints: { model, config: {
        responseModalities: ['AUDIO'],
        systemInstruction: PROMPT,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: { automaticActivityDetection: {
          startOfSpeechSensitivity: 'START_SENSITIVITY_LOW', endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
          prefixPaddingMs: 120, silenceDurationMs: 450 } }
      } },
      lockAdditionalFields: [],
      httpOptions: { apiVersion: 'v1alpha' }
    } });
    return res.status(200).json({ token: token.name, model });
  } catch (e) {
    return res.status(502).json({ error: 'could not create a voice session', detail: String(e && e.message || e).slice(0, 200) });
  }
};
