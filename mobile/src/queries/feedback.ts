import { useMutation } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

// Feedback ist eine Einbahnstraße: die App kann nur senden, nie lesen (keine
// select-Policy, Migration 0031). Gelesen wird im Dashboard — deshalb gibt es
// hier keine Query, keinen Cache-Key, nichts zu invalidieren.

export function useSendFeedback() {
  return useMutation({
    mutationFn: async (message: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("feedback").insert({
        user_id: auth.user.id,
        message: message.trim(),
        // Kontext zum Einordnen — darf fehlen, soll das Senden nie verhindern.
        app_version: Constants.expoConfig?.version ?? null,
        platform:
          Platform.OS === "ios" || Platform.OS === "android"
            ? Platform.OS
            : null,
      });
      if (error) throw error;
    },
  });
}
