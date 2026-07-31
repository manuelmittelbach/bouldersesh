import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

// Blocken ist der persönliche, stille Schutz (Migration 0025) — anders als reports.ts
// (Moderation, wird geprüft) wirkt es SOFORT: beide sehen sich nicht mehr und können
// nicht mehr gemeinsam klettern. Die eigentliche Durchsetzung sitzt in der DB (Guard-
// Trigger + block_profile-RPC); dieser Modul liefert die IDs für den Sicht-Filter und
// die Mutationen für Block/Unblock.

const BLOCKED_PROFILES_KEY = ["blocks", "profiles"] as const;

/** Postgres unique_violation — zweimal blocken ist idempotent, kein Fehler. */
const UNIQUE_VIOLATION = "23505";

/** Die IDs aller Personen, mit denen ich in einer Block-Beziehung stehe — BEIDE
 *  Richtungen zusammengeworfen, ohne zu verraten wer wen. `my_block_ids()` (0025) ist
 *  SECURITY DEFINER, deshalb kommen auch die Blocks fremder Leute GEGEN mich mit,
 *  obwohl die RLS mir nur meine eigenen zeigt. Basis für den symmetrischen Sicht-Filter
 *  in sessions.ts / matches.ts / profiles.ts — die rufen dies direkt in ihrer queryFn
 *  auf (eine kleine RPC pro Query, via Promise.all mit der Hauptabfrage parallelisiert),
 *  statt über einen eigenen Hook zu gehen: so bleibt der Filter an die Query gekoppelt
 *  und aktualisiert mit ihr, ohne extra Cache-Verdrahtung. */
export async function fetchMyBlockIds(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("my_block_ids");
  if (error) throw error;
  return new Set((data as string[] | null) ?? []);
}

/** Ein von mir geblocktes Profil — für die „Blocked climbers"-Liste (nur ausgehende
 *  Blocks, das ist genau, was die Unblock-Verwaltung braucht). */
export type BlockedProfile = {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
};

/** Die Profile, die ICH geblockt habe (RLS lässt nur die eigenen Zeilen lesen). */
export function useBlockedProfiles() {
  return useQuery({
    queryKey: BLOCKED_PROFILES_KEY,
    queryFn: async (): Promise<BlockedProfile[]> => {
      const { data, error } = await supabase
        .from("profile_blocks")
        .select(
          `blocked:profiles!profile_blocks_blocked_id_fkey ( id, display_name, avatar_path )`,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Cast über unknown: die handgeschriebenen DB-Typen kennen die FK-Relation nicht
      // (Relationships: []), der Embed-Name ist aber der Postgres-Default und greift zur
      // Laufzeit. Regeneriert man die Typen, fällt der Cast weg.
      return ((data ?? []) as unknown as { blocked: BlockedProfile | null }[])
        .map((row) => row.blocked)
        .filter((p): p is BlockedProfile => p != null);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Nach Block/Unblock verschiebt sich fast alles: Feed, Session-Detail, Roster,
 *  Anfragen, Profile — plus die Block-Listen selbst. Breit invalidieren. */
function invalidateBlockDependents(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: ["blocks"] });
  queryClient.invalidateQueries({ queryKey: ["sessions"] });
  queryClient.invalidateQueries({ queryKey: ["matches"] });
  queryClient.invalidateQueries({ queryKey: ["chats"] });
  queryClient.invalidateQueries({ queryKey: ["profiles"] });
}

export function useBlockProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ blockedId }: { blockedId: string }) => {
      // block_profile (0025) legt den Block an UND kappt bestehenden Kontakt
      // (Anfragen, gemeinsame Chats) in einer Transaktion.
      const { error } = await supabase.rpc("block_profile", {
        p_blocked_id: blockedId,
      });
      if (error && error.code !== UNIQUE_VIOLATION) throw error;
      return blockedId;
    },
    onSuccess: () => {
      invalidateBlockDependents(queryClient);
    },
  });
}

export function useUnblockProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ blockedId }: { blockedId: string }) => {
      const { error } = await supabase.rpc("unblock_profile", {
        p_blocked_id: blockedId,
      });
      if (error) throw error;
      return blockedId;
    },
    onSuccess: () => {
      invalidateBlockDependents(queryClient);
    },
  });
}
