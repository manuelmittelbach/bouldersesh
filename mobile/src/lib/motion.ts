/**
 * Motion-Token aus dem Design System. RN kennt keine CSS-Transitions, daher lebt
 * die Marken-Easing-Kurve hier als JS-Konstante (statt im Tailwind-Config) und wird
 * später von Reanimated-Animationen genutzt.
 */

/** Marken-Standard-Easing: cubic-bezier(0.22, 1, 0.36, 1) — sanftes "ease-out". */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
