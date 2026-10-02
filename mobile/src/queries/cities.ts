import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { City } from "@/types/database";

const CITIES_KEY = ["cities"] as const;

async function getCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    // Launch scoping: only cities flagged live are shown (Berlin first, Munich
    // stays hidden until `enabled` is flipped server-side). See migration 0034.
    .eq("enabled", true)
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
