// Verzweigung des Account-Screens nach Login-Methode: Social-Konten (Apple/
// Google) haben kein Passwort in der App und ihre E-Mail gehört dem Provider —
// signInMethod liest die Methode aus den app_metadata des Supabase-Users.

import assert from "node:assert/strict";
import test from "node:test";

import { signInMethod } from "./signInMethod.ts";

test("Apple-Konto wird erkannt", () => {
  assert.equal(signInMethod({ app_metadata: { provider: "apple" } }), "apple");
});

test("Google-Konto wird erkannt", () => {
  assert.equal(signInMethod({ app_metadata: { provider: "google" } }), "google");
});

test("E-Mail-Konto wird erkannt", () => {
  assert.equal(signInMethod({ app_metadata: { provider: "email" } }), "email");
});

test("fehlende oder unbekannte Provider-Angabe → email (sicherster Default)", () => {
  assert.equal(signInMethod(null), "email");
  assert.equal(signInMethod(undefined), "email");
  assert.equal(signInMethod({}), "email");
  assert.equal(signInMethod({ app_metadata: {} }), "email");
  assert.equal(signInMethod({ app_metadata: { provider: 42 } }), "email");
  assert.equal(signInMethod({ app_metadata: { provider: "phone" } }), "email");
});
