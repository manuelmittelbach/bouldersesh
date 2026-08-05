Chat bubble — orange + right for `mine`, rock-100 + left for the other person. Mono timestamp.

```jsx
<MessageBubble>Hey Manu! Cool, dass du Bock hast.</MessageBubble>
<MessageBubble mine time="9:43">Zusammen warm machen klingt gut!</MessageBubble>
```

The asymmetric corner (clipped on the sender's side) gives the conversation direction. Group consecutive bubbles and show `time` on the last.
