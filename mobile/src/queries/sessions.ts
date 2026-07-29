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

export type FeedSessionsParams = {
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
  /**
   * Zahl der ANGENOMMENEN Anfragen. Belegte Plätze = 1 (Ersteller:in) + diese Zahl;
   * freie Plätze = capacity − belegt (ADR-0007). Kommt als eingebetteter, auf
   * `status='accepted'` gefilterter Count aus einem Query — kein N+1.
   */
  accepted_count: number;
};

// `!inner` rather than a left join: it's the only way to filter on the gym via
// `.eq("gym.city_id", …)`. There are no sessions without a gym (gym_id is NOT NULL),
// so the result set is unchanged.
//
// `accepted:match_requests ( count )` zählt eingebettet die angenommenen Anfragen. Der
// Status-Filter steht am Query (`.eq("accepted.status","accepted")`), damit derselbe
// SELECT für Feed und Detail gilt. To-many-Filter lassen Eltern mit 0 Treffern stehen —
// teilbesetzte und leere Sessions bleiben im Feed (genau gewollt).
const SESSION_SELECT = `
  *,
  creator:profiles!sessions_creator_id_fkey ( id, display_name, avatar_path, gallery_paths, skill_level ),
  gym:gyms!inner ( id, name, city_id, city:cities ( id, name ) ),
  accepted:match_requests ( count )
`;

/** Den eingebetteten `accepted`-Count zu einem flachen `accepted_count` normalisieren. */
function withAcceptedCount(row: unknown): SessionWithMeta {
  const { accepted, ...rest } = row as Record<string, unknown> & {
    accepted?: { count: number }[];
  };
  return {
    ...(rest as unknown as SessionWithMeta),
    accepted_count: accepted?.[0]?.count ?? 0,
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
    .eq("accepted.status", "accepted")
    .order("starts_at", { ascending: true });

  if (params.city_id) query = query.eq("gym.city_id", params.city_id);
  if (params.gym_id) query = query.eq("gym_id", params.gym_id);
  if (params.from) query = query.gte("starts_at", params.from);
  if (params.to) query = query.lte("starts_at", params.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(withAcceptedCount);
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
    .eq("accepted.status", "accepted")
    .maybeSingle();
  if (error) throw error;
  return data ? withAcceptedCount(data) : null;
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
// der einzige Ort, an dem die Ersteller:in sie noch wiederfindet. `starts_at >= now`
// wie der Feed, damit Vergangenes verschwindet. Das `now` lebt in der queryFn (nicht
// im Key), der Key ist stabil → kein Refetch-Sturm; Aktualisierung per Focus-Refetch.
async function getMySessions(userId: string): Promise<SessionWithMeta[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("creator_id", userId)
    .eq("accepted.status", "accepted")
    .in("status", ["open", "matched"])
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(withAcceptedCount);
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
// so bleibt der accepted_count-Pfad identisch. `starts_at >= now` wie überall, damit
// Vergangenes verschwindet; das `now` lebt in der queryFn (stabiler Key, kein Refetch-
// Sturm). Session-Status bleibt UNgefiltert: beigetretene Sessions dürfen `open` wie
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
    .eq("accepted.status", "accepted")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const session = withAcceptedCount(row);
    return { session, myStatus: statusBySession.get(session.id)! };
  });
}

export function useMyParticipations() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: MY_PARTICIPATIONS_KEY(userId ?? ""),
    queryFn: () => getMyParticipations(userId!),
    enabled: !!userId,
  });
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
