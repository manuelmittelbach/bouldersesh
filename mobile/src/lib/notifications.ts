// Push-Token-Lebenszyklus (Gegenstück zur send-push Edge Function + Migration 0028).
//
// Permission-Strategie (Abstimmung 2026-08-05): Der System-Prompt kommt NICHT
// beim App-Start, sondern bei der ersten Aktion, für die Pushes echten Nutzen
// haben — Session erstellen oder Join-Request schicken (askPermission: true).
// Ist die Permission einmal erteilt, hält ein stiller Sync bei jedem App-Start
// (askPermission: false, via usePushNotifications) den Token in der DB frisch.

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

/**
 * Foreground-Verhalten: Banner + Notification-Center, aber ohne Sound und ohne
 * Badge — wer die App offen hat, sieht Neues ohnehin per Realtime.
 * Einmal beim App-Start aufrufen (Root-Layout, Modulebene).
 */
export function setupNotificationHandling(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Muss vor getExpoPushTokenAsync existieren (Android-13-Vorgabe der Expo-Docs).
// Die Edge Function adressiert Pushes an genau diesen Kanal (channelId "default",
// deckungsgleich mit defaultChannel im app.json-Plugin).
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
  });
}

function easProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId;
}

/**
 * Token holen und per register_push_token-RPC (0028) in die DB schreiben.
 * Der RPC statt Upsert, weil ein Token den Besitzer wechseln kann — siehe
 * Migration. Fehler sind bewusst nicht fatal: Ohne Netz oder ohne Permission
 * gibt es schlicht (noch) keine Pushes, die App läuft normal weiter.
 *
 * askPermission=true nur aus Nutzeraktionen heraus — löst ggf. den
 * System-Prompt aus. askPermission=false registriert nur, wenn die
 * Permission schon erteilt ist (stiller Start-Sync).
 */
export async function syncPushToken({
  askPermission,
}: {
  askPermission: boolean;
}): Promise<void> {
  try {
    // Remote-Push gibt es nur auf echten Geräten — im Simulator scheitert
    // getExpoPushTokenAsync, also gar nicht erst anfangen.
    if (!Device.isDevice) return;

    await ensureAndroidChannel();

    let { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      if (!askPermission || !canAskAgain) return;
      ({ status } = await Notifications.requestPermissionsAsync());
      if (status !== "granted") return;
    }

    const projectId = easProjectId();
    if (!projectId) return;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    const { error } = await supabase.rpc("register_push_token", {
      p_token: token.data,
      p_platform: Platform.OS === "ios" ? "ios" : "android",
    });
    if (error) throw error;
  } catch (e) {
    console.warn("Push token sync failed", e);
  }
}

/**
 * Token dieses Geräts aus der DB nehmen — VOR supabase.auth.signOut() rufen,
 * das Delete braucht die noch aktive Session (RLS „delete own", 0028). Geht es
 * schief (offline), übernimmt der nächste Login per register_push_token die
 * Zeile ohnehin für den neuen Account.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    const projectId = easProjectId();
    if (!projectId) return;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from("push_tokens").delete().eq("token", token.data);
  } catch (e) {
    console.warn("Push token unregister failed", e);
  }
}
