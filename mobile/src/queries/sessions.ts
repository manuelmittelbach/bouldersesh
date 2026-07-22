import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Session } from "@/types/database";

const OPEN_SESSIONS_KEY = (params: OpenSessionsParams) =>
  ["sessions", "open", params] as const;
const SESSION_KEY = (id: string) => ["sessions", id] as const;

export type OpenSessionsParams = {
  /** The feed's city context. Filters through the gym — sessions carry no city. */
  city_id?: string;
  gym_id?: string;
  from?: string; // ISO timestamp
  to?: string; // ISO timestamp
};

/** A session row with the creator profile and gym joined in. Used for the feed. */
export type SessionWithMeta = Session & {
  creator: {
    id: string;
    display_name: string | null;
    avatar_path: string | null;
    // Wird nur im Session-Detail gezeigt, nicht im Feed — Galeriefotos tauchen
    // nirgends beiläufig auf (CONTEXT.md). Der Feed schleppt die Pfade mit,
    // was billiger ist als ein zweiter Query beim Öffnen.
    gallery_paths: string[] | null;
    skill_level: string | null;
  } | null;
  gym: {
    id: string;
    name: string;
    city_id: string;
    city: { id: string; name: string } | null;
  } | null;
};

// `!inner` rather than a left join: it's the only way to filter on the gym via
// `.eq("gym.city_id", …)`. There are no sessions without a gym (gym_id is NOT NULL),
// so the result set is unchanged.
const SESSION_SELECT = `
  *,
  creator:profiles!sessions_creator_id_fkey ( id, display_name, avatar_path, gallery_paths, skill_level ),
  gym:gyms!inner ( id, name, city_id, city:cities ( id, name ) )
`;

async function getOpenSessions(
  params: OpenSessionsParams,
): Promise<SessionWithMeta[]> {
  let query = supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("status", "open")
    .order("starts_at", { ascending: true });

  if (params.city_id) query = query.eq("gym.city_id", params.city_id);
  if (params.gym_id) query = query.eq("gym_id", params.gym_id);
  if (params.from) query = query.gte("starts_at", params.from);
  if (params.to) query = query.lte("starts_at", params.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as SessionWithMeta[];
}

export function useOpenSessions(params: OpenSessionsParams = {}) {
  return useQuery({
    queryKey: OPEN_SESSIONS_KEY(params),
    queryFn: () => getOpenSessions(params),
  });
}

async function getSession(id: string): Promise<SessionWithMeta | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as SessionWithMeta | null;
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: SESSION_KEY(id ?? ""),
    queryFn: () => getSession(id!),
    enabled: !!id,
  });
}

export type CreateSessionInput = {
  gym_id: string;
  starts_at: string;
  ends_at?: string | null;
  level: string;
  note?: string | null;
  max_buddies?: number;
  visibility?: "public" | "friends";
};

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("sessions")
        .insert({ ...input, creator_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", "open"] });
      // The city picker shows "N open sessions" — otherwise the number would lag.
      queryClient.invalidateQueries({ queryKey: ["cities", "openSessionCounts"] });
    },
  });
}
