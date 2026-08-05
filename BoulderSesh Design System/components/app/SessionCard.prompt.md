The signature BoulderSesh feed unit — who's climbing, when, where, at what grade. Composes Avatar + GradePill + Card.

```jsx
<SessionCard
  name="Lina K."
  avatarTone="orange"
  grade="6a – 6c"
  band="intermediate"
  time="Heute · 18:00 – 21:00"
  gym="Boulderwelt München-Ost"
  note="Suche jemand zum Projekt-Bouldern an einem 6c+."
  timeIcon={<i data-lucide="clock" />}
  gymIcon={<i data-lucide="map-pin" />}
  footer={<Badge tone="success" icon={<i data-lucide="check-circle-2" />}>Passt zu deinem Level</Badge>}
  onClick={openDetail}
/>
```

Pass icon nodes for the meta rows. `footer` takes a Badge or match hint. `onClick` makes the card interactive (press scale-down).
