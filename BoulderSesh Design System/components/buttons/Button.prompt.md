Primary action control — bold orange `primary`, dark `secondary`, hairline `outline`, chromeless `ghost`; one primary per view.

```jsx
<Button variant="primary" size="md" icon={<i data-lucide="send" />}>
  Session veröffentlichen
</Button>

<Button variant="outline" size="sm">Abbrechen</Button>
<Button variant="secondary" fullWidth>Zurück zum Feed</Button>
```

Variants: `primary` (orange, max one per screen) · `secondary` (rock-900 ink) · `outline` (hairline) · `ghost`.
Sizes: `sm` 36px · `md` 44px · `lg` 52px. Press gives a confident scale-down (no bounce). Pass icons as nodes via `icon` / `trailingIcon`.
