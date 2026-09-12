import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { syncPushToken } from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePostgresChanges } from "@/hooks/usePostgresChanges";
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

  const query = useQuery({
    queryKey: REQUESTS_FOR_SESSION_KEY(sessionId ?? ""),
    queryFn: () => getRequestsForSession(sessionId!),
    enabled: !!sessionId,
    // Sicherheitsnetz gegen verpasste Realtime-Events: Die Anfragen-Liste muss immer
    // aktuell sein, nicht 5 min (Default) dem Cache vertrauen. Verpasst der Websocket
    // ein INSERT (Screen beim Event nicht gemountet / Socket im Hintergrund weg),
    // heilt sonst nichts bis zum App-Kill. staleTime 0 + bedingungsloser Refetch bei
    // Foreground/Mount lädt bei jeder Rückkehr auf den Screen frisch — wie das
    // Session-Detail (refetchOnMount "always", ADR-0018) und der Feed
    // (refetchOnWindowFocus "always"). Deckt NICHT das Draufsitzen ohne Navigation ab.
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
  });

  // Realtime: a new request (or a status change) on this session refetches the
  // list so the creator sees it pop in without a reload. See queries/chat.ts §3.3.
  //
  // Derselbe Hook läuft im Session-Detail UND im angehefteten Anfragen-Block des
  // Chats. Beim Annehmen aus dem Detail wird der Chat OBEN AUF den Stack gelegt —
  // dann sind beide gleichzeitig gemountet; usePostgresChanges hält die beiden
  // Channel-Topics per Instanz-Suffix auseinander.
  usePostgresChanges(sessionId ? `session-requests:${sessionId}` : undefined, [
    {
      event: "*",
      table: "match_requests",
      filter: `session_id=eq.${sessionId}`,
      onEvent: () => {
        queryClient.invalidateQueries({
          queryKey: REQUESTS_FOR_SESSION_KEY(sessionId!),
        });
      },
    },
  ]);

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
  const sorted = [...sessionIds].sort();
  const enabled = sorted.length > 0;

  const query = useQuery({
    queryKey: ["matches", "incoming", "counts", sorted],
    queryFn: () => getPendingCountsForSessions(sorted),
    enabled,
    staleTime: 30_000,
    // Bei Rückkehr aus dem Hintergrund den Badge bedingungslos heilen, statt bis zu
    // 30 s der staleTime zu vertrauen — spiegelt useRequestsForSession/useFeedSessions.
    refetchOnWindowFocus: "always",
  });

  // Eine neue/geänderte Anfrage an einer meiner Sessions aktualisiert die Zähler
  // live — sonst bewegte sich der Chats-Badge erst beim nächsten Tab-Focus. KEIN
  // session_id-Filter nötig: Realtime erzwingt RLS, stellt mir also ohnehin nur
  // Zeilen zu, die ich sehen darf (Anfragen an meine Sessions). Derselbe Hook läuft
  // im Tab-Badge UND im Chats-Screen; usePostgresChanges hält die beiden
  // Channel-Topics per Instanz-Suffix auseinander.
  usePostgresChanges(enabled ? "incoming-counts" : undefined, [
    {
      event: "*",
      table: "match_requests",
      onEvent: () => {
        queryClient.invalidateQueries({
          queryKey: ["matches", "incoming", "counts"],
        });
        // Zweites, unabhängiges Sicherheitsnetz für die Anfragen-LISTE: Dieser
        // unfilterte Channel kommt zuverlässiger an als die gefilterte
        // session-requests-Subscription in useRequestsForSession. Feuert er, ohne
        // dass das gefilterte Event ankam (verpasstes Realtime-Event, Nutzer sitzt
        // ohne Navigation auf dem Chat), heilt diese breite Invalidierung die Liste
        // trotzdem. Präfix ["matches","session"] trifft alle
        // REQUESTS_FOR_SESSION_KEY-Queries; react-query lädt nur die aktiv
        // gemounteten davon wirklich neu. Kein Payload-Filter nötig — RLS stellt
        // ohnehin nur meine Zeilen zu.
        queryClient.invalidateQueries({ queryKey: ["matches", "session"] });
      },
    },
  ]);

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
 * (0018). Bewusst OHNE Realtime: Die Detail-Seite ist ein Snapshot beim Öffnen und
 * soll sich nicht unter den Augen der Betrachter:in verändern (Produktentscheidung,
 * gleiche Linie wie useSession). Frische kommt vom bedingungslosen Mount-Refetch;
 * Kader und „Spots left" laden so immer zusammen — kein Widerspruch zwischen beiden.
 */
export function useSessionClimbers(sessionId: string | undefined) {
  return useQuery({
    queryKey: CLIMBERS_FOR_SESSION_KEY(sessionId ?? ""),
    queryFn: () => getClimbersForSession(sessionId!),
    enabled: !!sessionId,
    // Wie useSession (queries/sessions.ts): bei jedem Öffnen frisch laden — danach
    // steht die Seite, bis sie neu geöffnet oder die App nach vorne geholt wird.
    refetchOnMount: "always",
  });
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
      // Erste Aktion mit klarem Push-Nutzen („wurde ich angenommen?") — hier
      // darf der System-Permission-Prompt kommen (Strategie: lib/notifications.ts).
      void syncPushToken({ askPermission: true });
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
 * Meine eigene Anfrage an EINER Session (oder null) — steuert die Aktionsleiste
 * auf dem Session-Detail („Request sent" / „Leave session"). Bewusst OHNE
 * Realtime: die Detail-Seite ist ein Snapshot beim Öffnen (siehe
 * useSessionClimbers) — eine Annahme zeigt sich hier erst beim nächsten Öffnen.
 * Sofort informieren stattdessen der Push und der Chats-Tab, dessen Zeile per
 * Realtime von Requested nach Joined wandert (useMyParticipations).
 */
export function useMyRequestForSession(
  sessionId: string | undefined,
  enabled = true,
) {
  const { user } = useAuth();
  const userId = user?.id;
  const on = !!sessionId && !!userId && enabled;

  return useQuery({
    queryKey: MY_REQUEST_KEY(sessionId ?? ""),
    queryFn: () => getMyRequestForSession(sessionId!, userId!),
    enabled: on,
    // Wie useSession/useSessionClimbers: bei jedem Öffnen frisch, danach statisch.
    refetchOnMount: "always",
  });
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
 * den Feed-Badge. Kein eigenes Realtime-Abo: Antworten der Ersteller:in erreichen
 * MY_PENDING_KEY über das match_requests-Abo in useMyParticipations
 * (queries/sessions.ts) — der „Requested"-Streifen wandert also live, im selben
 * Moment wie der Kader der Karte. Dazu useCreateMatchRequest.onSuccess (eigene
 * neue Anfrage) plus staleTime/Focus-Refetch als Netz.
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
 * Platz wieder auftaucht (ADR-0006). Wie useMyPendingRequests ohne eigenes Abo,
 * aber live: useMyParticipations (queries/sessions.ts) invalidiert MY_DECLINED_KEY
 * bei jeder Antwort auf meine Anfragen; staleTime/Focus-Refetch bleiben als Netz.
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
