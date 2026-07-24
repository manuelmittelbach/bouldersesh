import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { MatchRequest } from "@/types/database";

const REQUESTS_FOR_SESSION_KEY = (sessionId: string) =>
  ["matches", "session", sessionId] as const;
// Meine ausgehenden Anfragen. Alles darunter (…, "session", id / …, "all", uid)
// wird von useCreateMatchRequest.onSuccess über den Prefix mit-invalidiert.
const MY_OUTGOING_KEY = ["matches", "outgoing"] as const;
const MY_REQUEST_KEY = (sessionId: string) =>
  [...MY_OUTGOING_KEY, "session", sessionId] as const;
const MY_PENDING_KEY = (userId: string) =>
  [...MY_OUTGOING_KEY, "all", userId] as const;

/** A match request with the requester's profile joined in. */
export type MatchRequestWithRequester = MatchRequest & {
  requester: {
    id: string;
    display_name: string | null;
    avatar_path: string | null;
    skill_level: string | null;
  } | null;
};

async function getRequestsForSession(
  sessionId: string,
): Promise<MatchRequestWithRequester[]> {
  const { data, error } = await supabase
    .from("match_requests")
    .select(
      `
        *,
        requester:profiles!match_requests_requester_id_fkey ( id, display_name, avatar_path, skill_level )
      `,
    )
    .eq("session_id", sessionId)
    // Zurückgezogene (cancelled) Anfragen verschwinden aus der Ersteller-Liste —
    // die Person hat sich zurückgezogen, das ist kein „Declined" (ADR-0006).
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MatchRequestWithRequester[];
}

export function useRequestsForSession(sessionId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: REQUESTS_FOR_SESSION_KEY(sessionId ?? ""),
    queryFn: () => getRequestsForSession(sessionId!),
    enabled: !!sessionId,
  });

  // Realtime: a new request (or a status change) on this session refetches the
  // list so the creator sees it pop in without a reload. See queries/chat.ts §3.3.
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`session-requests:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_requests",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: REQUESTS_FOR_SESSION_KEY(sessionId),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  return query;
}

export function useCreateMatchRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      // Upsert statt Insert: Habe ich früher zurückgezogen (cancelled), lebt die
      // Zeile wegen unique (session_id, requester_id) noch — ein erneutes Insert
      // liefe in eine Unique-Verletzung. onConflict belebt sie wieder auf
      // „pending" (ADR-0006: Zurückziehen ist umkehrbar). RLS erlaubt beides.
      const { data, error } = await supabase
        .from("match_requests")
        .upsert(
          { session_id: sessionId, requester_id: auth.user.id, status: "pending" },
          { onConflict: "session_id,requester_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (req) => {
      queryClient.invalidateQueries({
        queryKey: REQUESTS_FOR_SESSION_KEY(req.session_id),
      });
      queryClient.invalidateQueries({ queryKey: MY_OUTGOING_KEY });
    },
  });
}

/**
 * Eine eigene offene Anfrage zurückziehen (ADR-0006): setzt sie auf „cancelled".
 * Nützlich, wenn man mehrere Sessions angefragt hat und nur bei einer angenommen
 * wird — von den übrigen tritt man zurück. Die Zeile bleibt (Unique-Constraint);
 * useCreateMatchRequest kann sie später per Upsert wieder auf „pending" heben.
 */
export function useWithdrawRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("match_requests")
        .update({ status: "cancelled" })
        .eq("session_id", sessionId)
        .eq("requester_id", auth.user.id)
        .eq("status", "pending")
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: REQUESTS_FOR_SESSION_KEY(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: MY_OUTGOING_KEY });
    },
  });
}

export function useRespondToMatchRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "accept" | "decline";
    }) => {
      const status = action === "accept" ? "accepted" : "declined";
      const { data, error } = await supabase
        .from("match_requests")
        .update({ status })
        .eq("id", requestId)
        .select()
        .single();
      if (error) throw error;

      // Accepting fires the DB trigger that creates the chat + adds both members
      // (migration 0001). Look it up so the UI can jump straight into it.
      let chatId: string | null = null;
      if (action === "accept") {
        const { data: chat } = await supabase
          .from("chats")
          .select("id")
          .eq("session_id", data.session_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        chatId = chat?.id ?? null;
      }

      return { request: data, chatId };
    },
    onSuccess: ({ request }) => {
      queryClient.invalidateQueries({
        queryKey: REQUESTS_FOR_SESSION_KEY(request.session_id),
      });
      // The session flips to "matched" and a new chat exists — refresh both.
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["chats", "list"] });
    },
  });
}

// ------------------------------------------------------------------
// Requester side — meine eigene Anfrage an einer Session sichtbar machen.
// ------------------------------------------------------------------
// Die Gegenstücke zu useRequestsForSession (Ersteller-Sicht). RLS lässt
// Anfragende ihre eigene Zeile lesen (0002), match_requests liegt schon in der
// Realtime-Publication (0004) — also kein DB-Change nötig. Siehe ADR-0006.

async function getMyRequestForSession(
  sessionId: string,
  userId: string,
): Promise<MatchRequest | null> {
  const { data, error } = await supabase
    .from("match_requests")
    .select("*")
    .eq("session_id", sessionId)
    .eq("requester_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/**
 * Meine eigene Anfrage an EINER Session (oder null) — mit Realtime, damit ein
 * „Request sent" live zu „accepted" umschlägt, wenn die Ersteller:in annimmt,
 * während der Detail-Screen offen ist. Der Realtime-Filter geht über
 * `session_id`; RLS beschränkt die zugestellten Zeilen ohnehin auf meine eigene.
 */
export function useMyRequestForSession(
  sessionId: string | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const on = !!sessionId && !!userId && enabled;

  const query = useQuery({
    queryKey: MY_REQUEST_KEY(sessionId ?? ""),
    queryFn: () => getMyRequestForSession(sessionId!, userId!),
    enabled: on,
  });

  useEffect(() => {
    if (!on) return;
    const channel = supabase
      .channel(`my-request:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_requests",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: MY_REQUEST_KEY(sessionId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [on, sessionId, queryClient]);

  return query;
}

async function getMyPendingSessionIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("match_requests")
    .select("session_id")
    .eq("requester_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.session_id));
}

/**
 * Die Session-IDs, für die ich eine offene (pending) Anfrage habe — als Set für
 * den Feed-Badge. Bewusst OHNE Realtime (ADR-0006): der Feed zeigt nur offene
 * Sessions, eine angenommene Anfrage lässt die Karte ohnehin herausfallen, also
 * ist `pending` der einzige je sichtbare Zustand. Aktualisiert wird über den
 * MY_OUTGOING_KEY-Prefix (useCreateMatchRequest.onSuccess) plus staleTime.
 */
export function useMyPendingRequests() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: MY_PENDING_KEY(userId ?? ""),
    queryFn: () => getMyPendingSessionIds(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
