// Das Session-Modul: die eine Heimat für die Regeln, die die Glossar-Begriffe
// (Kapazität, „Full", Rolle) benennen. Vorher lagen sie in jedem Screen neu inlined —
// „Full" hatte dabei DREI nicht-gleiche Definitionen (Feed: nur `status`; Detail &
// Chat: Plätze + `status`), die Rolle FÜNF Kodierungen. Hier leben sie genau einmal,
// als reine Funktionen über der rohen Zeile — testbar ohne Supabase/React (die erste
// testbare Naht dieses Projekts, siehe domain/session.test.ts).
//
// Bewusst freie Funktionen (kein Klassen-/Objekt-Wrapper), wie der Rest des Kernels
// (`hasLeftFeed`, `skillLabel` in lib/utils.ts): die Zeile bleibt die rohe Zeile, die
// Screens fragen sie über diese Funktionen — statt jede die Kapazitäts-Mathematik neu
// zu rechnen.

import type { SessionWithMeta } from "@/queries/sessions";

/** Der kapazitäts-relevante Ausschnitt einer Session-Zeile — mehr braucht die
 *  „Full"-/Plätze-Rechnung nicht. Als `Pick` an die echte Zeile gebunden, aber
 *  strukturell: Tests reichen ein Literal mit genau diesen Feldern. */
export type SessionCapacity = Pick<
  SessionWithMeta,
  "capacity" | "accepted_count" | "status"
>;

/** Der ersteller-relevante Ausschnitt — für den Host-Check und die Rollenleiter. */
export type SessionCreator = Pick<SessionWithMeta, "creator_id">;

/**
 * Plätze für Mitkletternde = `capacity − 1`: die Ersteller:in ist Gastgeber:in, kein
 * Platz (ADR-0007). `capacity` ist 2–4, es gibt also 1–3 Plätze.
 */
export function spotsTotal(session: Pick<SessionWithMeta, "capacity">): number {
  return session.capacity - 1;
}

/**
 * Freie Plätze = Gesamtplätze − angenommene Anfragen, nie negativ. `accepted_count`
 * zählt die schon aufgenommenen Mitkletternden (ohne Host, siehe queries/sessions.ts).
 */
export function spotsLeft(session: SessionCapacity): number {
  return Math.max(0, spotsTotal(session) - session.accepted_count);
}

/**
 * Die EINE „Full"-Regel (vorher 3× uneinig): voll, wenn kein Platz mehr frei ist ODER
 * der DB-Trigger die Session schon auf `matched` (= voll) gekippt hat (0014). Beide
 * Zweige sind laut Trigger-Invariante deckungsgleich (`open` ⇒ ≥1 Platz frei); die
 * Oder-Verknüpfung ist der defensive Gürtel-und-Hosenträger, falls Zeile und Status
 * kurz auseinanderlaufen. Volle Karten bleiben im Feed, nur gedimmt (ADR-0011).
 */
export function isFull(session: SessionCapacity): boolean {
  return spotsLeft(session) <= 0 || session.status === "matched";
}

/**
 * Kompaktes Plätze-Label hinter dem Kader-Stack: „Full" bzw. „N spot(s) left" — die
 * belegten Plätze zeigen ohnehin die Avatare (ADR-0007). Eine Quelle für Feed UND
 * Detail, die vorher denselben ternären Ausdruck doppelt trugen.
 */
export function spotsLabel(session: SessionCapacity): string {
  if (isFull(session)) return "Full";
  const left = spotsLeft(session);
  return `${left} ${left === 1 ? "spot" : "spots"} left`;
}

/** Bin ich (userId) die Ersteller:in dieser Session? Atomares Host-Prädikat — löst
 *  die früheren `isMine`/`isHost`-Ad-hoc-Checks der Detail-/Chat-Screens ab. */
export function isHostedBy(
  session: SessionCreator,
  userId: string | null | undefined,
): boolean {
  return !!userId && session.creator_id === userId;
}

/** Meine Rolle an einer Session — höchstens eine (ADR-0010). Vorher fünffach kodiert
 *  (`'hosting'`/`'host'`, `isMine`, `isHost`, `SessionRelationship`), jetzt ein Typ. */
export type SessionRole = "hosting" | "joined" | "requested" | "none";

/** Die Teilnahme-Signale, die NICHT auf der Zeile liegen: „pending"/„accepted" kommen
 *  aus eigenen Queries (useMyPendingRequests/useMyAcceptedRequests bzw.
 *  useMyRequestForSession) — die Rollenleiter nimmt sie als Hinweis entgegen. */
export type ViewerMembership = { accepted?: boolean; requested?: boolean };

/**
 * Die Rollenleiter an genau EINER Stelle (ADR-0010). Priorität IST Ausschluss:
 * Ersteller:in kann nicht anfragen, und eine Anfrage ist accepted ODER pending — die
 * Zweige überschneiden sich nie. `accepted` schlägt `requested`, falls beide Signale
 * (z. B. beim Realtime-Übergang) kurz zugleich anliegen.
 */
export function roleFor(
  session: SessionCreator,
  userId: string | null | undefined,
  membership: ViewerMembership = {},
): SessionRole {
  if (isHostedBy(session, userId)) return "hosting";
  if (membership.accepted) return "joined";
  if (membership.requested) return "requested";
  return "none";
}

/** Die EINE Aktion, die zu meiner Rolle passt — für das Aktions-Sheet (Feed) und die
 *  Wisch-Aktion (Chats-Tab). Das sind UI-Handlungs-Token, KEINE Rollen (siehe SessionRole
 *  fürs Vokabular): jede der vier Rollen bildet auf genau ein Token ab, `leave-chat` löst
 *  `delete`/`leave` ab, sobald die Session vom Feed gefallen ist (Absagen ergibt nach dem
 *  Termin keinen Sinn mehr). Kein „none": jede Rolle hat eine Handlung. */
export type SessionAction =
  | "delete"
  | "leave"
  | "leave-chat"
  | "withdraw"
  | "join";

/**
 * Rolle (+ „schon vom Feed?") → die eine Handlung. Bündelt die Delete-vs-Leave-vs-
 * Withdraw-vs-Join-Entscheidung, die Feed-Sheet und Chats-Swipe vorher je für sich
 * trafen. Nach dem Feed-Ende (`offFeed`) weichen Host UND Aufgenommene:r auf das stille
 * „Leave chat" aus (0023); Angefragte (requested) haben dann ohnehin nichts mehr offen.
 */
export function availableAction(
  role: SessionRole,
  opts: { offFeed?: boolean } = {},
): SessionAction {
  if (opts.offFeed && (role === "hosting" || role === "joined")) {
    return "leave-chat";
  }
  switch (role) {
    case "hosting":
      return "delete";
    case "joined":
      return "leave";
    case "requested":
      return "withdraw";
    case "none":
      return "join";
  }
}
