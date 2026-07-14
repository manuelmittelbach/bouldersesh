import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Gym } from "@/types/database";

const GYMS_KEY = ["gyms"] as const;

async function getGyms(): Promise<Gym[]> {
  const { data, error } = await supabase
    .from("gyms")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useGyms() {
  return useQuery({
    queryKey: GYMS_KEY,
    queryFn: getGyms,
    staleTime: 60 * 60 * 1000, // 1h — gyms rarely change
  });
}
