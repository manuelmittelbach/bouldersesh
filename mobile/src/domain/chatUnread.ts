// Die EINE Unread-Regel der Chat-Liste (vorher inline in queries/chat.ts). Grundsatz
// „don't notify the actor": Eigenes punktet nicht — mit genau einer Ausnahme, der
// Join-Zeile. Die trägt technisch die sender_id der BEITRETENDEN Person (0014/0017),
// ist aber die Folge einer fremden Handlung (der Host hat akzeptiert) — ohne Punkt
// bekäme die aufgenommene Person ihre Aufnahme nie zu sehen. Andere eigene System-
// Zeilen („Session moved", 0033) hat die Betrachter:in selbst ausgelöst und kennt sie
// schon. Über das Body-Suffix gematcht wie systemMessageForViewer (queries/chat.ts):
// die Bodies sind eingebackene englische Sätze, Namen mit Leerzeichen bleiben heil.

import type { Message } from "@/types/database";

/** Der unread-relevante Ausschnitt der letzten Nachricht. Als `Pick` an die echte
 *  Zeile gebunden, aber strukturell: Tests reichen ein Literal mit genau diesen
 *  Feldern (Muster: SessionCapacity in domain/session.ts). */
export type UnreadCandidate = Pick<
  Message,
  "kind" | "sender_id" | "body" | "sent_at"
>;

/** Die Join-Zeile am eingebackenen Body-Suffix erkannt ({name} joined, 0014/0017) —
 *  die eine Heimat des Suffixes, auch systemMessageForViewer (queries/chat.ts)
 *  matcht hierüber. Deckt das umgeschriebene „You joined" mit ab. */
export function isJoinLine(body: string): boolean {
  return body.endsWith(" joined");
}

/**
 * Zählt die letzte Nachricht für diese Betrachter:in als ungelesen? Fremdes zählt
 * immer, Eigenes nur als Join-Zeile (s. o.) — und beides nur, solange der Chat seit
 * der Nachricht nicht geöffnet wurde (`lastReadAt`, gesetzt von useMarkChatRead).
 */
export function isUnreadFor(
  lastMessage: UnreadCandidate | null,
  viewerId: string,
  lastReadAt: string | null,
): boolean {
  if (!lastMessage) return false;
  const isOwnJoinLine =
    lastMessage.kind === "system" && isJoinLine(lastMessage.body);
  if (lastMessage.sender_id === viewerId && !isOwnJoinLine) return false;
  return !lastReadAt || lastMessage.sent_at > lastReadAt;
}
