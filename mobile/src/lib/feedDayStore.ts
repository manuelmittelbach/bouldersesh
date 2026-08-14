// Einweg-Übergabe Create-Flow → Feed (Muster: cropStore.ts, bewusst modul-global):
// nach dem Veröffentlichen legt der Create-Screen hier den Tag der neuen Session ab,
// der Feed konsumiert ihn beim nächsten Fokus und springt auf diesen Tag — die
// Bestätigung „deine Session ist live" ist so im Feed sichtbar, statt dass der
// zurückkehrende Blick auf „Today" ins Leere geht. KEIN Router-Param: der Feed-Tab
// bleibt gemountet, und ein Param müsste nach dem Konsum wieder gelöscht werden,
// damit ein zweites Anlegen am selben Tag erneut feuert — genau das One-Shot-Take
// hier, nur fragiler.

// `.ts`-Endung: Nodes Type-Stripping (npm test) braucht sie zur Laufzeit,
// tsconfig erlaubt sie per allowImportingTsExtensions, Metro löst sie ebenso auf.
import { startOfDay } from "./utils.ts";

let pending: Date | null = null;

/** Vom Create-Screen VOR dem Zurück-Navigieren abgelegt. Normalisiert auf den
 *  Mitternacht-Anker — dieselbe Form, in der der Feed seinen `selectedDate` hält. */
export function setPendingFeedDay(d: Date): void {
  pending = startOfDay(d);
}

/** Vom Feed beim Fokus gelesen — genau einmal, danach wieder `null` (One-Shot). */
export function takePendingFeedDay(): Date | null {
  const d = pending;
  pending = null;
  return d;
}
