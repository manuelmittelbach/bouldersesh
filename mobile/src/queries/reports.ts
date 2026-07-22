import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

// Eine Meldung entfernt nichts — sie legt einen Vorgang an, über den ein Mensch
// entscheidet (CONTEXT.md). Kein Auto-Filter, keine Sichtbarkeitsfolge in der App.

const REPORTED_KEY = (reportedId: string) =>
  ["reports", "mine", reportedId] as const;

/** Postgres unique_violation. Der Constraint `unique (reporter_id, reported_id)`
 *  aus 0009 lässt genau eine Meldung pro Paar zu — ein zweiter Versuch ist
 *  deshalb kein Fehler, sondern schon erledigt. */
const UNIQUE_VIOLATION = "23505";

/** Habe *ich* dieses Profil schon gemeldet? Die RLS lässt nur eigene Meldungen
 *  lesen, die Frage ist also gar nicht anders zu stellen. */
export function useHasReported(reportedId: string | undefined) {
  return useQuery({
    queryKey: REPORTED_KEY(reportedId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_reports")
        .select("id")
        .eq("reported_id", reportedId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!reportedId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReportProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportedId,
      reason,
    }: {
      reportedId: string;
      reason?: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profile_reports").insert({
        reporter_id: auth.user.id,
        reported_id: reportedId,
        reason: reason?.trim() || null,
      });
      // Schon gemeldet heißt: der Hinweis liegt vor. Der Person einen Fehler zu
      // zeigen, würde sie glauben lassen, das Melden funktioniere nicht.
      if (error && error.code !== UNIQUE_VIOLATION) throw error;
      return reportedId;
    },
    onSuccess: (reportedId) => {
      queryClient.setQueryData(REPORTED_KEY(reportedId), true);
    },
  });
}
