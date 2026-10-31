/* portal.wicki.aero – Konfiguration */
window.PORTAL_CONFIG = {
  version: '0.2.0',
  // Status-Worker (Cloudflare). Leer lassen = Status direkt aus dem Browser prüfen (nur erreichbar ja/nein).
  statusApi: 'https://portal-api.balthasar.workers.dev',
  domain: 'wicki.aero',
  slowMs: 1500,          // ab dieser Antwortzeit gilt eine App als «langsam»
  refreshMin: 5,         // Status automatisch neu prüfen (Minuten), solange die Seite offen ist
  newsCount: 8           // Einträge in «Neu & geändert»
};
