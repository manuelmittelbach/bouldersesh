// Die ersten Unit-Tests des Projekts. Läuft ohne Runner-Abhängigkeit über Nodes
// eingebautes `node:test` + Type-Stripping (Node ≥ 23): `npm test` = `node --test`.
// Das Modul ist rein (nur `import type`), darum braucht der Test kein Supabase/React
// und kein Metro/Babel — genau die Naht, die die Architektur-Review versprochen hat.

import assert from "node:assert/strict";
import test from "node:test";

import {
  availableAction,
  isFull,
  isHostedBy,
  roleFor,
  spotsLabel,
  spotsLeft,
  spotsTotal,
  type SessionCapacity,
} from "./session.ts";

/** Eine kapazitäts-relevante Zeile bauen — nur die drei Felder, die die Rechnung liest. */
function cap(
  capacity: number,
  accepted_count: number,
  status: SessionCapacity["status"] = "open",
): SessionCapacity {
  return { capacity, accepted_count, status };
}

test("spotsTotal: Host ist kein Platz (capacity − 1)", () => {
  assert.equal(spotsTotal({ capacity: 2 }), 1);
  assert.equal(spotsTotal({ capacity: 4 }), 3);
});

test("spotsLeft: Gesamt − angenommen, nie negativ", () => {
  assert.equal(spotsLeft(cap(4, 0)), 3);
  assert.equal(spotsLeft(cap(4, 2)), 1);
  assert.equal(spotsLeft(cap(4, 3)), 0);
  // Defensiv: mehr angenommen als Plätze → 0, nicht negativ.
  assert.equal(spotsLeft(cap(2, 5)), 0);
});

// Die Kern-Zusammenführung: die drei früher uneinigen „Full"-Definitionen ergeben jetzt
// EINE Antwort. Hier explizit die Fälle, in denen sie vorher auseinanderliefen.
test("isFull: voll, wenn kein Platz frei — auch wenn status noch nicht 'matched'", () => {
  // Feed rechnete nur `status === 'matched'` → hätte hier FÄLSCHLICH „nicht voll"
  // gesagt, obwohl 0 Plätze frei sind. Jetzt einheitlich voll.
  assert.equal(isFull(cap(4, 3, "open")), true);
});

test("isFull: voll, wenn status 'matched' — auch wenn die Zeile noch Platz zeigt", () => {
  // Detail/Chat rechneten primär Plätze; der Status ist der defensive Gürtel, falls
  // Zeile und Trigger kurz auseinanderlaufen.
  assert.equal(isFull(cap(4, 0, "matched")), true);
});

test("isFull: nicht voll bei freien Plätzen und offenem Status", () => {
  assert.equal(isFull(cap(4, 1, "open")), false);
  assert.equal(isFull(cap(2, 0, "open")), false);
});

test("spotsLabel: 'Full' bzw. Singular/Plural", () => {
  assert.equal(spotsLabel(cap(4, 3)), "Full");
  assert.equal(spotsLabel(cap(4, 2)), "1 spot left");
  assert.equal(spotsLabel(cap(4, 0)), "3 spots left");
  assert.equal(spotsLabel(cap(3, 0)), "2 spots left");
  assert.equal(spotsLabel(cap(4, 0, "matched")), "Full");
});

test("isHostedBy: nur die Ersteller:in, null/undefined sind nie Host", () => {
  assert.equal(isHostedBy({ creator_id: "u1" }, "u1"), true);
  assert.equal(isHostedBy({ creator_id: "u1" }, "u2"), false);
  assert.equal(isHostedBy({ creator_id: "u1" }, null), false);
  assert.equal(isHostedBy({ creator_id: "u1" }, undefined), false);
});

// Die Rollenleiter: Priorität IST Ausschluss (ADR-0010) — genau ein Ergebnis.
test("roleFor: hosting schlägt jede Teilnahme", () => {
  assert.equal(
    roleFor({ creator_id: "u1" }, "u1", { accepted: true, requested: true }),
    "hosting",
  );
});

test("roleFor: accepted → joined, pending → requested", () => {
  assert.equal(roleFor({ creator_id: "u1" }, "u2", { accepted: true }), "joined");
  assert.equal(
    roleFor({ creator_id: "u1" }, "u2", { requested: true }),
    "requested",
  );
});

test("roleFor: accepted schlägt requested beim Übergang", () => {
  assert.equal(
    roleFor({ creator_id: "u1" }, "u2", { accepted: true, requested: true }),
    "joined",
  );
});

test("roleFor: ohne Bezug → none (Default-Membership)", () => {
  assert.equal(roleFor({ creator_id: "u1" }, "u2"), "none");
  assert.equal(roleFor({ creator_id: "u1" }, null), "none");
});

test("availableAction: Rolle → die eine Handlung (auf dem Feed)", () => {
  assert.equal(availableAction("hosting"), "delete");
  assert.equal(availableAction("joined"), "leave");
  assert.equal(availableAction("requested"), "withdraw");
  assert.equal(availableAction("none"), "join");
});

test("availableAction: nach dem Feed-Ende weichen Host & Joined auf 'leave-chat'", () => {
  assert.equal(availableAction("hosting", { offFeed: true }), "leave-chat");
  assert.equal(availableAction("joined", { offFeed: true }), "leave-chat");
  // Angefragt/offen sind vom Feed-Ende unberührt.
  assert.equal(availableAction("requested", { offFeed: true }), "withdraw");
  assert.equal(availableAction("none", { offFeed: true }), "join");
});
