Fixed bottom tab bar. Active tab orange, others muted; optional unread dot.

```jsx
<BottomNav
  active="home"
  onSelect={setTab}
  items={[
    { key: "home",    label: "Home",   icon: <i data-lucide="home" /> },
    { key: "chats",   label: "Chats",  icon: <i data-lucide="message-circle" />, badge: true },
    { key: "profile", label: "Profil", icon: <i data-lucide="user" /> },
  ]}
/>
```

Position it yourself (fixed/absolute bottom). Handles its own safe-area padding.
