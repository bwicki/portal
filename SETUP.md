# Einrichtung — einmalig, nur im Browser

Die Seite selbst läuft sofort über GitHub Pages. Für die Statusleuchten braucht es den
Cloudflare Worker `portal-api`; dafür zwei Secrets im Repository. Es sind **dieselben Werte**
wie im Repository `bwicki/ops`.

## 1 · GitHub Pages prüfen

1. https://github.com/bwicki/portal → **Settings** → links **Pages**.
2. *Source*: **Deploy from a branch**, Branch **main**, Ordner **/ (root)** → **Save**.
3. *Custom domain*: `portal.wicki.aero` (steht schon in der Datei CNAME) → **Enforce HTTPS** anhaken,
   sobald es angeboten wird.

## 2 · Zwei Secrets anlegen

1. https://github.com/bwicki/portal → **Settings** → links **Secrets and variables** → **Actions**.
2. **New repository secret**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Secret: derselbe Token wie in `bwicki/ops`. Ist er nicht mehr zur Hand (GitHub zeigt
     Secrets nicht mehr an): Cloudflare → oben rechts Profil → **My Profile** → **API Tokens** →
     **Create Token** → Vorlage **Edit Cloudflare Workers** → **Use template** →
     **Continue to summary** → **Create Token** → Token kopieren.
   - **Add secret**
3. Nochmals **New repository secret**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Secret: Cloudflare-Dashboard → **Workers & Pages** → rechts «Account ID» → kopieren.
   - **Add secret**

## 3 · Worker deployen

1. https://github.com/bwicki/portal → **Actions** → links **Deploy worker** → **Run workflow** → **Run workflow**.
2. Nach etwa einer Minute grüner Haken. Im Lauf unter *Summary* steht die Worker-Adresse.
3. Lautet sie **nicht** `https://portal-api.balthasar.workers.dev`: Datei `js/config.js` öffnen →
   Stift → bei `statusApi:` die angezeigte Adresse eintragen → **Commit changes**.

## 4 · Versionen und «Neu & geändert» sofort füllen

**Actions** → links **Update repos** → **Run workflow**. Danach läuft es stündlich von selbst.

## Prüfen

- https://portal-api.balthasar.workers.dev/api/status zeigt eine Liste mit `"ok":true`.
- https://portal.wicki.aero: Statusleiste zeigt «… Apps online» **ohne** den Zusatz «(Browserprüfung)».

## Wenn etwas nicht geht

| Meldung | Abhilfe |
|---|---|
| «Repository-Secret … fehlt» im Lauf «Deploy worker» | Schritt 2 |
| `Authentication error [code: 10000]` | Token hat keine Worker-Rechte → neuen Token nach Schritt 2 |
| Statusleiste zeigt «(Browserprüfung)» | Worker nicht erreichbar oder Adresse in `js/config.js` falsch → Schritt 3 |
| «Neu & geändert» bleibt leer | Schritt 4; bei längerer Ruhe im Repo pausiert GitHub die stündliche Ausführung → Actions → Update repos → **Enable workflow** |
