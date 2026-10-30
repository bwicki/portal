# Portal — Zugang zu allen Ballon-Apps

Einstiegsseite zu allen WebApps, die Balthasar Wicki für das Ballonfahren baut: nach
Fahrtphase gegliedert (Vorbereitung, Fahrt, Nachbereitung, Vorträge), mit Statusleuchte je
App, Versionsangabe, Favoriten, Suche und «Neu & geändert». Zweisprachig DE/EN, ohne Kennwort
(der Zugangsschutz bleibt in den einzelnen Apps).

**Live:** https://portal.wicki.aero · **Repository:** https://github.com/bwicki/portal
**Stack:** HTML/CSS/JS ohne Build-Schritt (GitHub Pages) + Cloudflare Worker `portal-api`
(Statusprüfung, ohne Datenbank) + GitHub Action (Versionen und Änderungen aus GitHub).

Stand: Version 0.1.0 (siehe CHANGELOG.md).

---

## Die Seite von oben nach unten

- **Kopf:** Logo Wicki Partners Ballonteam, Version (Klick → Versionshinweise), Umschalter DE/EN.
- **Suche:** filtert nach Name, Beschrieb, Subdomain und Repository; Taste `/` springt ins
  Suchfeld, `Enter` öffnet den ersten Treffer, `Esc` leert.
- **Statusleiste:** «13 von 13 Apps online», Zeit der Prüfung (LT), Knopf für eine neue Prüfung.
  Geprüft wird beim Öffnen und danach alle 5 Minuten, solange die Seite sichtbar ist.
- **Schnellzugriff:** Favoriten (Stern an der App) und zuletzt benutzte Apps. Wird je Gerät im
  Browser gespeichert, nicht auf einem Server.
- **Phasen-Karten:** je App Statusleuchte, Name, Beschrieb, Subdomain, Version und – nur bei
  Abweichung – «langsam 2.4 s» oder «nicht erreichbar». Rechts Stern (Favorit) und Link zum
  Quelltext auf GitHub. Apps öffnen in einem neuen Tab.
- **Neu & geändert:** die letzten Commits über alle App-Repositories.

### Statusleuchten

| Leuchte | Bedeutung |
|---|---|
| grün, gefüllt | erreichbar, Antwort unter 1.5 s |
| orange, gefüllt | erreichbar, aber langsam (ab 1.5 s; Schwelle in `js/config.js`) |
| roter Ring | nicht erreichbar oder Fehler (HTTP 400 und höher, Zeitüberschreitung 8 s) |
| grau | noch nicht geprüft / unbekannt |

Die Prüfung macht der Worker `portal-api` (60 s zwischengespeichert). Ist er nicht erreichbar,
prüft der Browser selbst – dann nur «erreichbar ja/nein», gekennzeichnet mit «(Browserprüfung)».

### Versionsangaben

Die Action «Update repos» liest stündlich je Repository: neuester Release → sonst neuester Tag →
sonst die erste Versionsnummer «x.y.z» in den letzten Commit-Meldungen → sonst «Stand» mit dem
Datum des letzten Push. Ergebnis in `data/repos.json`.

---

## Eine App hinzufügen oder ändern

Nur `apps.json` bearbeiten (auf GitHub: Datei öffnen → Stift → Commit):

```json
{ "id": "o2", "name": "O2", "phase": "prep", "repo": "bwicki/o2",
  "de": "Sauerstoffvorrat und Reichweite", "en": "Oxygen supply and endurance" }
```

- `id` = Subdomain (o2 → https://o2.wicki.aero). Abweichende Adresse: zusätzlich `"url": "https://…"`.
- `phase`: `prep` (Vorbereitung), `flight` (Fahrt), `post` (Nachbereitung), `talk` (Vorträge).
- `name_en` nur, wenn der englische Name anders lautet.
- Die Reihenfolge in der Datei ist die Reihenfolge auf der Seite.

Nach dem Commit deployt GitHub Pages die Seite, der Worker wird automatisch neu deployt
(neue App wird mitgeprüft), und «Update repos» holt die Version.

---

## Dateien

| Pfad | Inhalt |
|---|---|
| `index.html`, `css/`, `js/` | Seite (ohne Build-Schritt) |
| `js/config.js` | Version, Worker-Adresse, Schwelle «langsam», Prüfintervall |
| `apps.json` | Liste der Apps und Phasen |
| `data/repos.json` | von der Action erzeugt – nicht von Hand ändern |
| `worker/` | Cloudflare Worker `portal-api` |
| `scripts/update-repos.mjs` | erzeugt `data/repos.json` |
| `.github/workflows/` | «Deploy worker», «Update repos» |
| `manifest.webmanifest`, `sw.js`, `icons/` | installierbar als App (PWA) |

Einrichtung des Workers: **SETUP.md**.

---

Lizenz: alle Rechte vorbehalten, siehe `LICENSE`. © 2026 Balthasar Wicki, Wicki Aero GmbH.
