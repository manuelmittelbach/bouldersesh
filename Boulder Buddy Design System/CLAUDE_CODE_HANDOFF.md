# An Claude Code übergeben — Boulder Buddy Design System

Dieses Projekt ist **bereits als Agent-Skill aufgebaut**. Du musst nichts umbauen — herunterladen, in dein Repo legen, fertig.

## Schnellstart (empfohlen)

1. **Projekt herunterladen** (ZIP aus dem Chat) und entpacken.
2. Den Ordner in dein Repo legen unter:
   ```
   <dein-repo>/.claude/skills/boulder-buddy-design/
   ```
   (Die `SKILL.md` muss direkt in diesem Ordner liegen.)
3. In Claude Code den Skill aufrufen:
   ```
   /boulder-buddy-design
   ```
   oder einfach: *"Nutze das Boulder-Buddy-Design-System und baue mir …"*

Claude Code liest dann zuerst `SKILL.md`, danach `readme.md` (den kompletten Design-Guide) und erkundet die restlichen Dateien selbstständig.

## Was drin ist

| Pfad | Inhalt |
|---|---|
| `SKILL.md` | Skill-Einstieg (Front-Matter + Kurzanleitung) |
| `readme.md` | Vollständiger Design-Guide: Kontext, Content-Tonalität, visuelle Foundations, Iconografie, Index |
| `styles.css` | Globaler Einstieg — `@import`t alle Tokens + Fonts |
| `tokens/` | `colors.css`, `typography.css`, `spacing.css`, `fonts.css` (CSS-Custom-Properties) |
| `components/` | 11 React-Primitives (`.jsx` + `.d.ts` + `.prompt.md`) — Button, Input, GradePill, SessionCard … |
| `ui_kits/boulder-buddy/` | Klickbare Recreation der App (Login → Feed → Detail → Match → Chat → Profil) |
| `guidelines/` | Foundation-Spezimen-Karten (Farben, Schrift, Abstände, Brand) |

## So soll Claude Code es benutzen

- **Produktionscode:** Die `tokens/*.css` als Quelle der Wahrheit für Farben/Schrift/Abstände übernehmen, die `components/*.jsx` als Vorlage für die echten Komponenten im Ziel-Stack (React/Vue/etc.) nachbauen. Die HTML-Dateien sind **Design-Referenzen, kein Copy-Paste-Code**.
- **Prototypen/Mocks:** `styles.css` + Lucide-CDN + Google-Fonts laden und die Muster aus `ui_kits/boulder-buddy/` wiederverwenden.

## Wichtige Hinweise für die Umsetzung

- **Fonts** kommen aktuell vom Google-Fonts-CDN (Space Grotesk, Inter, JetBrains Mono). Für offline/Produktion die Binaries nach `assets/fonts/` laden und in `tokens/fonts.css` den `@import` durch lokale `@font-face`-Regeln ersetzen.
- **Kein echtes Logo** im Quell-Codebase — die Marke ist das Lucide-`mountain`-Glyph in einer orangefarbenen Kachel. Falls ein echtes Logo existiert: in `assets/` ablegen und das Lockup aktualisieren.
- **Semantische Aliase verwenden** (`--brand`, `--text-strong`, `--surface-card`, `--radius-lg`), nicht die Rohskalen (`--rock-900`, `--orange-500`).
- Design-Richtung: **cool, athletisch, sparsam** — Orange ist Akzent (ein Treffer pro View), keine Emoji im UI, enge Radien.
