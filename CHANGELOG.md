# Änderungen

## 0.3.1 — 31.10.2026

- Diashow (diashow.wicki.aero) in «Vorträge und sonstiges» aufgenommen.
- StueveCast heisst neu «Stüve» (auch in der App selbst, dort Version 0.12.2).

## 0.3.0 — 31.10.2026

- «benutzt» zählt jetzt alle Aufrufe jeder App auf allen Geräten: Zähler im Worker (Durable Object), Skript `hit.js`, in alle 12 Apps eingebunden.
- Stüve (ehemals StueveCast) unter stueve.wicki.aero (id `stueve`).
- GaforCast Europa entfernt (nicht realisiert).

## 0.2.0 — 31.10.2026

- Bei jeder App: Version, Stand (Datum der letzten Änderung) und «benutzt» (letzter Aufruf über das Portal, je Gerät).
- Versionen werden aus der Versionsdatei jeder App gelesen (`version_file` in `apps.json`) statt nur aus Releases/Commits.
- Neue Kategorie «Windsonde S2/RR4» (S2 Planning, S2 Ground, S2 Stüve); «Vorträge» heisst neu «Vorträge und sonstiges».
- Desktop: drei Spalten, Handy: Phasen in fester Reihenfolge.
- StueveCast verweist auf das Repository `bwicki/stueve`.
- Workflow «Diagnose» (Actions): prüft Worker, DNS und App-Adressen, Ergebnis in `data/diagnose.txt`.

## 0.1.0 — 31.10.2026

Erste Version.

- Gestaltung nach Entwurf B «Fahrtablauf» (hell, schlicht) mit den Statusleuchten aus Entwurf A.
- 13 Apps in vier Phasen: Vorbereitung, Fahrt, Nachbereitung, Vorträge; Liste in `apps.json`.
- Statusleuchte je App und Sammelanzeige; Prüfung über den Worker `portal-api`, ersatzweise im Browser.
- Versionsangabe und «Neu & geändert» aus GitHub (Action «Update repos», stündlich).
- Suche (`/`, Enter, Esc), Favoriten und zuletzt benutzte Apps je Gerät.
- DE/EN umschaltbar, installierbar als App (PWA), ohne Kennwort.
