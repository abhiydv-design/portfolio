// Saves the text of voice conversations (no audio, no IP) and shows them to the site owner.
// POST: the site sends a finished conversation. GET ?key=...: the owner reads recent conversations.
// Needs the Upstash database (already connected) and VOICE_ADMIN_KEY in Vercel for reading.
const crypto = require('crypto');
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN = process.env.VOICE_ADMIN_KEY;
const KEEP = 1000;

async function redis(cmd) {
  const r = await fetch(KV_URL, { method: 'POST', headers: { Authorization: `Bearer ${KV_TOKEN}` }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}
function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((res) => { let d = ''; req.on('data', c => { d += c; if (d.length > 60000) req.destroy(); }); req.on('end', () => { try { res(JSON.parse(d || '{}')); } catch (e) { res({}); } }); });
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!KV_URL || !KV_TOKEN) return res.status(503).json({ error: 'database not set up' });

  if (req.method === 'POST') {
    const origin = String(req.headers.origin || req.headers.referer || ''), host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
    if (origin && host && !origin.includes(host)) return res.status(403).json({ error: 'forbidden' });
    const b = await readBody(req);
    const turns = (Array.isArray(b.turns) ? b.turns : []).slice(0, 40)
      .map(t => ({ r: t.r === 'visitor' ? 'visitor' : 'assistant', x: String(t.x || '').slice(0, 600) })).filter(t => t.x.trim());
    if (!turns.some(t => t.r === 'visitor')) return res.status(204).end();   // nothing asked, nothing saved
    try {   // a light daily limit per visitor; the address is hashed for counting and never stored
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
      const k = 'voicelog:day:' + crypto.createHash('sha256').update('log:' + ip).digest('hex').slice(0, 24);
      const n = await redis(['INCR', k]); if (n === 1) await redis(['EXPIRE', k, '86400']);
      if (n > 40) return res.status(429).json({ error: 'limit' });
    } catch (e) {}
    const entry = { id: crypto.randomBytes(6).toString('hex'), at: new Date().toISOString(), mode: String(b.mode || '').slice(0, 20),
      seconds: Math.max(0, Math.min(600, Math.round(Number(b.seconds) || 0))), page: String(b.page || '').slice(0, 80), turns };
    await redis(['LPUSH', 'voice:log', JSON.stringify(entry)]);
    await redis(['LTRIM', 'voice:log', '0', String(KEEP - 1)]);
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    if (!ADMIN) return res.status(503).send('Set VOICE_ADMIN_KEY in Vercel to read conversations.');
    const given = String((req.query && req.query.key) || '');
    const ok = given.length === ADMIN.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(ADMIN));
    if (!ok) return res.status(401).send('Not authorised.');
    const rows = (await redis(['LRANGE', 'voice:log', '0', '299'])) || [];
    const items = rows.map(r => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean);
    const asked = {}; items.forEach(it => it.turns.filter(t => t.r === 'visitor').forEach(t => { const q = t.x.toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]+/g, ' ').trim(); if (q) asked[q] = (asked[q] || 0) + 1; }));
    const top = Object.entries(asked).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const fmt = iso => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
    const cards = items.map(it => `<article><header><b>${esc(fmt(it.at))}</b><span>${esc(it.mode || 'voice')} &middot; ${it.seconds}s &middot; ${esc(it.page || '/')}</span></header>${
      it.turns.map(t => `<p class="${t.r}"><em>${t.r === 'visitor' ? 'Visitor' : 'Assistant'}</em>${esc(t.x)}</p>`).join('')}</article>`).join('');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Voice conversations</title>
<style>body{margin:0;background:#1B1621;color:#F4EFF4;font:15px/1.55 ui-sans-serif,system-ui,sans-serif;padding:32px clamp(16px,5vw,64px)}h1{font:400 40px Georgia,serif;margin:0 0 6px}h2{font:500 12px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#B4A9B8;margin:36px 0 12px}
.meta{color:#B4A9B8;font:12px ui-monospace,monospace}ol{padding-left:20px}ol li{margin:4px 0}article{border:1px solid rgba(244,239,244,.16);padding:16px 18px;margin:0 0 14px;max-width:820px}
header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px}header span{color:#B4A9B8;font:12px ui-monospace,monospace}p{margin:6px 0}em{display:inline-block;min-width:88px;font:500 11px ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:#B4A9B8;font-style:normal}p.visitor{color:#EAA5DD}</style></head>
<body><h1>Voice conversations</h1><p class="meta">${items.length} most recent of up to ${KEEP} kept. Text only, no audio, no IP addresses. Times in IST.</p>
<h2>Most asked</h2><ol>${top.map(([q, n]) => `<li>${esc(q)} <span class="meta">&times;${n}</span></li>`).join('') || '<li class="meta">Nothing yet.</li>'}</ol>
<h2>Conversations</h2>${cards || '<p class="meta">No conversations yet.</p>'}</body></html>`);
  }
  res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'method not allowed' });
};
