# bouldersesh.com – Website & Rechtstexte

Statische Seiten (Landing + Nutzungsbedingungen, Datenschutz, Impressum) für
GitHub Pages unter `https://bouldersesh.com`. Kein Build-Schritt, keine
externen Ressourcen.

**Quelle der Wahrheit ist dieser Ordner.** Deployed wird er in ein separates,
öffentliches Repo (GitHub Pages im Free-Plan braucht ein Public Repo — das
App-Repo bleibt privat/lokal):

```sh
# einmalig
gh repo create bouldersesh-site --public
# bei jeder Änderung: Ordnerinhalt ins Site-Repo pushen
```

Setup nach dem ersten Push (einmalig):
1. GitHub → Repo → Settings → Pages → Branch `main`, Ordner `/ (root)`.
2. Custom domain `bouldersesh.com` eintragen (die `CNAME`-Datei hier setzt das
   automatisch), „Enforce HTTPS" aktivieren.
3. Beim Domain-Registrar: `A`-Records der Apex-Domain auf GitHub-Pages-IPs
   (185.199.108.153 … 111.153) + `www` als `CNAME` auf `<user>.github.io`.

Impressums-Daten und Stand-Datum sind eingetragen (2026-08-04);
`hello@bouldersesh.com` ist bei Porkbun als Weiterleitung eingerichtet.
Bei Adress- oder Datumsänderungen: alle drei Rechtsseiten anfassen
(„Stand:" nur in privacy/terms).

Die App verlinkt auf `/terms` und `/privacy` (`mobile/src/lib/legal.ts`) —
GitHub Pages löst extensionslose Pfade auf die `.html`-Dateien auf.

**Hinweis:** Die Rechtstexte sind sorgfältige Entwürfe, aber keine
Rechtsberatung.
