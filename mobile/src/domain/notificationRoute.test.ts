// Tap-Routing für Push-Notifications: Der data-Payload einer Notification ist
// von außen gesetzt (Edge Function — oder wer auch immer an einen Push-Token
// kommt). routeFromNotificationData ist der Validator davor: Nur bekannte
// interne Ziele mit UUID kommen durch, alles andere wird verworfen.

import assert from "node:assert/strict";
import test from "node:test";

import { routeFromNotificationData } from "./notificationRoute.ts";

const CHAT_URL = "/chats/1c7ab9c0-9b5e-4b0f-8f6d-2a1e3d4c5b6a";
const SESSION_URL = "/sessions/1c7ab9c0-9b5e-4b0f-8f6d-2a1e3d4c5b6a";

test("Chat-Ziel mit UUID kommt durch", () => {
  assert.equal(routeFromNotificationData({ url: CHAT_URL }), CHAT_URL);
});

test("Session-Ziel mit UUID kommt durch", () => {
  assert.equal(routeFromNotificationData({ url: SESSION_URL }), SESSION_URL);
});

test("fehlender oder nicht-String url → null", () => {
  assert.equal(routeFromNotificationData(undefined), null);
  assert.equal(routeFromNotificationData({}), null);
  assert.equal(routeFromNotificationData({ url: 42 }), null);
  assert.equal(routeFromNotificationData({ url: null }), null);
});

test("externe URLs werden verworfen", () => {
  assert.equal(routeFromNotificationData({ url: "https://evil.example/chats/x" }), null);
  assert.equal(routeFromNotificationData({ url: "bouldersesh://chats/abc" }), null);
});

test("unbekannte interne Ziele werden verworfen", () => {
  assert.equal(
    routeFromNotificationData({ url: "/profile/1c7ab9c0-9b5e-4b0f-8f6d-2a1e3d4c5b6a" }),
    null,
  );
  assert.equal(routeFromNotificationData({ url: "/login" }), null);
});

test("kein UUID-Segment oder Extra-Segmente → null", () => {
  assert.equal(routeFromNotificationData({ url: "/chats/abc" }), null);
  assert.equal(routeFromNotificationData({ url: `${CHAT_URL}/extra` }), null);
  assert.equal(routeFromNotificationData({ url: "/chats/" }), null);
});
