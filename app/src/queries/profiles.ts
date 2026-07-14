import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

const PROFILE_KEY = (id: string) => ["profiles", id] as const;

async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: PROFILE_KEY(id ?? ""),
    queryFn: () => getProfile(id!),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Profile> & { id: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(input)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_KEY(data.id), data);
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });
}
