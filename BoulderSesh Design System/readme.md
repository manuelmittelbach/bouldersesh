# BoulderSesh — Design System

> *"Sag der App, wann du wohin gehst — sie zeigt dir, mit wem du klettern könntest."*

BoulderSesh is a **mobile-first PWA for finding a climbing partner**. You post when and where you're bouldering and at what grade; other climbers see it, match, chat, and go climb. German-language, Munich-launched, hobby-climber audience.

This design system encodes the brand after a deliberate shift in direction: **weniger verspielt, mehr cool** — *less playful, more cool*. The original app was warm, rounded and emoji-friendly (Inter + Tailwind orange + warm "stone" neutrals). This system keeps the signature orange and the climbing-grade DNA but pulls everything toward a cooler, more confident, more athletic feel.

---

## Sources

Built from the attached **`bouldersesh/`** codebase (read-only). Key references:

- `bouldersesh/BoulderSesh_Konzept.md` — product vision, features, data model, user flows, tonality.
- `bouldersesh/mockup.html` — the original clickable Tailwind mockup (5 screens). Primary visual reference.
- `bouldersesh/app/` — Vite + React + TypeScript + Tailwind + Supabase skeleton.
  - `app/tailwind.config.ts` — original palette (`brand` = Tailwind orange, `#f97316`).
  - `app/src/index.css` — warm `stone` neutrals, Inter.
  - `app/src/components/SessionCard.tsx`, `BottomNav.tsx` — original component shapes.
  - `app/src/pages/{Auth,Dashboard,Chat,Profile,SessionCreate,SessionDetail}.tsx` — real screens.
  - `app/src/types/database.ts` — data model (`SkillLevel = beginner | intermediate | advanced | pro`, sessions, matches, chats, messages).

The reader is not assumed to have access; everything needed is reproduced here and in the token files.

---

## The shift: original → cooler

| Aspect | Original app | This system |
|---|---|---|
| Display type | Inter, bold | **Space Grotesk** — technical grotesque, tight tracking |
| Grades / numerics | Inter | **JetBrains Mono** — grades read as *data* (6c+, 7a) |
| Neutrals | warm `stone` (sandy) | **Rock** — cool graphite, faint blue cast (concrete/granite) |
| Orange | `#f97316`, used liberally | `#f25c16`, **one bold hit per view** |
| Corner radii | bubbly (16–24px) | architectural (cards **14px**, inputs 12px) |
| Emoji | frequent (💛🧗🙏📩) | removed from UI; Lucide icons carry meaning |
| Avatars | candy gradients | flat, calm tone set |
| Shadows | soft warm blobs | low, cool, single-source |

---

## Content fundamentals

**Language:** German, informal throughout. Always **du**, never *Sie*. Gender-inclusive colon form where natural (*Boulder:innen*, *ein:e dritte:r*).

**Voice:** locker, climbing-community, never corporate. Direct and warm but now a touch cooler and more confident — fewer exclamation marks, no emoji in the product UI. Think *gym-poster terse*, not *startup-cheery*.

**Casing:** Sentence case for headlines and buttons (*"Wer klettert?"*, *"Session veröffentlichen"*). UPPERCASE only for small eyebrow labels (*WANN?*, *WUNSCH-LEVEL*) with wide tracking.

**Headlines** are short and human — questions and invitations: *"Wer klettert?"*, *"Sag der App, wann du wohin gehst …"*. Use the display face (Space Grotesk).

**Microcopy** is practical and encouraging: *"Passt zu deinem Level"*, *"1 / 2 Plätze frei"*, *"Stretch-Level"*, *"Anfrage gesendet"*. Tips are framed as climbing wisdom, not nags: *"Anfragen mit Nachricht werden 3× häufiger zugesagt."*

**Climbing grades** use the Fb scale (`5+`, `6a`, `6c+`, `7a+`, `8a`) and read as data — always set in mono. Levels map to four bands: *Beginner / Intermediate / Advanced / Pro*.

**Examples** (verbatim tone):
- *"Suche jemand zum Projekt-Bouldern. Versuche mich an einem 6c+ in der gelben Ecke."*
- *"Heute Abend in der Boulderwelt — wer kommt mit?"*
- *"Power-Session. Suche jemand auf ähnlichem Niveau zum Spotten."*

**Don't:** corporate filler, English UI strings, emoji in product chrome, exclamation pile-ups, formal *Sie*.

---

## Visual foundations

**Colour.** A cool, gritty system. The hero is **Send Orange** (`--brand` = `--orange-500` = `#f25c16`) — used as *punctuation*, one bold hit per screen (the primary CTA, the FAB, the active tab). Everything else is **Rock**, a cool graphite neutral scale (`--rock-25` canvas, `--rock-0` cards, `--rock-900` ink) with a faint blue cast so it reads as concrete, not sand. Four muted **grade bands** (green/blue/orange/red) colour the grade pills; they're desaturated so they read as data, not candy. See `tokens/colors.css`.

**Type.** Three families (`tokens/typography.css`):
- **Space Grotesk** — display/headlines/wordmark. Tight tracking (−0.02em), 600–700.
- **Inter** — UI and body (carried from the codebase). 15px base, line-height 1.45.
- **JetBrains Mono** — climbing grades, timestamps, numerics. The technical accent that signals "data."

**Spacing & shape.** 4px grid (`tokens/spacing.css`). Radii are deliberately tighter than the original: tags 6px, buttons/inputs 10–12px, **cards 14px**, panels 20px, pills/avatars fully round. The pull-in from bubbly 24px is most of what makes the system feel cooler.

**Backgrounds.** Flat. App canvas is `--rock-25` (cool off-white). No gradients on surfaces. The only texture is an optional subtle dotted grid on showcase/marketing canvases (`radial-gradient(circle, --rock-200 1px, transparent 1px)` at 22px). No imagery baked into the system — climbing photos, when added, should be cool/neutral, slightly desaturated (no warm Instagram filter).

**Cards.** White (`--surface-card`), 1px hairline (`--border-subtle`), 14px radius, low cool shadow (`--shadow-sm`). That's the base surface for everything — feed cards, info panels, sheets.

**Shadows.** Low, cool, single-source (`--shadow-xs … lg`). The one exception is `--shadow-brand`, a soft orange glow **reserved for the FAB / primary float** — never on regular cards.

**Borders.** Hairlines do the structural work (1px `--rock-100/200`). Dividers, input outlines, card edges. Cool, never black.

**Motion.** Restrained. Standard ease is `cubic-bezier(.22,1,.36,1)` over 120–200ms. **Press feedback is a confident scale-down** (`scale(0.97)` for buttons, `0.985` for cards) — no springy bounce, no overshoot. Fades for screen transitions. The only looping animation is the 3-dot chat typing indicator. Respect `prefers-reduced-motion`.

**Hover / press states.** On press: scale-down (above). Primary buttons darken on hover (`--brand` → `--brand-hover` 600 → press 700). Ghost/soft controls fill to `--surface-sunken`. Active filter chips invert to ink (`--rock-900` fill, white text).

**Transparency / blur.** Used sparingly — not a glassmorphism system. Optional translucent sheet backdrops only.

**Layout.** Mobile-first, locked to a phone column (`max-width` ~390–430). Bottom nav fixed; FAB floats bottom-right above it. Max two tap-depths to anything. Status-bar/safe-area aware.

---

## Iconography

**Lucide** (https://lucide.dev) — the icon set already used by the codebase (`lucide-react` in the app, `lucide` UMD in the mockup). Clean, consistent 1.5–2px stroke, rounded line caps. It fits the cool-but-friendly tone perfectly, so it's adopted as the system's icon language rather than substituted.

- **In components & UI kit:** rendered via the Lucide CDN UMD build (`<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js">`) using `<i data-lucide="name">` + `lucide.createIcons()`. In React, re-run `createIcons()` after renders that add icons. In the authored design-system components, icons are passed in as **nodes** (`icon={<i data-lucide="send" />}`) so the system stays icon-library-agnostic.
- **Default sizes:** 14px (meta rows / inline), 16px (buttons), 20–26px (nav, FAB, headers). Stroke inherits `currentColor`.
- **Common glyphs:** `mountain` (brand mark), `plus` (FAB / new), `hand` ("Klettern mit?"), `clock`, `map-pin`, `users`, `calendar`, `trending-up`, `send`, `message-circle`, `house`, `user`, `circle-check-big`, `badge-check`, `arrow-up-right`, `lightbulb`, `chevron-down`.
- **No emoji** in product chrome (a deliberate change from the original mockup). **No unicode glyphs** as icons. **No hand-drawn SVG** — always a real Lucide icon.

**Logo / wordmark.** There is no dedicated logo asset in the codebase; the brand mark is a **`mountain` Lucide glyph in a rounded orange tile** (12px radius) next to the **"BoulderSesh"** wordmark set in Space Grotesk 700. Light and dark lockups are specimen'd in `guidelines/brand-logo.card.html`. *If a real logo exists, drop it into `assets/` and update the lockup.*

---

## How to use

Consumers link the one entry file:

```html
<link rel="stylesheet" href="styles.css" />
```

It `@import`s every token + font file. Reference the **semantic aliases** (`--text-strong`, `--surface-card`, `--brand`, `--radius-lg`) in your work, not the raw scales (`--rock-900`, `--orange-500`) — the aliases carry intent and survive re-theming.

React components are bundled automatically to `_ds_bundle.js` under `window.BoulderSeshDesignSystem_019e12`:

```html
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, SessionCard, GradePill } = window.BoulderSeshDesignSystem_019e12;
</script>
```

---

## Index / manifest

**Root**
- `styles.css` — global entry point (imports only).
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill front-matter for use in Claude Code.

**`tokens/`** — `fonts.css` (Google Fonts CDN), `colors.css`, `typography.css`, `spacing.css` (spacing, radii, shadows, motion).

**`components/`** — authored React primitives (`.jsx` + `.d.ts` + `.prompt.md` + one `@dsCard` per dir):
- `buttons/` — **Button**, **IconButton**
- `forms/` — **Input**, **Chip**
- `data-display/` — **Avatar**, **GradePill**, **Badge**, **Card**
- `app/` — **SessionCard**, **BottomNav**, **MessageBubble** (compose the primitives)

**`ui_kits/bouldersesh/`** — self-contained, click-through recreation of the app: Login → Feed → Session anlegen → Detail → Anfrage gesendet → Chat → Profil. Files: `index.html`, `primitives.jsx`, `screens.jsx`, `app.jsx`.

**`guidelines/`** — foundation specimen cards rendered on the Design System tab (Colors, Type, Spacing, Brand).

---

## Caveats

- **Fonts load from the Google Fonts CDN** (Space Grotesk, Inter, JetBrains Mono) — the build couldn't fetch binaries. For offline/production, download them into `assets/fonts/` and replace the `@import` in `tokens/fonts.css` with local `@font-face` rules. *(This is why the compiler reports 0 bundled fonts — they're CDN webfonts, not local binaries.)*
- **No real logo asset** exists in the source — the mark is a Lucide `mountain` glyph in an orange tile. Swap in a real logo if you have one.
- The UI kit is **cosmetic** (no real data/auth); it mirrors the authored primitives rather than importing the bundle so it renders fully standalone.
