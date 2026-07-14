Text field / textarea with optional uppercase label, leading icon, hint and error states.

```jsx
<Input label="E-Mail" type="email" placeholder="du@example.com" icon={<i data-lucide="mail" />} />
<Input label="Notiz" as="textarea" rows={3} placeholder="z. B. 'Suche jemand zum Projekt-Bouldern'" />
<Input label="Halle" error="Bitte eine Halle wählen" />
```

Set `as="textarea"` for multiline. Focus shows an orange ring; `error` turns the border/message red. Use `hint` for helper copy.
