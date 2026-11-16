---
title: "Zentrale Zugangsverwaltung über portal.wicki.aero"
subtitle: "Konzept v0.2 · 16.11.2026 · ZURÜCKGESTELLT – nicht umgesetzt"
author: "Balthasar Wicki · erarbeitet mit Claude"
lang: de-CH
---

# Status: zurückgestellt (16.11.2026)

Entscheid vom 16.11.2026: Das Vorhaben wird **nicht umgesetzt**. Zu viele Abläufe hängen an den
heutigen Anmeldungen der einzelnen Apps, und das Risiko, dass danach Dinge nicht mehr funktionieren,
ist zu gross. Die Apps behalten ihre eigenen Zugangsregeln; das Portal bleibt eine offene Linkseite.
Dieses Dokument dient nur als Unterlage, falls das Thema später wieder aufgenommen wird.

# 1 Ziel

Zugangsrechte an Dritte werden nur noch an einer Stelle vergeben: im Portal portal.wicki.aero.
Die Apps unter wicki.aero sind nur noch für angemeldete und berechtigte Personen erreichbar.
Wer nicht berechtigt ist, sieht die App nicht, auch wenn er die Adresse kennt.

Rahmen (Entscheide 16.11.2026):

- rund 10–15 Nutzerinnen und Nutzer, höchstens
- Weg A: Cloudflare Access vor allen Apps, das Portal verwaltet die Rechte
- die Domain wicki.aero zieht für die Adressverwaltung (DNS) zu Cloudflare um
- Dokumentsprache Deutsch

# 2 Geltungsbereich

| App | Adresse | Unter dem Portal | Bemerkung |
|---|---|---|---|
| Portal | portal.wicki.aero | ja | Anmeldung und Rechte-Zentrale |
| GaforCast | gafor.wicki.aero | ja | eigene Kennwortseite entfällt später |
| Stüve | stueve.wicki.aero | ja | |
| Cockpit | cockpit.wicki.aero | ja | |
| O2 | o2.wicki.aero | ja | geeignet als erste Test-App |
| Ops | ops.wicki.aero | ja | Leselinks für Externe: siehe 6.3 |
| Analyze | analyze.wicki.aero | ja | |
| KRT2 Memory Manager | krt2.wicki.aero | ja | **Ausnahme Frequenzblatt** (6.2) |
| S2 Planning, S2 Ground, S2 Stüve | s2planning/s2ground/s2stueve.wicki.aero | ja | |
| Gordon Bennett 2026 | gb26praesi.wicki.aero | ja | bei öffentlichem Vortrag: siehe 6.3 |
| Diashow | diashow.wicki.aero | ja | geteilte Diashows: siehe 6.3 |
| **Reporting** | reporting.wicki.aero | **nein** | bleibt wie heute; an der Anmeldung hängt zu viel |
| **SBA Checklisten** | checklists.wicki.aero | **nein** | geht an die Swiss Ballooning Academy, die den Zugang selbst regelt |

# 3 Warum es einen «Türsteher» braucht

Die Apps liegen heute als öffentliche Seiten auf GitHub Pages. Wer die Adresse kennt, lädt die
App direkt. Eine Anmeldung, die das Portal setzt und die jede App selbst im Browser prüft, wäre
nur Kosmetik: Die Prüfung steckt im öffentlich lesbaren JavaScript und lässt sich umgehen.

Echten Schutz gibt es nur, wenn **vor** der App ein Dienst jede Anfrage prüft, bevor eine Datei
ausgeliefert wird. Das leistet Cloudflare Access, sobald die Adressen von wicki.aero über
Cloudflare laufen.

Was damit **nicht** geschützt ist: der Quelltext. Die Repositories auf GitHub bleiben öffentlich.
Geschützt sind Nutzung und Daten. Wer den Code auch schützen will, muss die Apps von GitHub Pages
zu Cloudflare umziehen und die Repositories privat stellen (Ausbaustufe, Kapitel 9, Phase 6).

# 4 Zielbild

1. **DNS bei Cloudflare.** Die Adressverwaltung von wicki.aero wechselt von united-domains zu
   Cloudflare (Gratis-Plan). Die Domain selbst bleibt bei united-domains registriert, dort werden
   nur die Nameserver auf Cloudflare umgestellt. Alle Subdomains laufen danach über Cloudflare.
2. **Cloudflare Access vor jeder App.** Für jede App gibt es in Cloudflare eine
   «Access-Anwendung» mit einer Regel: Zugang hat, wer in der Gruppe dieser App steht.
3. **Anmeldung per Einmalcode.** Man gibt die E-Mail-Adresse ein und erhält einen Code
   («One-time PIN»). Keine Passwörter, nichts zu vergessen. Eine Anmeldung gilt für alle Apps
   (Single Sign-on über die gemeinsame Cloudflare-Anmeldeseite).
4. **Das Portal als Rechte-Zentrale.** Im Portal gibt es eine Verwaltungsseite (nur für den
   Supermaster). Dort trägst Du Personen mit E-Mail-Adresse ein und hakst die Apps an. Das
   Portal schreibt die Änderungen über die Cloudflare-Schnittstelle in die Gruppen. In der
   Cloudflare-Oberfläche muss man danach nichts mehr von Hand tun.
5. **Jede Person sieht im Portal nur ihre Apps.** Das Portal kennt die angemeldete Person (Cloudflare
   übergibt die E-Mail-Adresse) und blendet nicht freigegebene Apps aus.

# 5 Rechtemodell

| Element | Inhalt |
|---|---|
| Person | Name, E-Mail-Adresse, aktiv/gesperrt, Bemerkung |
| Recht | Person × App (angehakt = darf die App öffnen) |
| Supermaster | bwicki; darf alles und als Einziger Rechte vergeben |
| Protokoll | wer wann welches Recht erhalten oder verloren hat |

Ablauf «neue Person»: im Portal erfassen → Apps anhaken → Speichern. Das Portal schickt auf Wunsch
eine kurze Einladungs-E-Mail mit dem Link zum Portal. Die Person meldet sich beim ersten Aufruf mit
dem Einmalcode an.

Ablauf «Zugang entziehen»: Haken entfernen oder Person sperren. Wirkt bei der nächsten Prüfung,
spätestens nach Ablauf der Sitzung (Kapitel 7). Für sofortige Wirkung bietet Cloudflare
«Sitzung widerrufen» an, das baut das Portal als Knopf ein.

Die **eigenen Konten in den Apps** (Ops-Master, KRT2-Konten, Diashow) bleiben zunächst bestehen.
Erst in einem späteren Schritt übernehmen die Apps die geprüfte Identität von Cloudflare, und die
eigenen Logins fallen weg (Kapitel 9, Phase 5).

# 6 Ausnahmen

## 6.1 Ganz ausgenommen

- **reporting.wicki.aero** und **checklists.wicki.aero** erhalten keine Access-Anwendung und
  laufen weiter wie heute.

## 6.2 KRT2-Frequenzblatt ohne Anmeldung

Das Frequenzblatt muss in der Luft ohne Anmeldung aufrufbar sein. Heute ist es eine Ansicht
innerhalb derselben Seite (Adresse mit `#…`). Cloudflare kann nur ganze Pfade ausnehmen, nicht
Ansichten hinter dem `#`. Deshalb braucht das Frequenzblatt eine **eigene Adresse**, z. B.
`krt2.wicki.aero/blatt/`, für die eine «Bypass»-Regel gilt. Das erfordert eine kleine Änderung
in der KRT2-App.

## 6.3 Zu entscheiden

| Fall | Heute | Vorschlag |
|---|---|---|
| Ops-Leselinks an Externe ohne Konto (Materialeigner, Leselink «read only») | Link mit Token | Pfad der Leselinks ausnehmen; der Token im Link bleibt der Schutz |
| Diashow: geteilte Diashows mit eigenem Passwort je Link | `share.html` | Pfad `share.html` ausnehmen; das Passwort je Link bleibt der Schutz |
| GB-Präsentation an öffentlichen Vorträgen | öffentlich | entweder ganz ausnehmen oder Vorführgerät angemeldet lassen |

## 6.4 Technische Ausnahmen

- `portal.wicki.aero/hit.js` (Aufrufzähler, wird von allen Apps geladen) ausnehmen.
- Die Statusprüfung des Portals erhält ein «Service Token», damit sie die Apps weiterhin abfragen
  kann, ohne angemeldet zu sein.

# 7 Betrieb im Flug und offline

Das ist der heikelste Punkt. Läuft im Korb die Anmeldung ab oder fehlt das Netz, darf keine
wichtige App gesperrt sein.

- **Sitzungsdauer lang wählen:** für die Apps, die im Flug gebraucht werden (KRT2, Ops,
  Stüve, O2, S2 Ground), 30 Tage; für die übrigen 7–14 Tage.
- **Offline-Apps:** Apps mit Offline-Speicher (Service Worker) laufen ohne Netz aus dem Speicher
  weiter. Kritisch ist der Moment, in dem wieder Netz da ist, die Sitzung aber abgelaufen ist.
  Dann leitet Cloudflare auf die Anmeldeseite um. Jede Flug-App muss diesen Fall so behandeln,
  dass sie ihre gespeicherte Fassung weiter anzeigt und nur einen Hinweis «neu anmelden» zeigt.
  Das wird in Phase 2 mit O2 getestet, bevor eine Flug-App aufgeschaltet wird.
- **Vor jeder grossen Fahrt:** im Portal «Sitzungen erneuern» (alle Apps einmal öffnen), damit die
  30 Tage ab Start laufen. Das Portal zeigt an, wann die Sitzung abläuft.

# 8 Daten-Schnittstellen (Worker)

Mehrere Apps sprechen mit eigenen Cloudflare Workern auf `*.workers.dev`, z. B.
`briefing-api.balthasar.workers.dev` (Ops), `diashow-api…`, `krt2-api…`. Diese Adressen liegen
**ausserhalb** von wicki.aero und wären durch Access nicht geschützt. Wer die Adresse kennt,
könnte die Schnittstellen weiterhin direkt ansprechen. Heute schützen die Apps diese Schnittstellen
mit ihren eigenen Logins, das bleibt vorerst so.

Ausbau: Die Worker erhalten Adressen unter wicki.aero (z. B. `api.ops.wicki.aero`; in den
Konfigurationen von Ops und KRT2 bereits vorbereitet) und kommen ebenfalls hinter Access, oder sie
prüfen das Cloudflare-Anmelde-Token selbst. Danach kann `workers.dev` abgeschaltet werden.

# 9 Umsetzung in Phasen

| Phase | Inhalt | Wer | Unterbruch |
|---|---|---|---|
| 0 | Bestandsaufnahme aller DNS-Einträge bei united-domains (inkl. E-Mail-Einträge MX/SPF/DKIM!) | Du (Liste kopieren), Claude prüft | keiner |
| 1 | Cloudflare: Website wicki.aero anlegen, Einträge übernehmen und prüfen, dann bei united-domains die Nameserver umstellen | Du im Browser, Anleitung von Claude | wenige Minuten bis Stunden möglich |
| 2 | Cloudflare Zero Trust einrichten (Gratis-Plan, Anmeldung per Einmalcode); **nur O2** hinter Access; Test: Anmeldung, Offline, Sitzungsablauf, Statusprüfung | Du im Browser + Claude | nur O2 |
| 3 | Portal: Anmeldung, Verwaltungsseite Personen × Apps, Abgleich mit Cloudflare, Anzeige nur der eigenen Apps | Claude baut | keiner |
| 4 | App für App aufschalten, zuerst die ohne Ausnahmen (Cockpit, Stüve, S2-Apps, Analyze, GaforCast), dann Ops, Diashow, KRT2 mit ihren Ausnahmen | Claude + Du (Test je App) | je App kurz |
| 5 | Eigene Logins der Apps durch die Cloudflare-Identität ersetzen (GaforCast-Kennwort, Ops-Konten, KRT2-Konten, Diashow) | Claude je App | je App |
| 6 (optional) | Apps von GitHub Pages zu Cloudflare umziehen, Repositories privat, Worker unter wicki.aero (Kapitel 8) | Claude | je App |

# 10 Risiken

| Risiko | Massnahme |
|---|---|
| E-Mail fällt aus, weil beim DNS-Umzug Einträge fehlen | Phase 0: vollständige Liste, Vergleich vor dem Umstellen |
| Zertifikate von GitHub Pages hinter Cloudflare | SSL-Modus «Full»; sauberste Lösung ist Phase 6 |
| Selbst ausgesperrt | zweiter Anmeldeweg für den Supermaster (z. B. Google-Konto zusätzlich zum Einmalcode) |
| Flug-App im Korb gesperrt | Kapitel 7, Test in Phase 2, lange Sitzungen |
| Grenze von 50 Nutzern | bei 10–15 Personen weit entfernt; inaktive Personen im Portal entfernen |

# 11 Kosten

Cloudflare Zero Trust ist bis 50 Nutzer gratis, darüber 7 USD pro Nutzer und Monat (für alle
Nutzer). DNS bei Cloudflare ist gratis. Die Registrierung der Domain bei united-domains bleibt wie
bisher.

# 12 Offene Fragen

1. Ops-Leselinks an Externe: Pfad ausnehmen, so dass der Token im Link genügt? → ja/nein
2. Diashow-Teillinks: `share.html` ausnehmen, so dass das Passwort je Link genügt? → ja/nein
3. GB-Präsentation: ganz ausnehmen oder hinter Anmeldung? → «ausnehmen» / «Anmeldung»
4. Zweiter Anmeldeweg für Dich als Supermaster: Google-Konto, Microsoft-Konto oder nur
   Einmalcode? → Auswahl
5. Läuft über wicki.aero E-Mail (Postfächer oder Versand)? → ja/nein, welcher Anbieter
6. Sollen Personen per E-Mail eingeladen werden, oder teilst Du den Link selbst mit? → «Einladung» / «selbst»
7. Mit Phase 0 (DNS-Bestandsaufnahme) beginnen? → ja/nein
