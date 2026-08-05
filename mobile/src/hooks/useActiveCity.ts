import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { supabase } from "@/lib/supabase";

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

const STORAGE_KEY = "bouldersesh.active-city-id";
const ACTIVE_CITY_KEY = ["activeCity"] as const;

// Without a stored city the root navigator would gate on the city picker. New
// installs should land on the feed instead, so the first boot resolves this city
// by name and persists it. The picker stays reachable as a switcher (and as a
// fallback gate if the lookup fails, e.g. offline on first boot).
const DEFAULT_CITY_NAME = "Berlin";

async function readOrDefaultCityId(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  const { data } = await supabase
    .from("cities")
    .select("id")
    .eq("name", DEFAULT_CITY_NAME)
    .maybeSingle();
  if (!data) return null;

  await AsyncStorage.setItem(STORAGE_KEY, data.id);
  return data.id;
}

export function useActiveCity() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ACTIVE_CITY_KEY,
    queryFn: readOrDefaultCityId,
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
