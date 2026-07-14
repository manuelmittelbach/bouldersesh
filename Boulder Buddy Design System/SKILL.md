---
name: boulder-buddy-design
description: Use this skill to generate well-branded interfaces and assets for Boulder Buddy (a mobile-first PWA for finding bouldering partners), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

Boulder Buddy is a German-language, mobile-first app for finding a climbing partner. The design language is **cool, athletic and confident** (not playful): Space Grotesk display, Inter UI/body, JetBrains Mono for climbing grades; cool "Rock" graphite neutrals; Send Orange used as one bold accent per view; tight architectural radii; Lucide icons; no emoji in product chrome.

- Global CSS: link `styles.css` (it `@import`s `tokens/*`). Reference semantic aliases (`--brand`, `--text-strong`, `--surface-card`, `--radius-lg`), not raw scales.
- Components live in `components/<group>/` as `.jsx` + `.d.ts` + `.prompt.md`; the full click-through app recreation is in `ui_kits/boulder-buddy/`.
- Foundation specimens (colors/type/spacing/brand) are in `guidelines/`.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc.), copy assets out and create static HTML files for the user to view — load `styles.css`, the Lucide CDN, and Google Fonts; reuse the patterns in `ui_kits/boulder-buddy/`. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
