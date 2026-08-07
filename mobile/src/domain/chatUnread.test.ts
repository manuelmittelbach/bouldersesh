// Tests für die Unread-Regel der Chat-Liste — eine weitere testbare Naht im
// Domain-Ordner. Läuft wie session.test.ts über `node --test` + Type-Stripping.

import assert from "node:assert/strict";
import test from "node:test";

import { isUnreadFor, type UnreadCandidate } from "./chatUnread.ts";

const ME = "me";
const OTHER = "other";

function msg(overrides: Partial<UnreadCandidate>): UnreadCandidate {
  return {
    kind: "text",
    sender_id: OTHER,
    body: "hi",
    sent_at: "2026-08-07T11:00:00+00:00",
    ...overrides,
  };
}

test("kein lastMessage → nicht ungelesen", () => {
  assert.equal(isUnreadFor(null, ME, null), false);
});

test("fremde Textnachricht, nie gelesen → ungelesen", () => {
  assert.equal(isUnreadFor(msg({}), ME, null), true);
});

test("fremde Textnachricht, danach gelesen → gelesen", () => {
  assert.equal(isUnreadFor(msg({}), ME, "2026-08-07T12:00:00+00:00"), false);
});

test("eigene Textnachricht punktet nie", () => {
  assert.equal(isUnreadFor(msg({ sender_id: ME }), ME, null), false);
});

test("fremde System-Zeile (z. B. „Ben joined“ beim Host) → ungelesen", () => {
  assert.equal(
    isUnreadFor(msg({ kind: "system", body: "Ben joined" }), ME, null),
    true,
  );
});

test("eigene Join-Zeile („You joined“-Fall) → ungelesen trotz eigener sender_id", () => {
  assert.equal(
    isUnreadFor(
      msg({ kind: "system", sender_id: ME, body: "Manu joined" }),
      ME,
      null,
    ),
    true,
  );
});

test("eigene „Session moved“-Zeile punktet NICHT (Auslöser weiß es schon)", () => {
  assert.equal(
    isUnreadFor(
      msg({
        kind: "system",
        sender_id: ME,
        body: "Session moved to Aug 8, 19:00 · Bouldergarten",
      }),
      ME,
      null,
    ),
    false,
  );
});

test("fremde „Session moved“-Zeile (Mitglied-Sicht) → ungelesen", () => {
  assert.equal(
    isUnreadFor(
      msg({
        kind: "system",
        sender_id: OTHER,
        body: "Session moved to Aug 8, 19:00 · Bouldergarten",
      }),
      ME,
      null,
    ),
    true,
  );
});

test("eigene Join-Zeile, danach gelesen → gelesen", () => {
  assert.equal(
    isUnreadFor(
      msg({ kind: "system", sender_id: ME, body: "Manu joined" }),
      ME,
      "2026-08-07T12:00:00+00:00",
    ),
    false,
  );
});

test("lastRead VOR der Nachricht → weiterhin ungelesen", () => {
  assert.equal(
    isUnreadFor(msg({}), ME, "2026-08-07T10:00:00+00:00"),
    true,
  );
});
