// Läuft wie die domain-Tests über Nodes `node:test` + Type-Stripping (npm test).
// Modul-globaler Zustand: jeder Test räumt vorab per take auf, statt sich auf
// Reihenfolge zu verlassen.

import assert from "node:assert/strict";
import test from "node:test";

import { setPendingFeedDay, takePendingFeedDay } from "./feedDayStore.ts";

test("take ohne abgelegten Tag liefert null", () => {
  takePendingFeedDay();
  assert.equal(takePendingFeedDay(), null);
});

test("abgelegter Tag kommt als Mitternacht-Anker seines Kalendertags zurück", () => {
  takePendingFeedDay();
  // 18:32 Uhr — die typische starts_at-Uhrzeit einer Session.
  setPendingFeedDay(new Date(2026, 7, 22, 18, 32, 5));
  assert.deepEqual(takePendingFeedDay(), new Date(2026, 7, 22, 0, 0, 0, 0));
});

test("One-Shot: der zweite take liefert null", () => {
  takePendingFeedDay();
  setPendingFeedDay(new Date(2026, 7, 22));
  takePendingFeedDay();
  assert.equal(takePendingFeedDay(), null);
});

test("zweites set überschreibt das erste — die zuletzt angelegte Session gewinnt", () => {
  takePendingFeedDay();
  setPendingFeedDay(new Date(2026, 7, 22));
  setPendingFeedDay(new Date(2026, 7, 25));
  assert.deepEqual(takePendingFeedDay(), new Date(2026, 7, 25, 0, 0, 0, 0));
});
