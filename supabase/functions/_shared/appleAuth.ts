// Sign-in-with-Apple-Serverseite (ADR-0004-Update): Code-Tausch beim Login und
// Token-Revocation beim Account-Löschen. Beide reden mit Apples REST-API und
// brauchen dafür ein selbstsigniertes client_secret-JWT (ES256, signiert mit
// dem SIWA-Key aus dem Apple Developer Portal).
//
// Benötigte Function-Secrets (supabase secrets set …):
//   APPLE_TEAM_ID          — Apple-Team (z.B. 5MCC527JM7)
//   APPLE_SIWA_KEY_ID      — Key-ID des „Sign in with Apple"-Keys (.p8)
//   APPLE_SIWA_PRIVATE_KEY — Inhalt der .p8-Datei (PEM, inkl. BEGIN/END-Zeilen)
// Fehlen sie, melden die Helfer das als { configured: false } — die Aufrufer
// überspringen dann still statt zu scheitern (Revocation ist Best-Effort).

import { importPKCS8, SignJWT } from 'npm:jose@5';

const APPLE_AUTH_BASE = 'https://appleid.apple.com/auth';
// client_id ist die Bundle-ID der App — bei nativem Sign in with Apple ist die
// App selbst der "Client". Nicht geheim, daher Konstante statt Secret.
const APPLE_CLIENT_ID = 'de.manumittelbach.bouldersesh';

type AppleConfig = { teamId: string; keyId: string; privateKey: string };

function readConfig(): AppleConfig | null {
  const teamId = Deno.env.get('APPLE_TEAM_ID');
  const keyId = Deno.env.get('APPLE_SIWA_KEY_ID');
  const privateKey = Deno.env.get('APPLE_SIWA_PRIVATE_KEY');
  if (!teamId || !keyId || !privateKey) return null;
  return { teamId, keyId, privateKey };
}

export function isAppleConfigured(): boolean {
  return readConfig() !== null;
}

/** Das client_secret, das Apple statt eines statischen Secrets verlangt: ein
 *  kurzlebiges ES256-JWT, ausgestellt vom eigenen Team auf die eigene App. */
async function createClientSecret(config: AppleConfig): Promise<string> {
  const key = await importPKCS8(config.privateKey, 'ES256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
    .setIssuer(config.teamId)
    .setSubject(APPLE_CLIENT_ID)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

/** authorizationCode (aus dem nativen Login, ~5 min gültig) gegen Apples
 *  Refresh-Token tauschen. Wirft bei Ablehnung durch Apple. */
export async function exchangeAuthorizationCode(code: string): Promise<string> {
  const config = readConfig();
  if (!config) throw new Error('Apple secrets are not configured');

  const response = await fetch(`${APPLE_AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: APPLE_CLIENT_ID,
      client_secret: await createClientSecret(config),
    }),
  });
  if (!response.ok) {
    throw new Error(`Apple token exchange failed (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as { refresh_token?: string };
  if (!payload.refresh_token) {
    throw new Error('Apple token response contained no refresh_token');
  }
  return payload.refresh_token;
}

/** Apple-Verknüpfung widerrufen (App-Store-Pflicht beim Account-Löschen).
 *  Wirft bei Fehlern — der Aufrufer entscheidet, ob das fatal ist. */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const config = readConfig();
  if (!config) throw new Error('Apple secrets are not configured');

  const response = await fetch(`${APPLE_AUTH_BASE}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token: refreshToken,
      token_type_hint: 'refresh_token',
      client_id: APPLE_CLIENT_ID,
      client_secret: await createClientSecret(config),
    }),
  });
  // Apple antwortet bei Erfolg mit 200 und leerem Body.
  if (!response.ok) {
    throw new Error(`Apple token revoke failed (${response.status}): ${await response.text()}`);
  }
}
