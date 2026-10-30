// portal-api – prüft, ob die Apps unter *.wicki.aero erreichbar sind, und wie schnell.
// GET /api/status  → { checked, apps: [{ id, ok, code, ms }] }   (60 s zwischengespeichert)
// GET /api/health  → { ok: true, version }
// Keine Datenbank, keine Secrets. Die App-Liste kommt beim Deploy aus ../../apps.json.
import list from '../../apps.json';

const CACHE_S = 60;
const TIMEOUT_MS = 8000;

function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
const json = (obj, req, env, extra) => new Response(JSON.stringify(obj), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(req, env), ...(extra || {}) }
});

async function probe(app, domain) {
  const url = app.url || `https://${app.id}.${domain}/`;
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'portal.wicki.aero status check' }, cf: { cacheTtl: 0 } });
    const ms = Date.now() - t0;
    try { await r.body?.cancel(); } catch (e) { /* egal */ }
    return { id: app.id, ok: r.status < 400, code: r.status, ms };
  } catch (e) {
    return { id: app.id, ok: false, code: 0, ms: null, error: e.name === 'AbortError' ? 'timeout' : 'network' };
  } finally { clearTimeout(to); }
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req, env) });
    if (url.pathname === '/api/health') return json({ ok: true, version: env.APP_VERSION || '' }, req, env);
    if (url.pathname !== '/api/status') {
      return new Response('{"error":"not found"}', { status: 404, headers: { 'Content-Type': 'application/json', ...cors(req, env) } });
    }

    const cache = caches.default;
    const key = new Request(url.origin + '/api/status');
    const hit = await cache.match(key);
    if (hit) {
      const body = await hit.text();
      return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Cache': 'HIT', ...cors(req, env) } });
    }
    const domain = env.DOMAIN || 'wicki.aero';
    const apps = await Promise.all((list.apps || []).map(a => probe(a, domain)));
    const body = JSON.stringify({ checked: new Date().toISOString(), apps });
    ctx.waitUntil(cache.put(key, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${CACHE_S}` } })));
    return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Cache': 'MISS', ...cors(req, env) } });
  }
};
