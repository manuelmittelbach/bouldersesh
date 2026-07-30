// Brücke zwischen der bildladenden Funktion (pickAndUploadProfileImage in
// images.ts) und dem eigenen Zuschnitt-Screen (app/crop-image.tsx). Der Screen
// bekommt seine Daten nicht über Router-Parameter — ein Bild-URI plus Maße als
// Query-String zu schleusen wäre umständlich und fragil. Stattdessen legt die
// Funktion den Auftrag hier ab, navigiert zum Modal, und wartet auf das hier
// aufgelöste Promise. Bewusst modul-global (Single-Instance): es ist immer nur
// genau ein Zuschnitt gleichzeitig offen.

export type CropMask = 'circle' | 'rounded';

export type CropRequest = {
  uri: string;
  /** Intrinsische Pixelmaße des gewählten Bildes (aus ImagePicker). */
  width: number;
  height: number;
  /** Nur die Form der sichtbaren Maske — der Ausschnitt ist immer quadratisch. */
  mask: CropMask;
};

/** Quadratischer Ausschnitt in Quell-Pixeln, direkt für ImageManipulator.crop. */
export type CropRect = { originX: number; originY: number; size: number };

let pending: CropRequest | null = null;
let resolver: ((rect: CropRect | null) => void) | null = null;

/** Zuschnitt anfordern. Löst mit dem Rechteck auf — oder mit `null`, wenn die
 *  Person abbricht. Ein noch offener Auftrag wird zuerst sauber abgeräumt. */
export function requestCrop(req: CropRequest): Promise<CropRect | null> {
  resolver?.(null);
  pending = req;
  return new Promise((resolve) => {
    resolver = resolve;
  });
}

/** Vom Screen beim Mounten gelesen. `null`, wenn ohne Auftrag geöffnet (z. B.
 *  Hot-Reload) — dann schließt sich der Screen wieder. */
export function takeCropRequest(): CropRequest | null {
  return pending;
}

/** Vom Screen aufgerufen: mit Rechteck bei „Übernehmen", mit `null` bei Abbruch
 *  oder Weg-Swipen. Danach ist der Auftrag erledigt; erneutes Auflösen ist ein
 *  No-op (der Resolver ist bereits weg). */
export function settleCrop(rect: CropRect | null): void {
  resolver?.(rect);
  resolver = null;
  pending = null;
}
