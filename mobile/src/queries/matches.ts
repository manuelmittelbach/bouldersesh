import { useEffect, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { MatchRequest } from "@/types/database";

import { fetchMyBlockIds } from "./blocks";

const REQUESTS_FOR_SESSION_KEY = (sessionId: string) =>
  ["matches", "session", sessionId] as const;
// Meine ausgehenden Anfragen. Alles darunter (…, "session", id / …, "all", uid)
// wird von useCreateMatchRequest.onSuccess über den Prefix mit-invalidiert.
const MY_OUTGOING_KEY = ["matches", "outgoing"] as const;
const MY_REQUEST_KEY = (sessionId: string) =>
  [...MY_OUTGOING_KEY, "session", sessionId] as const;
const MY_PENDING_KEY = (userId: string) =>
  [...MY_OUTGOING_KEY, "all", userId] as const;
const MY_DECLINED_KEY = (userId: string) =>
  [...MY_OUTGOING_KEY, "declined", userId] as const;
const MY_ACCEPTED_KEY = (userId: string) =>
  [...MY_OUTGOING_KEY, "accepted", userId] as const;

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
  // Geblockte Anfragende ausblenden. block_profile lehnt ihre Anfrage an meine Session
  // ohnehin schon ab; dies fängt den Übergang read-side ab, damit kein geblockter Name
  // in der Anfragen-Liste stehen bleibt.
  const blocked = await fetchMyBlockIds();
  return ((data ?? []) as unknown as MatchRequestWithRequester[]).filter(
    (r) => !r.requester || !blocked.has(r.requester.id),
  );
}

export function useRequestsForSession(sessionId: string | undefined) {
  const queryClient = useQueryClient();
  // Eindeutig pro Hook-Instanz: derselbe Hook läuft im Session-Detail UND im
  // angehefteten Anfragen-Block des Chats. Beim Annehmen aus dem Detail wird der Chat
  // OBEN AUF den Stack gelegt — dann sind beide gleichzeitig gemountet. Zwei Kanäle mit
  // demselben Topic kollidieren in supabase-js („postgres_changes after subscribe"),
  // der useId-Suffix hält sie auseinander (siehe queries/chat.ts).
  const channelId = useId();

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
      .channel(`session-requests:${sessionId}:${channelId}`)
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
  }, [sessionId, channelId, queryClient]);

  return query;
}

async function getPendingCountsForSessions(
  sessionIds: string[],
): Promise<Record<string, number>> {
  if (sessionIds.length === 0) return {};
  const { data, error } = await supabase
    .from("match_requests")
    .select("session_id")
    .in("session_id", sessionIds)
    .eq("status", "pending");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of data ?? []) {
    counts[r.session_id] = (counts[r.session_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Wie viele offene (pending) Anfragen jede meiner Sessions hat — der „N requests"-
 * Streifen an den eigenen Session-Karten (Profil-Tab). RLS lässt Ersteller:innen die
 * Anfragen an ihren Sessions lesen (dieselbe Sicht wie useRequestsForSession). Der
 * Key sortiert die IDs, damit er stabil bleibt, solange sich die Session-Menge nicht
 * ändert. Realtime hält den Zähler live — er speist den Chats-Tab-Badge, der auf
 * jedem Tab stimmen soll (nicht erst beim nächsten Focus-Refetch).
 */
export function usePendingCountsForSessions(sessionIds: string[]) {
  const queryClient = useQueryClient();
  const channelId = useId();
  const sorted = [...sessionIds].sort();
  const enabled = sorted.length > 0;

  const query = useQuery({
    queryKey: ["matches", "incoming", "counts", sorted],
    queryFn: () => getPendingCountsForSessions(sorted),
    enabled,
    staleTime: 30_000,
  });

  // Eine neue/geänderte Anfrage an einer meiner Sessions aktualisiert die Zähler
  // live — sonst bewegte sich der Chats-Badge erst beim nächsten Tab-Focus. KEIN
  // session_id-Filter nötig: Realtime erzwingt RLS, stellt mir also ohnehin nur
  // Zeilen zu, die ich sehen darf (Anfragen an meine Sessions). channelId (useId)
  // hält den Topic pro Hook-Instanz eindeutig — derselbe Hook läuft im Tab-Badge
  // UND im Chats-Screen; zwei Kanäle mit gleichem Topic würden in supabase-js
  // kollidieren (siehe queries/chat.ts).
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`incoming-counts:${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_requests" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["matches", "incoming", "counts"],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, channelId, queryClient]);

  return query;
}

const CLIMBERS_FOR_SESSION_KEY = (sessionId: string) =>
  ["matches", "climbers", sessionId] as const;

async function getClimbersForSession(
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
    // Nur der bestätigte Kader: die „Climbers"-Liste zeigt, wer dabei IST, nicht wer
    // fragt. Seit 0018 lässt RLS diese Zeilen auch Außenstehende lesen (öffentliche
    // Session, status='accepted') — genau der Blick, für den die Liste gedacht ist.
    .eq("status", "accepted")
    // Aufsteigend: frühe Zusagen zuerst — die Liste liest sich wie eine Beitrittsreihe.
    .order("created_at", { ascending: true });
  if (error) throw error;
  // Geblockte aus dem öffentlichen Kader ausblenden (beide Richtungen, siehe blocks.ts).
  const blocked = await fetchMyBlockIds();
  return ((data ?? []) as unknown as MatchRequestWithRequester[]).filter(
    (r) => !r.requester || !blocked.has(r.requester.id),
  );
}

/**
 * Wer einer Session bereits beigetreten ist (accepted) — die „Climbers"-Liste auf
 * dem Session-Detail (ADR-0009). Anders als useRequestsForSession (Ersteller-Sicht,
 * alle Status) ist das die öffentliche Kader-Sicht: nur accepted, für jede:n lesbar
 * (0018). Realtime hält sie live: Das WACHSEN (jemand wird angenommen) sieht jede:r,
 * die neue Zeile ist `accepted` und damit sichtbar. Das SCHRUMPFEN (jemand verlässt
 * → `cancelled`, 0016) sieht nur Ersteller:in/Mitglieder live — für Außenstehende ist
 * die neue `cancelled`-Zeile unsichtbar (0018), und Realtime prüft RLS auf der neuen
 * Zeile, stellt das Event also nicht zu; sie ziehen beim nächsten Refetch (Focus/
 * Remount) nach. Bewusst in Kauf genommen (ADR-0009): geringe, selbstheilende
 * Staleness. Der useId-Suffix hält den Kanal-Topic pro Hook-Instanz eindeutig (sonst
 * Kollision in supabase-js, siehe queries/chat.ts).
 */
export function useSessionClimbers(sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const channelId = useId();

  const query = useQuery({
    queryKey: CLIMBERS_FOR_SESSION_KEY(sessionId ?? ""),
    queryFn: () => getClimbersForSession(sessionId!),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`session-climbers:${sessionId}:${channelId}`)
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
            queryKey: CLIMBERS_FOR_SESSION_KEY(sessionId),
          });
          // Roster und „Spots left" sind zwei Sichten auf dieselben accepted-Zeilen —
          // die Sessions mit-invalidieren, damit beide zusammen wandern statt sich zu
          // widersprechen. Breiter `["sessions"]`-Prefix wie die Mutations-Hooks
          // (useRespondToMatchRequest): trifft neben dem Detail (SESSION_KEY) auch den
          // Feed-Count (["sessions","open"]), der denselben belegten Platz zeigt.
          queryClient.invalidateQueries({ queryKey: ["sessions"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, channelId, queryClient]);

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
      // Der Chats-Tab baut „Requested Sessions" aus useMyParticipations — ohne dies
      // bliebe die zurückgezogene Zeile bis zum nächsten Focus-Refetch stehen.
      queryClient.invalidateQueries({ queryKey: ["sessions", "participations"] });
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
      // Die angenommene/abgelehnte Anfrage ist nicht mehr „pending" — den Zähler neu
      // laden, sonst bliebe der Chats-Tab-Badge (und der orange Punkt an der Zeile)
      // bis zum staleTime/Realtime-Zufall auf dem alten Stand stehen.
      queryClient.invalidateQueries({ queryKey: ["matches", "incoming", "counts"] });
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

async function getMyAcceptedSessionIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("match_requests")
    .select("session_id")
    .eq("requester_id", userId)
    .eq("status", "accepted");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.session_id));
}

/**
 * Die Session-IDs, in die ich als Anfragende:r aufgenommen wurde (accepted) — als Set
 * für den „Joined"-Streifen im Feed (ADR-0010). Wie useMyPendingRequests bewusst OHNE Realtime:
 * der Feed zeigt nur offene Sessions; eine Gruppen-Session bleibt nach meiner Aufnahme
 * nur `open`, solange noch ein Platz frei ist (kippt sonst auf `matched` und fällt raus,
 * Trigger handle_match_accepted/0014) — der einzige je sichtbare Fall. Aktualisierung
 * über den MY_OUTGOING_KEY-Prefix plus staleTime plus Focus-Refetch im Feed; Respond/
 * Leave invalidieren breiter (`["sessions"]`/`["matches"]`) und ziehen mit.
 */
export function useMyAcceptedRequests() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: MY_ACCEPTED_KEY(userId ?? ""),
    queryFn: () => getMyAcceptedSessionIds(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

async function getMyDeclinedSessionIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("match_requests")
    .select("session_id")
    .eq("requester_id", userId)
    .eq("status", "declined");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.session_id));
}

/**
 * Die Session-IDs, aus denen mich die Ersteller:in abgelehnt hat (declined) — der
 * Feed blendet diese Sessions für mich aus, damit eine Absage nicht als offener
 * Platz wieder auftaucht (ADR-0006). Wie useMyPendingRequests bewusst OHNE Realtime:
 * die Ablehnung erfährt man beim Öffnen der Session bzw. im Chats-Tab, der Feed lädt
 * beim Zurückkehren per Focus-Refetch neu (siehe (tabs)/index.tsx). Aktualisierung
 * sonst über den MY_OUTGOING_KEY-Prefix plus staleTime.
 */
export function useMyDeclinedRequests() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: MY_DECLINED_KEY(userId ?? ""),
    queryFn: () => getMyDeclinedSessionIds(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
