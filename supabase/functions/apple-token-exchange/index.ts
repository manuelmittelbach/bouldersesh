// Apple-Refresh-Token beim Login hinterlegen (ADR-0004-Update).
//
// Der native Apple-Login gibt der App neben dem identityToken auch einen
// authorizationCode — nur ~5 Minuten gültig und NUR serverseitig eintauschbar
// (braucht das client_secret aus dem SIWA-Key). Die App schickt ihn direkt
// nach dem Login hierher; wir tauschen ihn gegen Apples Refresh-Token und
// legen ihn in `apple_refresh_tokens` ab (Migration 0032). Beim Account-
// Löschen widerruft `delete-account` damit die Apple-Verknüpfung — ohne
// gespeicherten Token gäbe es zu dem Zeitpunkt nichts mehr zum Widerrufen.
//
// Der Aufruf ist aus Client-Sicht Best-Effort (fire-and-forget): Scheitert er,
// darf der Login davon nichts merken. Fehlende Apple-Secrets sind deshalb ein
// stilles 200 { stored: false }, kein Fehler.

import { createClient } from 'jsr:@supabase/supabase-js@2';

import { exchangeAuthorizationCode, isAppleConfigured } from '../_shared/appleAuth.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Function is misconfigured' }, 500);
  }

  // Aufrufende Person per JWT identifizieren — der Token wird dem eigenen
  // Account zugeordnet, niemand kann für fremde Accounts Tokens hinterlegen.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing authorization' }, 401);

  const asUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await asUser.auth.getUser();
  if (userError || !user) return json({ error: 'Not authenticated' }, 401);

  let body: { authorization_code?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const code = body.authorization_code;
  if (typeof code !== 'string' || code.length === 0) {
    return json({ error: 'authorization_code is required' }, 400);
  }

  // Ohne SIWA-Secrets kein Tausch — still überspringen (siehe Kopfkommentar).
  if (!isAppleConfigured()) {
    console.warn('apple-token-exchange: Apple secrets missing, skipping');
    return json({ stored: false }, 200);
  }

  try {
    const refreshToken = await exchangeAuthorizationCode(code);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    // upsert: bei jedem Login ersetzt der neueste Token den alten — für die
    // Revocation zählt nur, dass EIN gültiger Token da ist.
    const { error: upsertError } = await admin
      .from('apple_refresh_tokens')
      .upsert({ user_id: user.id, refresh_token: refreshToken, updated_at: new Date().toISOString() });
    if (upsertError) throw upsertError;

    return json({ stored: true }, 200);
  } catch (e) {
    console.error('apple-token-exchange failed', e);
    return json({ error: 'Could not store the Apple token.' }, 500);
  }
});
