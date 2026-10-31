/* portal.wicki.aero – Aufrufzähler für die Apps.
   Einbinden in jeder App (im <head>):  <script src="https://portal.wicki.aero/hit.js" data-app="ID" defer></script>
   ID = id der App in apps.json. Meldet höchstens alle 10 Minuten je Browser einen Aufruf.
   Übermittelt wird nur die App-ID – keine Person, kein Gerät, keine Inhalte. Fehler werden still ignoriert. */
(function () {
  try {
    var s = document.currentScript, app = s && s.getAttribute('data-app');
    if (!app) return;
    var k = 'portal.hit.' + app, now = Date.now();
    try { if (now - (+localStorage.getItem(k) || 0) < 600000) return; localStorage.setItem(k, String(now)); } catch (e) { /* privat */ }
    var u = 'https://portal-api.balthasar.workers.dev/api/hit?app=' + encodeURIComponent(app);
    if (navigator.sendBeacon) navigator.sendBeacon(u);
    else fetch(u, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(function () {});
  } catch (e) { /* nie die App stören */ }
})();
