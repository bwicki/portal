// portal-api – Statusprüfung der Apps und Nutzungszähler.
// GET  /api/status       → { checked, apps: [{ id, ok, code, ms }] }   (60 s zwischengespeichert)
// POST /api/hit?app=ID   ← jede App meldet ihren Aufruf (Skript https://portal.wicki.aero/hit.js)
// GET  /api/usage        → { apps: { ID: { last, count } } }
// GET  /api/health       → { ok: true, version }
// Gespeichert wird je App nur «zuletzt benutzt» (Zeitpunkt) und die Anzahl Aufrufe – keine Personen-,
// Geräte- oder IP-Daten. Speicher: ein Durable Object (SQLite), keine Secrets, keine weitere Einrichtung.
import list from '../../apps.json';

const CACHE_S = 60;
const TIMEOUT_MS = 8000;
const IDS = new Set((list.apps || []).map(a => a.id));

function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '86400' };
  if (allowed.includes(origin) || /^https:\/\/[a-z0-9-]+\.wicki\.aero$/.test(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
const json = (obj, req, env, status, extra) => new Response(JSON.stringify(obj), {
  status: status || 200,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(req, env), ...(extra || {}) }
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

// Nutzungszähler: ein einziges Objekt «global», je App eine Zeile.
export class Usage {
  constructor(state) {
    this.sql = state.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS usage (app TEXT PRIMARY KEY, last TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0)');
  }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/hit') {
      const app = url.searchParams.get('app');
      this.sql.exec('INSERT INTO usage (app, last, count) VALUES (?, ?, 1) ON CONFLICT(app) DO UPDATE SET last = excluded.last, count = count + 1', app, new Date().toISOString());
      return new Response('ok');
    }
    const apps = {};
    for (const r of this.sql.exec('SELECT app, last, count FROM usage')) apps[r.app] = { last: r.last, count: r.count };
    return Response.json({ apps });
  }
}
const usage = env => env.USAGE.get(env.USAGE.idFromName('global'));

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req, env) });
    if (url.pathname === '/api/health') return json({ ok: true, version: env.APP_VERSION || '' }, req, env);

    if (url.pathname === '/api/hit') {
      const app = url.searchParams.get('app') || '';
      if (!IDS.has(app)) return json({ error: 'unknown app' }, req, env, 400);
      ctx.waitUntil(usage(env).fetch('https://usage/hit?app=' + encodeURIComponent(app)));
      return new Response(null, { status: 204, headers: cors(req, env) });
    }
    if (url.pathname === '/api/usage') {
      const r = await usage(env).fetch('https://usage/list');
      return json(await r.json(), req, env);
    }
    if (url.pathname !== '/api/status') return json({ error: 'not found' }, req, env, 404);

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
