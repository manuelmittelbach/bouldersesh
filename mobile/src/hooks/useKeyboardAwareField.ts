import { useCallback, useState } from "react";

// Wunsch-Abstand zwischen Feldunterkante und Tastatur (bzw. einem darüber liegenden
// Element). Die EINZIGE bewusst gesetzte Zahl hier — jede Höhe wird gemessen, nicht
// geraten. Ändert jemand die Feld- oder Leistenhöhe, stimmt der Offset automatisch.
const FIELD_GAP = 20;

type Options = {
  // Höhe eines Elements, das über der Tastatur liegt und das Feld sonst verdecken würde
  // (z.B. eine sticky Submit-Leiste). Ebenfalls gemessen weiterreichen, nicht raten.
  clearance?: number;
};

/**
 * Speist `bottomOffset`/`extraKeyboardSpace` für `KeyboardAwareScrollView` aus der
 * tatsächlich gemessenen Feldhöhe, damit IMMER das ganze fokussierte Feld über der
 * Tastatur steht — egal wie hoch das Feld ist oder wie es wächst.
 *
 * `bottomOffset` misst bis zum Cursor. Steht der Cursor ganz oben im (leeren) Feld,
 * liegt die Feldunterkante `fieldHeight` tiefer — also genau so weit hochscrollen, plus
 * Gap und die Höhe eines etwaigen Elements über der Tastatur.
 *
 * Es zählt die größte gemessene Feld-Box: Pro Screen kommt praktisch nur eine Feldgröße
 * vor, und ein fester Wert (statt „das gerade fokussierte Feld") vermeidet eine Race-
 * Condition — er steht schon nach dem Layout, bevor überhaupt fokussiert wird.
 */
export function useKeyboardAwareField({ clearance = 0 }: Options = {}) {
  const [fieldHeight, setFieldHeight] = useState(0);

  const onFieldLayout = useCallback((height: number) => {
    setFieldHeight((cur) => (height > cur ? height : cur));
  }, []);

  const bottomOffset = fieldHeight + FIELD_GAP + clearance;

  // Bewusst KEIN extraKeyboardSpace: bottomOffset steuert nur die Scroll-Distanz
  // (begrenzt durch die Inhaltshöhe) und erzeugt selbst keinen Leerraum. Ein Puffer
  // würde bei offener Tastatur unten sichtbar leeren Platz anhängen — unnötig, solange
  // unter dem Feld noch Inhalt (Buttons o.ä.) steht, der als Scroll-Raum dient.
  return { bottomOffset, onFieldLayout };
}
