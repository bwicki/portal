// Erzeugt data/repos.json aus GitHub: Version, Stand (Datum der letzten Änderung) und letzte Commits je App.
// Läuft in GitHub Actions (Workflow «Update repos»), braucht nur das eingebaute GITHUB_TOKEN.
// Version: aus der in apps.json genannten Datei (version_file, optional version_re),
//          sonst neuester Release, sonst neuester Tag, sonst erste Versionsnummer in den Commit-Meldungen.
import { readFile, writeFile } from 'node:fs/promises';

const token = process.env.GITHUB_TOKEN || '';
const H = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'portal.wicki.aero', ...(token ? { Authorization: 'Bearer ' + token } : {}) };
const gh = async (path) => {
  const r = await fetch('https://api.github.com' + path, { headers: H });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
  return r.json();
};
const raw = async (repo, branch, file) => {
  const r = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`, { headers: { 'User-Agent': 'portal.wicki.aero' } });
  return r.ok ? r.text() : null;
};
const GEN = /(?:APP_VERSION|\bVERSION|\bversion)\s*[:=]\s*['"`][a-z\-]*v?(\d[\w.\-]*)/i;
const MSG = /\bv?(\d+\.\d+\.\d+[a-z0-9.-]*)\b/i;
const firstLine = s => (s || '').split('\n')[0].trim().slice(0, 140);
const skip = /^(Merge |Status |Deploy-Status|Setup worker|data:|Update repos|Diagnose)/i;

const { apps } = JSON.parse(await readFile('apps.json', 'utf8'));
let old = {};
try { old = JSON.parse(await readFile('data/repos.json', 'utf8')).repos || {}; } catch { /* erster Lauf */ }

const out = {};
for (const a of apps) {
  const repo = a.repo;
  if (!repo || out[repo]) continue;
  try {
    const info = await gh('/repos/' + repo);
    if (!info) { console.warn('nicht gefunden (privat oder umbenannt?):', repo); if (old[repo]) out[repo] = old[repo]; continue; }
    const commits = (await gh('/repos/' + repo + '/commits?per_page=20')) || [];
    const real = commits.filter(c => !skip.test(c.commit.message));
    let version = null, source = null;
    if (a.version_file) {
      const txt = await raw(repo, info.default_branch, a.version_file);
      const m = txt && (a.version_re ? new RegExp(a.version_re, 'i') : GEN).exec(txt);
      if (m) { version = m[1]; source = a.version_file; }
    }
    if (!version) { const rel = await gh('/repos/' + repo + '/releases/latest'); if (rel && rel.tag_name) { version = rel.tag_name; source = 'release'; } }
    if (!version) { const tags = await gh('/repos/' + repo + '/tags?per_page=1'); if (tags && tags[0]) { version = tags[0].name; source = 'tag'; } }
    if (!version) { for (const c of real) { const m = MSG.exec(firstLine(c.commit.message)); if (m) { version = m[1]; source = 'commit'; break; } } }
    out[repo] = {
      version: version ? String(version).replace(/^v/i, '') : null,
      version_source: source,
      updated: real[0] ? real[0].commit.committer.date : info.pushed_at,   // «Stand»: letzte inhaltliche Änderung
      pushed: info.pushed_at,
      commits: real.slice(0, 5).map(c => ({ date: c.commit.committer.date, msg: firstLine(c.commit.message) }))
    };
    console.log(repo.padEnd(28), String(out[repo].version || '-').padEnd(16), (source || '').padEnd(22), out[repo].updated);
  } catch (e) {
    console.warn(repo, e.message);
    if (old[repo]) out[repo] = old[repo];   // bei Fehler alten Stand behalten
  }
}
if (JSON.stringify(out) === JSON.stringify(old)) { console.log('keine Änderung'); process.exit(0); }
await writeFile('data/repos.json', JSON.stringify({ generated: new Date().toISOString(), repos: out }, null, 1) + '\n');
console.log('data/repos.json geschrieben');
