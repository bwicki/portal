// Erzeugt data/repos.json aus GitHub: letzter Push, Version, letzte Commits je App-Repository.
// Läuft in GitHub Actions (Workflow «Update repos»), braucht nur das eingebaute GITHUB_TOKEN.
// Version: neuester Release, sonst neuester Tag, sonst erste «x.y.z» in den letzten Commit-Meldungen.
import { readFile, writeFile } from 'node:fs/promises';

const token = process.env.GITHUB_TOKEN || '';
const H = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'portal.wicki.aero', ...(token ? { Authorization: 'Bearer ' + token } : {}) };
const gh = async (path) => {
  const r = await fetch('https://api.github.com' + path, { headers: H });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
  return r.json();
};
const verRe = /\bv?(\d+\.\d+\.\d+[a-z0-9.-]*)\b/i;
const firstLine = s => (s || '').split('\n')[0].trim().slice(0, 140);
const skip = /^(Merge |Status |Deploy-Status|Setup worker|data:|Update repos)/i;

const { apps } = JSON.parse(await readFile('apps.json', 'utf8'));
const repos = [...new Set(apps.map(a => a.repo).filter(Boolean))];
let old = {};
try { old = JSON.parse(await readFile('data/repos.json', 'utf8')).repos || {}; } catch { /* erster Lauf */ }

const out = {};
for (const repo of repos) {
  try {
    const info = await gh('/repos/' + repo);
    if (!info) { console.warn('nicht gefunden (privat oder umbenannt?):', repo); if (old[repo]) out[repo] = old[repo]; continue; }
    const commits = (await gh('/repos/' + repo + '/commits?per_page=15')) || [];
    const rel = await gh('/repos/' + repo + '/releases/latest');
    let version = (rel && rel.tag_name) || null;
    if (!version) { const tags = await gh('/repos/' + repo + '/tags?per_page=1'); version = (tags && tags[0] && tags[0].name) || null; }
    if (!version) {
      for (const c of commits) { const m = verRe.exec(firstLine(c.commit.message)); if (m) { version = m[1]; break; } }
    }
    const list = commits
      .filter(c => !skip.test(c.commit.message))
      .slice(0, 5)
      .map(c => ({ date: c.commit.committer.date, msg: firstLine(c.commit.message) }));
    out[repo] = { version: version ? String(version).replace(/^v/i, '') : null, pushed: info.pushed_at, commits: list };
    console.log(repo.padEnd(28), (version || '-').padEnd(12), info.pushed_at);
  } catch (e) {
    console.warn(repo, e.message);
    if (old[repo]) out[repo] = old[repo];   // bei Fehler alten Stand behalten
  }
}
if (JSON.stringify(out) === JSON.stringify(old)) { console.log('keine Änderung'); process.exit(0); }
await writeFile('data/repos.json', JSON.stringify({ generated: new Date().toISOString(), repos: out }, null, 1) + '\n');
console.log('data/repos.json geschrieben');
