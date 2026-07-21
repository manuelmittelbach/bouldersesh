import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Gym, GymAccess } from "@/types/database";

const GYMS_KEY = (cityId: string | null) => ["gyms", cityId] as const;

/** A gym with its city joined in — every gym sits in exactly one. */
export type GymWithCity = Gym & { city: { id: string; name: string } | null };

/**
 * Label für zugangsbeschränkte Hallen. Die Halle bleibt wählbar — der Hinweis soll
 * nur verhindern, dass sich jemand zu einer Session verabredet, zu der er keinen
 * Zutritt hat.
 */
export const GYM_ACCESS_LABEL: Record<GymAccess, string> = {
  members_only: "Members only",
  students_only: "Students only",
};

async function getGyms(cityId: string | null): Promise<GymWithCity[]> {
  let query = supabase
    .from("gyms")
    .select("*, city:cities ( id, name )")
    // Geschlossene Hallen werden nicht gelöscht (an ihnen hängen Sessions), sondern
    // auf `active = false` gesetzt — sie sollen nur nicht mehr wählbar sein.
    .eq("active", true)
    .order("name", { ascending: true });

  if (cityId) query = query.eq("city_id", cityId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as GymWithCity[];
}

/**
 * Gyms — all of them without `cityId`, only that city's with one.
 *
 * The create flow filters by the picked city; the home-gym picker in the profile
 * deliberately does NOT — the home gym is independent of the active city (CONTEXT.md).
 */
export function useGyms(cityId: string | null = null) {
  return useQuery({
    queryKey: GYMS_KEY(cityId),
    queryFn: () => getGyms(cityId),
    staleTime: 60 * 60 * 1000, // 1h — gyms rarely change
  });
}
