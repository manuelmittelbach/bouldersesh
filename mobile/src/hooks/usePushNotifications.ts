// Push-Verkabelung fürs Root-Layout: stiller Token-Sync + Tap-Routing.
//
// `enabled` = alle Navigations-Gates offen (Session, Name, Stadt). Vorher weder
// synchen (kein User → RPC liefe ins Leere) noch navigieren (die Zielscreens
// existieren hinter den Gates noch gar nicht). Kommt der Tap aus dem Kaltstart,
// wartet useLastNotificationResponse einfach: Der Effekt feuert erneut, sobald
// enabled auf true kippt, und navigiert dann.

import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";
import { useEffect } from "react";

import { routeFromNotificationData } from "@/domain/notificationRoute";
import { syncPushToken } from "@/lib/notifications";

export function usePushNotifications({ enabled }: { enabled: boolean }): void {
  const queryClient = useQueryClient();
  // Stiller Sync: Nur registrieren, wenn die Permission schon erteilt wurde —
  // der System-Prompt gehört zu den Nutzeraktionen (lib/notifications.ts).
  useEffect(() => {
    if (!enabled) return;
    void syncPushToken({ askPermission: false });
  }, [enabled]);

  // Deckt Kaltstart UND laufende App ab — der Hook re-rendert bei jedem Tap.
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!enabled || !lastResponse) return;
    const route = routeFromNotificationData(
      lastResponse.notification.request.content.data,
    );
    // Sofort quittieren, sonst navigiert derselbe Tap nach jedem Gate-Flackern
    // (z. B. Logout → Login) erneut.
    void Notifications.clearLastNotificationResponseAsync();
    if (route) {
      // Ein Push-Tap IST die Server-Ansage „dein Stand ist veraltet" — der Cache
      // weiß davon nichts: Das zugehörige Realtime-Event ist im Hintergrund
      // verpufft (kein Replay), und die staleTime ist ggf. noch nicht abgelaufen.
      // Ohne dies öffnete der Tap einen Chat OHNE die System-Zeile, die der Push
      // gerade zitiert hat (bzw. ein Detail mit alter Zeit/Halle). Also vor dem
      // Navigieren die betroffenen Bereiche stale markieren — der Zielscreen
      // mountet gleich danach und fetcht dann garantiert frisch. Breite Präfixe
      // wie nach Mutationen (queries/blocks.ts): Push-Taps sind selten genug.
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      router.push(route as Href);
    }
  }, [enabled, lastResponse, queryClient]);
}
