// Validator für das Tap-Ziel einer Push-Notification.
//
// Der data-Payload einer Remote-Notification ist Fremdeingabe: Er kommt zwar
// normalerweise von unserer send-push Edge Function, aber grundsätzlich von
// jedem, der einen Push an dieses Gerät absetzen kann. Deshalb wird hier per
// Allowlist validiert statt blind ge-pusht: nur die zwei bekannten internen
// Ziele, jeweils mit genau einem UUID-Segment.
//
// Pur gehalten (keine Imports) — testbar über node:test ohne Metro/Expo.

const ALLOWED_ROUTE =
  /^\/(?:chats|sessions)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** data-Payload → interne Route ("/chats/<uuid>" | "/sessions/<uuid>") oder null. */
export function routeFromNotificationData(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const url = (data as { url?: unknown }).url;
  if (typeof url !== "string") return null;
  return ALLOWED_ROUTE.test(url) ? url : null;
}
