// Profilbilder: die DB speichert Storage-Pfade, keine URLs (ADR-0003). Die
// öffentliche URL entsteht erst hier — bleibt der Umstieg auf signierte URLs
// eine Änderung an dieser einen Datei.
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import { type CropRect, requestCrop } from '@/lib/cropStore';
import { supabase } from '@/lib/supabase';

export const PROFILE_IMAGES_BUCKET = 'profile-images';

/** Storage-Pfad → öffentlich abrufbare URL. `null` bleibt `null`, damit
 *  Aufrufer den Wert direkt an `Avatar.src` durchreichen können. */
export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Avatar und Galeriefoto sind verschiedene Dinge (CONTEXT.md) und werden
 *  entsprechend verschieden aufbereitet. */
export type ImageKind = 'avatar' | 'gallery';

// Avatar: klein und quadratisch, er erscheint nur beiläufig in Listen.
// Galeriefoto: wird bewusst angesehen, darf also mehr Kante haben.
// Beide sind quadratisch (der Ausschnitt kommt aus dem Crop-Screen); die Form
// unterscheidet nur die Anzeige (runder Avatar, abgerundete Galerie-Kachel).
const MAX_EDGE: Record<ImageKind, number> = { avatar: 512, gallery: 1440 };
const COMPRESS = 0.8;

/** Wird geworfen, wenn die Person die Mediathek nicht freigibt. Eigener Typ,
 *  damit die UI das von einem echten Fehler unterscheiden kann. */
export class MediaLibraryDeniedError extends Error {
  constructor() {
    super('Photo access is off. Enable it in Settings to pick a picture.');
    this.name = 'MediaLibraryDeniedError';
  }
}

/**
 * Mediathek öffnen, Bild zuschneiden/skalieren und als JPEG in den Bucket legen.
 * Gibt den Storage-Pfad zurück — oder `null`, wenn die Auswahl abgebrochen wurde.
 *
 * Skaliert wird clientseitig, weil Supabase Image Transformations Pro-only sind
 * (ADR-0003). Das löst nebenbei, dass iPhones HEIC liefern, der Bucket aber nur
 * `image/jpeg` annimmt.
 */
export async function pickAndUploadProfileImage(
  userId: string,
  kind: ImageKind,
): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new MediaLibraryDeniedError();

  // Kein `allowsEditing`: der eingebaute Editor zeigt eine eckige OS-Crop-UI, die
  // nie zur runden/abgerundeten Endform passt. Wir schneiden im eigenen Screen zu.
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 1,
  });
  if (picked.canceled || !picked.assets?.length) return null;

  const asset = picked.assets[0];

  // Eigener Zuschnitt-Screen: die Maske zeigt exakt die spätere Form (Kreis für
  // Avatar, abgerundetes Quadrat für Galerie). Der Ausschnitt selbst ist quadratisch.
  const cropPromise = requestCrop({
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mask: kind === 'avatar' ? 'circle' : 'rounded',
  });
  router.push('/crop-image');
  const rect = await cropPromise;
  if (!rect) return null; // Zuschnitt abgebrochen

  const processedUri = await processImage(asset.uri, rect, kind);

  // Neuer Zufallsname pro Upload: damit braucht es keinen `?v=`-Cache-Buster,
  // der sich sonst durch jede Komponente ziehen würde (ADR-0003).
  const path = `${userId}/${kind}/${randomFileStem()}.jpg`;
  const bytes = await new File(processedUri).bytes();

  const { error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;

  return path;
}

/**
 * Datei aus dem Bucket entfernen. Schluckt Fehler bewusst: Aufgerufen wird das
 * *nach* dem erfolgreichen DB-Update, um das nun unreferenzierte alte File
 * loszuwerden. Schlägt es fehl, liegt eine Waise im Bucket — ärgerlich, aber
 * kein Grund, der Person einen Fehler zu zeigen, deren Bild längst getauscht ist.
 */
export async function removeProfileImage(path: string | null | undefined): Promise<void> {
  if (!path) return;
  await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([path]);
}

// ------------------------------------------------------------------
// Intern
// ------------------------------------------------------------------

async function processImage(
  uri: string,
  rect: CropRect,
  kind: ImageKind,
): Promise<string> {
  const context = ImageManipulator.manipulate(uri);

  // Genau den im Crop-Screen gewählten (quadratischen) Ausschnitt schneiden.
  context.crop({
    originX: rect.originX,
    originY: rect.originY,
    width: rect.size,
    height: rect.size,
  });

  // Nur verkleinern. Ein kleines Bild hochzurechnen macht es größer, nicht besser.
  const max = MAX_EDGE[kind];
  if (rect.size > max) {
    context.resize({ width: max });
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: COMPRESS });
  return saved.uri;
}

// Zeitstempel + Zufall. Muss nicht kryptografisch sein: der Name ist nur
// innerhalb des eigenen Ordners eindeutig zu halten, und die Storage-Policy
// lässt ohnehin niemanden in einen fremden Ordner schreiben.
function randomFileStem(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
