import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { City } from "@/types/database";

const CITIES_KEY = ["cities"] as const;
const CITY_SESSION_COUNTS_KEY = ["cities", "openSessionCounts"] as const;

async function getCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useCities() {
  return useQuery({
    queryKey: CITIES_KEY,
    queryFn: getCities,
    staleTime: 60 * 60 * 1000, // 1h — cities are curated and almost never change
  });
}

/**
 * Open sessions per city, for the count shown on the city picker.
 *
 * A session's city is always its gym's city — `sessions` deliberately has no city
 * column of its own (see ADR 0002) — so the count goes through the join. Only
 * `gym.city_id` is fetched, not the whole session row; tallying client-side saves a
 * dedicated view/RPC at this data volume.
 *
 * `starts_at >= now` mirrors the feed (`dayRange` fixes its `from` at now for today):
 * a session whose start has passed can't be joined and never shows in the feed, so it
 * must not inflate this count. Without it, a stale `open` session — one whose start
 * time passed but whose status was never advanced — makes a dead city read as active.
 */
async function getOpenSessionCountsByCity(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("sessions")
    .select("gym:gyms!inner ( city_id )")
    .eq("status", "open")
    .gte("starts_at", new Date().toISOString());
  if (error) throw error;

  const rows = (data ?? []) as unknown as { gym: { city_id: string } | null }[];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.gym) continue;
    counts[row.gym.city_id] = (counts[row.gym.city_id] ?? 0) + 1;
  }
  return counts;
}

export function useOpenSessionCountsByCity() {
  return useQuery({
    queryKey: CITY_SESSION_COUNTS_KEY,
    queryFn: getOpenSessionCountsByCity,
    // Shorter than the 5min client default: this number is the whole point of the
    // city picker, and a stale one makes an active city look dead.
    staleTime: 30 * 1000,
  });
}
