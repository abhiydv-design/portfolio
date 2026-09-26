// Shared pixel garden: counts flowers planted by visitors whose Sprout bloomed.
// Needs an Upstash Redis database connected to this Vercel project (free tier is plenty).
// Vercel adds KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL / _TOKEN) automatically.
const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'garden not set up' });
  try {
    if (req.method === 'POST') {
      // one flower per visitor per day; the IP is hashed, never stored as-is
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
      const id = crypto.createHash('sha256').update('sprout:' + ip).digest('hex').slice(0, 24);
      const fresh = await redis(['SET', 'garden:seen:' + id, '1', 'NX', 'EX', '86400']);
      const count = fresh === 'OK' ? await redis(['INCR', 'garden:count']) : Number(await redis(['GET', 'garden:count']) || 0);
      return res.status(200).json({ count: Number(count) });
    }
    if (req.method === 'GET') return res.status(200).json({ count: Number(await redis(['GET', 'garden:count']) || 0) });
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'garden unavailable' });
  }
};
