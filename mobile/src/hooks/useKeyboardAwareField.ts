// Wunsch-Abstand zwischen Feldunterkante und Tastatur (bzw. einem darüber liegenden
// Element). Die EINZIGE bewusst gesetzte Zahl hier — die Leistenhöhe wird gemessen.
const FIELD_GAP = 32;

type Options = {
  // Höhe eines Elements, das über der Tastatur liegt und das Feld sonst verdecken würde
  // (z.B. eine sticky Submit-Leiste). Gemessen weiterreichen, nicht raten.
  clearance?: number;
};

/**
 * Speist `bottomOffset` für `KeyboardAwareScrollView`, damit das fokussierte Feld mit
 * Luft über Tastatur + etwaiger Leiste steht.
 *
 * Die Library misst bis zur UNTERKANTE des fokussierten Feldes (maybeScroll:
 * `point = absoluteY + inputHeight`) und scrollt bei Wachstum des Multiline-Feldes
 * selbst nach — die Feldhöhe darf hier also NICHT aufaddiert werden, sonst scrollt
 * jeder Tastendruck um eine ganze Feldhöhe zu weit nach oben.
 */
export function useKeyboardAwareField({ clearance = 0 }: Options = {}) {
  return { bottomOffset: FIELD_GAP + clearance };
}
