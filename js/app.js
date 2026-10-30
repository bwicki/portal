/* portal.wicki.aero – App-Logik (ohne Build-Schritt) */
(function () {
  'use strict';
  const C = window.PORTAL_CONFIG, T = window.PORTAL_I18N;
  const $ = (s, el) => (el || document).querySelector(s);
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('portal.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('portal.' + k, JSON.stringify(v)); } catch (e) { /* privat-Modus */ } }
  };

  let lang = LS.get('lang', 'de');
  if (!T[lang]) lang = 'de';
  let favs = LS.get('favs', []);
  let recent = LS.get('recent', []);
  let APPS = [], PHASES = [], REPOS = {}, STATUS = {}, statusTime = null, statusSource = '';
  let timer = null;

  const t = (k, vars) => {
    let s = (T[lang] && T[lang][k]) || T.de[k] || k;
    if (vars) Object.keys(vars).forEach(v => { s = s.split('{' + v + '}').join(vars[v]); });
    return s;
  };
  const el = (tag, attrs, kids) => {
    const n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      const v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v; // nur für statische SVG-Symbole
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(c => { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  };
  const hhmm = d => d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
  const ddmmyy = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' }); };
  const appUrl = a => a.url || ('https://' + a.id + '.' + C.domain + '/');
  const appName = a => (lang === 'en' && a.name_en) || a.name;
  const appDesc = a => a[lang] || a.de;

  const ICON_STAR = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>';
  const ICON_GH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12"/></svg>';

  /* ---------- Status ---------- */
  function stateOf(id) {
    const s = STATUS[id];
    if (!s) return statusTime ? 'unknown' : 'checking';
    if (!s.ok) return 'down';
    if (s.ms != null && s.ms >= C.slowMs) return 'slow';
    return 'ok';
  }
  const stateText = st => t({ ok: 'sOk', slow: 'sSlow', down: 'sDown', unknown: 'sUnknown', checking: 'sChecking' }[st]);

  async function checkViaWorker() {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(C.statusApi.replace(/\/$/, '') + '/api/status', { signal: ctl.signal, cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const out = {};
      (j.apps || []).forEach(a => { out[a.id] = { ok: !!a.ok, ms: a.ms, code: a.code }; });
      return { map: out, at: j.checked ? new Date(j.checked) : new Date(), src: 'worker' };
    } finally { clearTimeout(to); }
  }
  async function checkViaBrowser() {
    const out = {};
    await Promise.all(APPS.map(async a => {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 10000);
      const t0 = performance.now();
      try {
        await fetch(appUrl(a) + '?portal=' + Date.now(), { mode: 'no-cors', cache: 'no-store', signal: ctl.signal });
        out[a.id] = { ok: true, ms: Math.round(performance.now() - t0) };
      } catch (e) { out[a.id] = { ok: false, ms: null }; }
      finally { clearTimeout(to); }
    }));
    return { map: out, at: new Date(), src: 'browser' };
  }
  async function checkStatus() {
    const btn = $('#refresh'); btn.classList.add('spin'); btn.disabled = true;
    let res = null;
    if (C.statusApi) { try { res = await checkViaWorker(); } catch (e) { res = null; } }
    if (!res) { try { res = await checkViaBrowser(); } catch (e) { res = null; } }
    if (res) { STATUS = res.map; statusTime = res.at; statusSource = res.src; }
    else { STATUS = {}; statusTime = new Date(); statusSource = 'none'; }
    btn.classList.remove('spin'); btn.disabled = false;
    paintStatus();
  }
  function paintStatus() {
    APPS.forEach(a => {
      const st = stateOf(a.id);
      document.querySelectorAll('[data-led="' + a.id + '"]').forEach(n => { n.className = 'led ' + st; n.title = stateText(st); });
      const s = document.querySelector('[data-state="' + a.id + '"]');
      if (s) {
        const ms = STATUS[a.id] && STATUS[a.id].ms;
        s.className = 'state ' + st;
        // «online» ist der Normalfall und wird nicht ausgeschrieben – nur Abweichungen
        s.textContent = (st === 'ok' || st === 'checking') ? '' : stateText(st) + (st === 'slow' && ms ? ' ' + (ms / 1000).toFixed(1) + ' s' : '');
      }
    });
    const n = APPS.length;
    const ok = APPS.filter(a => ['ok', 'slow'].includes(stateOf(a.id))).length;
    const slow = APPS.filter(a => stateOf(a.id) === 'slow').length;
    const led = $('#sumLed'), txt = $('#sumText'), tm = $('#sumTime');
    if (!statusTime) { led.className = 'led checking'; txt.textContent = t('checking'); tm.textContent = ''; return; }
    if (statusSource === 'none') { led.className = 'led'; txt.textContent = t('noCheck'); tm.textContent = ''; return; }
    if (ok < n) { led.className = 'led down'; txt.textContent = t('someDown', { ok, n }); }
    else if (slow) { led.className = 'led slow'; txt.textContent = t('slowOnly', { n, s: slow }); }
    else { led.className = 'led ok'; txt.textContent = t('allOk', { n }); }
    tm.textContent = t('checkedAt', { t: hhmm(statusTime) }) + (statusSource === 'browser' ? ' ' + t('browserCheck') : '');
  }

  /* ---------- Favoriten / zuletzt benutzt ---------- */
  function toggleFav(id) {
    favs = favs.includes(id) ? favs.filter(x => x !== id) : favs.concat(id);
    LS.set('favs', favs); render();
  }
  function used(id) {
    recent = [id].concat(recent.filter(x => x !== id)).slice(0, 6);
    LS.set('recent', recent);
  }

  /* ---------- Darstellung ---------- */
  function verText(a) {
    const r = REPOS[a.repo];
    if (!r) return '';
    if (r.version) return 'v' + String(r.version).replace(/^v/i, '');
    if (r.pushed) return t('stand') + ' ' + ddmmyy(r.pushed);
    return '';
  }
  function appRow(a) {
    const isFav = favs.includes(a.id);
    const host = appUrl(a).replace(/^https?:\/\//, '').replace(/\/$/, '');
    const link = el('a', { class: 'app-link', href: appUrl(a), target: '_blank', rel: 'noopener', onclick: () => used(a.id) }, [
      el('span', { class: 'app-row1' }, [
        el('span', { class: 'led', 'data-led': a.id, 'aria-hidden': 'true' }),
        el('span', { class: 'app-name', text: appName(a) })
      ]),
      el('span', { class: 'app-desc', text: appDesc(a) }),
      el('span', { class: 'app-meta' }, [
        el('span', { class: 'host', text: host }),
        verText(a) ? el('span', { text: verText(a) }) : null,
        el('span', { class: 'state', 'data-state': a.id })
      ])
    ]);
    const tools = el('div', { class: 'app-tools' }, [
      el('button', { type: 'button', class: 'star-btn', 'aria-pressed': isFav ? 'true' : 'false',
        'aria-label': t(isFav ? 'favDel' : 'favAdd', { a: appName(a) }), html: ICON_STAR, onclick: () => toggleFav(a.id) }),
      a.repo ? el('a', { class: 'gh', href: 'https://github.com/' + a.repo, target: '_blank', rel: 'noopener',
        'aria-label': t('repo', { a: appName(a) }), title: a.repo, html: ICON_GH }) : null
    ]);
    return el('li', { class: 'app', 'data-id': a.id }, [link, tools]);
  }
  function render() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(n => { n.placeholder = t(n.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-aria]').forEach(n => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
    $('#ver').title = t('verTitle');

    const box = $('#phases'); box.textContent = '';
    PHASES.forEach((p, i) => {
      const apps = APPS.filter(a => a.phase === p.id);
      if (!apps.length) return;
      box.appendChild(el('section', { class: 'card phase', 'data-phase': p.id }, [
        el('div', { class: 'phase-h' }, [
          el('span', { class: 'no', 'aria-hidden': 'true', text: String(i + 1) }),
          el('div', null, [el('h2', { text: p[lang] || p.de }), el('div', { class: 'sub', text: p['sub_' + lang] || p.sub_de })])
        ]),
        el('ul', { class: 'apps' }, apps.map(appRow))
      ]));
    });

    const quickIds = favs.concat(recent.filter(x => !favs.includes(x))).filter(id => APPS.some(a => a.id === id)).slice(0, 8);
    const chips = $('#chips'); chips.textContent = '';
    quickIds.forEach(id => {
      const a = APPS.find(x => x.id === id);
      chips.appendChild(el('a', { class: 'chip', href: appUrl(a), target: '_blank', rel: 'noopener', onclick: () => used(a.id) }, [
        el('span', { class: 'led', 'data-led': a.id, 'aria-hidden': 'true' }),
        appName(a),
        favs.includes(id) ? el('span', { class: 'star', 'aria-hidden': 'true', text: '★' }) : null
      ]));
    });
    $('#quick').hidden = !quickIds.length;

    renderNews();
    filter();
    paintStatus();
  }
  function renderNews() {
    const list = $('#news'); list.textContent = '';
    const items = [];
    APPS.forEach(a => {
      const r = REPOS[a.repo];
      (r && r.commits || []).forEach(c => items.push({ a, date: c.date, msg: c.msg }));
    });
    items.sort((x, y) => (y.date || '').localeCompare(x.date || ''));
    const top = items.slice(0, C.newsCount);
    if (!top.length) { list.appendChild(el('li', { class: 'dim', text: t('newsNone') })); return; }
    top.forEach(i => list.appendChild(el('li', null, [
      el('span', { class: 'd', text: ddmmyy(i.date) }),
      el('span', { class: 'm' }, [el('b', { text: appName(i.a) }), ' – ', i.msg])
    ])));
  }

  /* ---------- Suche ---------- */
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function filter() {
    const q = norm($('#q').value.trim());
    let any = 0;
    document.querySelectorAll('.phase').forEach(sec => {
      let vis = 0;
      sec.querySelectorAll('.app').forEach(li => {
        const a = APPS.find(x => x.id === li.dataset.id);
        const hay = norm([a.id, a.name, a.name_en, a.de, a.en, a.repo].join(' '));
        const show = !q || hay.includes(q);
        li.hidden = !show; if (show) vis++;
      });
      sec.hidden = !vis; any += vis;
    });
    $('#empty').hidden = !!any;
    $('#quick').hidden = !!q || !$('#chips').children.length;
  }

  /* ---------- Start ---------- */
  async function loadJson(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(url + ' HTTP ' + r.status);
    return r.json();
  }
  async function init() {
    $('#q').addEventListener('input', filter);
    $('#q').addEventListener('keydown', e => {
      if (e.key === 'Enter') { const f = document.querySelector('.app:not([hidden]) .app-link'); if (f) f.click(); }
      if (e.key === 'Escape') { e.target.value = ''; filter(); }
    });
    document.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && !['input', 'textarea', 'select'].includes(tag) && !e.metaKey && !e.ctrlKey) { e.preventDefault(); $('#q').focus(); }
    });
    document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; LS.set('lang', lang); render(); }));
    $('#refresh').addEventListener('click', checkStatus);
    $('#ver').addEventListener('click', () => window.open('https://github.com/bwicki/portal/blob/main/CHANGELOG.md', '_blank', 'noopener'));
    $('#ver').textContent = 'v' + C.version; $('#footVer').textContent = 'v' + C.version;

    try { const j = await loadJson('apps.json'); APPS = j.apps || []; PHASES = j.phases || []; }
    catch (e) { $('#phases').textContent = 'apps.json konnte nicht geladen werden.'; return; }
    render();
    checkStatus();
    timer = setInterval(() => { if (!document.hidden) checkStatus(); }, C.refreshMin * 60000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && statusTime && Date.now() - statusTime.getTime() > C.refreshMin * 60000) checkStatus();
    });
    try { const r = await loadJson('data/repos.json'); REPOS = r.repos || {}; } catch (e) { REPOS = {}; }
    render();

    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  init();
})();
