import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * The active city — the context the discover feed shows sessions in.
 *
 * Deliberately a DEVICE preference, not a profile attribute: it is not synced with
 * the account. The gym is chosen per session, not stored on the profile. See CONTEXT.md
 * ("Aktive Stadt") and docs/adr/0002-stadt-als-eigene-entitaet.md.
 *
 * Stored in AsyncStorage but mirrored through TanStack Query, following the useAuth
 * pattern: one setter, and every consumer re-renders.
 */

const STORAGE_KEY = "boulder-buddy.active-city-id";
const ACTIVE_CITY_KEY = ["activeCity"] as const;

export function useActiveCity() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ACTIVE_CITY_KEY,
    queryFn: async () => (await AsyncStorage.getItem(STORAGE_KEY)) ?? null,
    staleTime: Infinity,
  });

  const setActiveCity = useCallback(
    async (cityId: string | null) => {
      if (cityId) await AsyncStorage.setItem(STORAGE_KEY, cityId);
      else await AsyncStorage.removeItem(STORAGE_KEY);
      queryClient.setQueryData(ACTIVE_CITY_KEY, cityId);
    },
    [queryClient],
  );

  return {
    cityId: query.data ?? null,
    // Separates "not read from storage yet" from "no city picked" — otherwise the
    // city picker flashes on a cold start even though a city is stored.
    isLoading: query.isLoading,
    setActiveCity,
  };
}
