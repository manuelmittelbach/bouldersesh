import { useEffect, useId } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Session } from "@/types/database";

// Der Feed lädt nicht mehr nur offene Sessions, sondern auch volle (`matched`) des
// Tages (ADR-0011) — daher `feed`- statt `open`-Semantik im Symbolnamen. Der Cache-Key-
// WERT bleibt aber bewusst `["sessions", "open", …]`: bestehende Invalidierungen
// (useCreateSession mit `["sessions","open"]`, der breite `["sessions"]`-Prefix in
// matches.ts / leave / delete / respond) treffen ihn nur so weiter. Nur die Symbole
// umbenannt, nicht das Key-Array.
const FEED_SESSIONS_KEY = (params: FeedSessionsParams) =>
  ["sessions", "open", params] as const;
export const SESSION_KEY = (id: string) => ["sessions", id] as const;
const MY_SESSIONS_KEY = (userId: string) =>
  ["sessions", "mine", userId] as const;
const MY_PARTICIPATIONS_KEY = (userId: string) =>
  ["sessions", "participations", userId] as const;

// Der Chat einer Session bleibt bis 24h NACH `starts_at` erreichbar (damit man
// während UND kurz nach dem Bouldern noch tippen kann), danach räumt ihn ein
// pg_cron-Job in der DB weg (Migration 0019). Damit UI-Sichtbarkeit und DB-Löschung
// dieselbe Grenze teilen, filtern die Chat-getriebenen Listen (Hosting/Joined + Badge)
// auf `starts_at >= now - 24h` statt `>= now`. Die Grenze lebt in der queryFn (nicht
// im Key) → stabiler Key, kein Refetch-Sturm; Aktualisierung per Focus-Refetch.
const CHAT_RETENTION_MS = 24 * 60 * 60 * 1000;
const chatRetentionCutoff = () =>
  new Date(Date.now() - CHAT_RETENTION_MS).toISOString();

// Unbeantwortete (pending) Anfragen haben keinen Chat und nach dem Termin nichts mehr
// zu planen — sie verschwinden schon 1h nach `starts_at` aus der Requested-Sektion,
// statt die vollen 24h (Chat-Fenster) zu liegen. Der pg_cron-Job 0020 löscht sie
// DB-seitig; dieser Filter spiegelt die Grenze read-side, damit die Anfrage sofort am
// 1h-Punkt aus der Liste fällt. (Das Gegenstück für nie-bespielte eigene Sessions lebt
// in chats.tsx, weil es den Chat-Verlauf kennen muss — siehe dort.)
const REQUEST_RETENTION_MS = 60 * 60 * 1000;
const requestRetentionCutoff = () =>
  new Date(Date.now() - REQUEST_RETENTION_MS).toISOString();

export type FeedSessionsParams = {
  /** The feed's city context. Filters through the gym — sessions carry no city. */
  city_id?: string;
  gym_id?: string;
  from?: string; // ISO timestamp
  to?: string; // ISO timestamp
};

/** Ein angenommenes Mitglied (ohne Ersteller:in) — nur was der Avatar-Stack braucht. */
export type SessionClimber = {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
};

/** A session row with the creator profile and gym joined in. Used for the feed. */
export type SessionWithMeta = Session & {
  creator: {
    id: string;
    display_name: string | null;
    avatar_path: string | null;
    skill_level: string | null;
  } | null;
  gym: {
    id: string;
    name: string;
    city_id: string;
    city: { id: string; name: string } | null;
  } | null;
  /**
   * Profile der ANGENOMMENEN Mitkletternden (OHNE Ersteller:in) — für den Avatar-Stack
   * auf der Feed-Karte. Kommt als eingebetteter, auf `status='accepted'` gefilterter
   * Zeilen-Embed (RLS 0018 gibt die accepted-Zeilen auch Außenstehenden frei).
   */
  climbers: SessionClimber[];
  /**
   * Zahl der ANGENOMMENEN Anfragen = `climbers.length`. Belegte Plätze = 1 (Ersteller:in)
   * + diese Zahl; freie Plätze = capacity − belegt (ADR-0007).
   */
  accepted_count: number;
};

// `!inner` rather than a left join: it's the only way to filter on the gym via
// `.eq("gym.city_id", …)`. There are no sessions without a gym (gym_id is NOT NULL),
// so the result set is unchanged.
//
// `climbers:match_requests ( requester:profiles(…) )` bettet die angenommenen Mitglieder
// als Zeilen ein (nicht mehr nur als `count`) — daraus zieht der Feed den Avatar-Stack UND
// den `accepted_count` (= Länge). Der Status-Filter steht am Query
// (`.eq("climbers.status","accepted")`), damit derselbe SELECT für Feed und Detail gilt.
// To-many-Filter lassen Eltern mit 0 Treffern stehen — teilbesetzte und leere Sessions
// bleiben im Feed (genau gewollt). RLS 0018 gibt die accepted-Requester auch Außenstehenden
// frei, sonst sähe der Feed fremde Kader nicht.
const SESSION_SELECT = `
  *,
  creator:profiles!sessions_creator_id_fkey ( id, display_name, avatar_path, skill_level ),
  gym:gyms!inner ( id, name, city_id, city:cities ( id, name ) ),
  climbers:match_requests ( requester:profiles!match_requests_requester_id_fkey ( id, display_name, avatar_path ) )
`;

/** Den `climbers`-Embed zu einer flachen Profilliste + `accepted_count` normalisieren. */
function withClimbers(row: unknown): SessionWithMeta {
  const { climbers, ...rest } = row as Record<string, unknown> & {
    climbers?: { requester: SessionClimber | null }[];
  };
  const list = (climbers ?? [])
    .map((c) => c.requester)
    .filter((r): r is SessionClimber => r != null);
  return {
    ...(rest as unknown as SessionWithMeta),
    climbers: list,
    accepted_count: list.length,
  };
}

async function getFeedSessions(
  params: FeedSessionsParams,
): Promise<SessionWithMeta[]> {
  let query = supabase
    .from("sessions")
    .select(SESSION_SELECT)
    // Joinbare (`open`) UND volle (`matched`) Sessions des Tages — volle bleiben als
    // gedimmter „Full"-Beleg im Feed (ADR-0011). `done`/`cancelled` bleiben draußen.
    .in("status", ["open", "matched"])
    .eq("climbers.status", "accepted")
    .order("starts_at", { ascending: true });

  if (params.city_id) query = query.eq("gym.city_id", params.city_id);
  if (params.gym_id) query = query.eq("gym_id", params.gym_id);
  if (params.from) query = query.gte("starts_at", params.from);
  if (params.to) query = query.lte("starts_at", params.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(withClimbers);
}

export function useFeedSessions(params: FeedSessionsParams = {}) {
  return useQuery({
    queryKey: FEED_SESSIONS_KEY(params),
    queryFn: () => getFeedSessions(params),
    // Beim Wechsel von Halle/Tag ändert sich der QueryKey. Ohne dies würde ein noch
    // nicht gecachter Key `data` kurz auf undefined setzen → `isLoading` true → der
    // Feed samt Hallen-Filterleiste flackert als Voll-Screen-Spinner weg (und die
    // horizontale Leiste springt beim Remount nach links). keepPreviousData hält die
    // alten Daten sichtbar, bis die neuen da sind — sanfter Übergang statt Reload.
    placeholderData: keepPreviousData,
  });
}

async function getSession(id: string): Promise<SessionWithMeta | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("id", id)
    .eq("climbers.status", "accepted")
    .maybeSingle();
  if (error) throw error;
  return data ? withClimbers(data) : null;
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: SESSION_KEY(id ?? ""),
    queryFn: () => getSession(id!),
    enabled: !!id,
  });
}

// Meine eigenen kommenden Sessions — der „Your sessions"-Abschnitt am Profil-Tab.
// Bewusst `open` UND `matched`: sobald jemand annimmt, kippt die Session per Trigger
// auf `matched` und fällt aus dem Feed (der filtert `open`) — dann ist diese Liste
// der einzige Ort, an dem die Ersteller:in sie noch wiederfindet. Sichtbar bis 24h
// nach `starts_at` (Chat-Fenster, siehe CHAT_RETENTION_MS), danach verschwindet die
// Zeile und der pg_cron-Job (0019) löscht den Chat.
async function getMySessions(userId: string): Promise<SessionWithMeta[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("creator_id", userId)
    .eq("climbers.status", "accepted")
    .in("status", ["open", "matched"])
    .gte("starts_at", chatRetentionCutoff())
    .order("starts_at", { ascending: true });
  if (error) throw error;
  // Nie-bespielte Sessions (niemand beigetreten UND kein Chat-Verlauf) blendet die
  // Chats-Liste 1h nach Start aus (siehe chats.tsx) — das braucht die Chat-Daten und
  // lebt daher dort, nicht hier. Der pg_cron-Job 0021/0022 löscht sie DB-seitig.
  return (data ?? []).map(withClimbers);
}

export function useMySessions() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: MY_SESSIONS_KEY(userId ?? ""),
    queryFn: () => getMySessions(userId!),
    enabled: !!userId,
  });
}

/** Meine Rolle an einer fremden Session: fix dabei (accepted) oder wartend (pending). */
export type MyParticipation = {
  session: SessionWithMeta;
  myStatus: "accepted" | "pending";
};

// Sessions, an denen ich als ANFRAGENDE:R hänge (nicht als Ersteller:in) — die
// Teilnehmer-Sicht für den „My Sessions"-Tab: accepted = fixer Termin (Confirmed),
// pending = warte noch auf Zusage (Pending). Bewusst zwei Schritte statt eines
// verschachtelten Embeds: erst meine match_requests-Zeilen (RLS gibt mir meine
// eigenen, ADR-0006), dann die Sessions über dasselbe SESSION_SELECT wie der Feed —
// so bleibt der accepted_count-Pfad identisch. Sichtbar bis 24h nach `starts_at`
// (Chat-Fenster, CHAT_RETENTION_MS) wie in getMySessions, damit der Gruppenchat auch
// nach dem Termin noch erreichbar ist. Session-Status bleibt UNgefiltert: beigetretene Sessions dürfen `open` wie
// `matched` (voll) sein. Ersteller und Anfragende überschneiden sich nie — der Join-
// Button erscheint nur an fremden Sessions —, darum ist keine Deduplizierung nötig.
async function getMyParticipations(userId: string): Promise<MyParticipation[]> {
  const { data: reqs, error: reqErr } = await supabase
    .from("match_requests")
    .select("session_id, status")
    .eq("requester_id", userId)
    .in("status", ["accepted", "pending"]);
  if (reqErr) throw reqErr;

  const statusBySession = new Map<string, "accepted" | "pending">();
  for (const r of reqs ?? []) {
    statusBySession.set(r.session_id, r.status as "accepted" | "pending");
  }
  const ids = [...statusBySession.keys()];
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .in("id", ids)
    .eq("climbers.status", "accepted")
    .gte("starts_at", chatRetentionCutoff())
    .order("starts_at", { ascending: true });
  if (error) throw error;

  // pending fällt schon ab `starts_at + 1h` raus (Requested-Sektion, siehe
  // REQUEST_RETENTION_MS); accepted bleibt bis `+ 24h` sichtbar (Chat-Fenster).
  const requestCutoff = requestRetentionCutoff();
  return (data ?? [])
    .map((row) => {
      const session = withClimbers(row);
      return { session, myStatus: statusBySession.get(session.id)! };
    })
    .filter(
      (p) => p.myStatus !== "pending" || p.session.starts_at >= requestCutoff,
    );
}

export function useMyParticipations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  // Eindeutig pro Hook-Instanz (siehe Realtime-Kommentar unten): useMyParticipations
  // läuft im Chats-Screen UND im Tab-Badge (useChatsBadgeCount) gleichzeitig.
  const channelId = useId();

  const query = useQuery({
    queryKey: MY_PARTICIPATIONS_KEY(userId ?? ""),
    queryFn: () => getMyParticipations(userId!),
    enabled: !!userId,
  });

  // Realtime: Beantwortet die Ersteller:in meine Anfrage (accept/decline), soll die
  // Zeile im Chats-Tab sofort wandern — Requested → Joined bei „accepted", raus bei
  // „declined" (getMyParticipations filtert auf accepted|pending). Ohne dies bewegte
  // sich nichts bis zum nächsten Focus-Refetch. KEIN session_id-Filter nötig: der
  // Filter geht über `requester_id`, und Realtime erzwingt ohnehin RLS (nur meine
  // eigenen match_requests-Zeilen werden zugestellt). channelId (useId) hält den Topic
  // pro Hook-Instanz eindeutig — derselbe Hook läuft im Chats-Screen UND im Tab-Badge
  // (useChatsBadgeCount in _layout); zwei Kanäle mit gleichem Topic kollidieren in
  // supabase-js („postgres_changes after subscribe", siehe queries/chat.ts).
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`my-participations:${userId}:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_requests",
          filter: `requester_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: MY_PARTICIPATIONS_KEY(userId),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, channelId, queryClient]);

  return query;
}

export type CreateSessionInput = {
  gym_id: string;
  starts_at: string;
  ends_at?: string | null;
  /** Pflicht (nicht-leer) — trägt „was ich klettern will", siehe ADR-0005. */
  note: string;
  /** Party-Größe inkl. Ersteller:in, 2–4 (ADR-0007). Von der Ersteller:in gewählt. */
  capacity: number;
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
    },
  });
}

// Löscht eine eigene Session. Der `session delete own`-RLS-Policy (0002) lässt nur die
// Ersteller:in durch — der Client zeigt den Knopf ohnehin nur bei `isMine`. Der FK-Cascade
// (0015) räumt match_requests und den Gruppenchat (Members + Nachrichten) gleich mit ab,
// darum invalidieren wir neben `sessions` auch `chats`, damit die aufgelöste Runde aus der
// Chat-Liste fällt.
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

// Aus einer fremden (aufgenommenen) Session austreten — das Gegenstück zum Auflösen.
// Die ganze Räumung (Mitgliedschaft weg, Anfrage auf `cancelled`, „X left"-System-
// zeile, Platz frei → Session ggf. zurück auf `open`) passiert atomar in der
// SECURITY-DEFINER-Funktion `leave_session` (0016); der Client stößt sie nur an. Wir
// invalidieren `sessions` (die Session fällt aus „Joined", der Feed zeigt den freien
// Platz wieder) und `chats` (der Gruppenchat verschwindet aus meiner Liste).
export function useLeaveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.rpc("leave_session", {
        p_session_id: sessionId,
      });
      if (error) throw error;
      return sessionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      // Der Austritt setzt die eigene Anfrage auf `cancelled`. Ohne dies hinge der
      // Session-Detail-Screen (useMyRequestForSession) noch auf `accepted` und zeigte
      // „Open chat / Leave session", bis zufällig ein Realtime-Event kommt — genau der
      // stale Zustand, den useWithdrawRequest per MY_OUTGOING_KEY vermeidet.
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}
