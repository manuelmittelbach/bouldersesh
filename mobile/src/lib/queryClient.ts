import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

// React Native kennt kein "window focus" — TanStack Query erfährt vom App-Foreground
// nur, wenn wir den focusManager selbst an AppState koppeln (gleiches Muster wie der
// Auth-Auto-Refresh in lib/supabase.ts). Auf Web übernimmt der eingebaute
// visibilitychange-Listener; dort nicht reinfunken.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    focusManager.setFocused(state === "active");
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Bar-happenings default — sessions don't change second-by-second.
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      // App kommt aus dem Hintergrund → alle aktiven Queries, deren staleTime
      // abgelaufen ist, laden neu. Heilt so auch Realtime-Events, die der Websocket
      // im Hintergrund verpasst hat — allerdings erst, sobald die jeweilige Query
      // stale ist, nicht sofort. useFocusEffect (Tab-Wechsel) deckt das NICHT ab —
      // Navigation-Focus feuert bei App-Foreground nicht.
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
