# BoulderSesh — Store-Listing-Entwürfe (DE/EN)

Status: Entwurf 2026-08-05, noch nicht eingereicht. Zeichenlimits:
App Store: Name 30, Untertitel 30, Beschreibung 4000, Keywords 100.
Play Store: Titel 30, Kurzbeschreibung 80, Beschreibung 4000.

Privacy-URL (beide Stores): https://bouldersesh.com/privacy
Support-/Marketing-URL: https://bouldersesh.com · hello@bouldersesh.com

---

## App Store (iOS)

### Name
BoulderSesh

### Untertitel (max 30)
- EN: `Find your next climbing sesh` (28 ✓)
- DE: `Finde deine Boulder-Session` (27 ✓)

### Keywords (max 100, EN)
`bouldering,climbing,boulder,gym,partner,session,climb,social,sport,indoor,crag,bloc` (83 ✓)
<!-- "meetup" entfernt (fremde Marke → Apple-Ablehnungsrisiko), "buddy" entfernt
     (Namenskollision-Altlast); ersetzt durch "crag" + "bloc". -->

### Keywords (max 100, DE — eigene Lokalisierung)
`bouldern,klettern,boulder,halle,kletterpartner,session,sport,indoor,kletterhalle,verabreden,sozial` (98 ✓)


### Beschreibung (EN)

Never boulder alone again.

BoulderSesh connects you with boulderers in your city. See who's
planning a session at your gym, join with one tap, or start your own
sesh and let others climb with you.

FIND SESSIONS
Pick your city and browse upcoming bouldering sessions at gyms near
you — who's going, when, and at what level.

CREATE YOUR OWN
Choose your gym, set a time, and publish your session. Other
boulderers in your city can request to join.

CLIMB TOGETHER
Chat with everyone in your session to sort out the details. Chats are
temporary and disappear after the session — no clutter, no noise.

YOUR PROFILE, YOUR LEVEL
Set your skill level so everyone knows what to expect — from first-
timer to crusher. Everyone is welcome.

FREE, NO ADS
BoulderSesh is free, has no ads, and your data stays in the EU.

Grab your shoes — your next sesh is waiting.

### Beschreibung (DE)

Nie wieder allein bouldern.

BoulderSesh verbindet dich mit Boulderern in deiner Stadt. Sieh, wer
in deiner Halle eine Session plant, tritt mit einem Tap bei — oder
starte deine eigene Sesh und lass andere mitklettern.

SESSIONS FINDEN
Wähle deine Stadt und entdecke anstehende Boulder-Sessions in Hallen
in deiner Nähe — wer geht, wann, und auf welchem Level.

SELBST ERSTELLEN
Halle auswählen, Zeit festlegen, Session veröffentlichen. Andere
Boulderer aus deiner Stadt können anfragen und beitreten.

GEMEINSAM KLETTERN
Klär die Details im Session-Chat. Chats sind temporär und
verschwinden nach der Session — kein Ballast, kein Lärm.

DEIN PROFIL, DEIN LEVEL
Gib dein Können an, damit alle wissen, was sie erwartet — von
Erstbesucher bis Crusher. Alle sind willkommen.

KOSTENLOS, OHNE WERBUNG
BoulderSesh ist kostenlos, werbefrei, und deine Daten bleiben in
der EU.

Schnapp dir deine Schuhe — deine nächste Sesh wartet.

---

## Play Store (Android)

### Titel
BoulderSesh

### Kurzbeschreibung (max 80)
- EN: `Find bouldering sessions in your city and climb together.` (57 ✓)
- DE: `Finde Boulder-Sessions in deiner Stadt und klettere gemeinsam.` (62 ✓)

### Beschreibung
Gleicher Text wie App Store (EN/DE oben).

---

## App-Privacy-Angaben (App Store „Nutrition Label" / Play „Data safety")

Erhobene Daten (mit Account verknüpft):
- E-Mail-Adresse (Account/Auth)
- Name (Profil)
- Foto (Avatar, optional)
- Skill-Level (Profil)
- Stadt (App-Funktion, nur aktive Stadt — keine GPS-Ortung)
- Nutzerinhalte: Sessions, Chat-Nachrichten (Chats werden 24 h nach
  Session-Start gelöscht)

Nicht erhoben: Standort (GPS), Kontakte, Tracking/Werbe-IDs.
Kein Tracking, keine Werbung, keine Datenweitergabe an Dritte.
Hosting: Supabase, EU (eu-west-1). In-App-Kontolöschung vorhanden.

---

## Kategorie

- **App Store (iOS):** Primär `Sports`, Sekundär `Social Networking`.
- **Play Store (Android):** `Sport` (Alternative: `Soziales` — Sport ist thematisch
  präziser und weniger überlaufen).

---

## Altersfreigabe / Content Rating — Antworten für die Fragebögen

Grundlage: Die App enthält KEINE Gewalt, Sexualität, Drogen, Glücksspiel,
Schimpfwörter o. ä. Der einzige rating-relevante Punkt ist **nutzergenerierter
Inhalt / Kommunikation** (Session-Chat, Profile).

### Play Store (IARC-Fragebogen)
- Gewalt / Sexualität / Drogen / Glücksspiel / Schimpfwörter: **alles „Nein".**
- **Nutzer interagieren / kommunizieren miteinander: JA** (Chat).
- **Nutzer teilen selbst erstellte Inhalte: JA** (Sessions, Chat-Nachrichten).
- **Standort teilen: NEIN** (nur Stadt, kein GPS/präziser Standort).
- Erwartetes Ergebnis: niedrige Freigabe (USK 0 / PEGI 3 / „Everyone") mit dem
  Hinweis „Nutzer interagieren".

### App Store (Altersfreigabe-Fragebogen)
- Alle Inhaltskategorien (Gewalt, Sex, Horror, Glücksspiel …): **„None/Keine".**
- **User-generated Content: JA** → Apple verlangt dafür Melden + Blockieren +
  Kontaktmöglichkeit — **alles vorhanden** (siehe Compliance-Hinweis unten).
- Erwartete Freigabe: 4+ bis 12+ (je nach Apples aktuellem UGC-Handling).

---

## Apple-Guideline-1.2-Compliance (User-generated Content) — ERFÜLLT

Für die Chat-/Profil-Features verlangt Apple (1.2 Safety) vier Dinge — Status:
- ✅ **Objektionable Inhalte melden:** `profile_reports` (Migration 0009).
- ✅ **Missbräuchliche Nutzer blockieren:** `profile_blocks` (Migration 0025,
  kappt Sichtbarkeit + Kontakt sofort).
- ✅ **Kontaktmöglichkeit des Entwicklers:** hello@bouldersesh.com.
- ✅ **EULA / Nutzungsbedingungen mit Verhaltensregeln:** bouldersesh.com/terms
  §4 verbietet Belästigung/Beleidigung + unangemessene Inhalte samt Konsequenzen
  (Entfernen/Sperren/Löschen) — deckt Apples UGC-Anforderung ab (geprüft 2026-08-10).

---

## Noch fehlende ASSETS (kein Text — separat erstellen)

- ❌ **Screenshots** (Pflicht, beide Stores; aus Simulator/Emulator).
  - App Store: mind. iPhone 6.7"/6.9"-Format.
  - Play Store: mind. 2 Telefon-Screenshots.
- ❌ **Feature-Grafik** (nur Play Store, 1024×500 PNG/JPG).
- ✅ **App-Icon:** vorhanden (`mobile/assets/images/icon.png` 1024²), nur hochladen.
