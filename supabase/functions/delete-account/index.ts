// Account-Löschung. Siehe docs/adr/0004-account-loeschen.md.
//
// Warum überhaupt eine Edge Function: `auth.admin.deleteUser()` braucht den
// service_role-Key, der niemals in den Client darf. Und der Client kann keine
// fremden Storage-Dateien anfassen — die öffentlichen Profilbilder (ADR-0003)
// blieben sonst nach dem Löschen für immer im Netz erreichbar.
//
// REIHENFOLGE IST NICHT VERHANDELBAR (ADR-0004): erst die Bucket-Dateien löschen,
// dann den Auth-User. Bricht Schritt „Dateien" ab, bleibt der Account bestehen
// (ohne Bilder) und die Person kann es erneut auslösen — ein reparierbarer
// Ausfall. Andersherum wären die Bilder öffentlich abrufbar und NIEMAND könnte
// sie mehr entfernen.

import { createClient } from 'jsr:@supabase/supabase-js@2';

import { isAppleConfigured, revokeRefreshToken } from '../_shared/appleAuth.ts';

const PROFILE_IMAGES_BUCKET = 'profile-images';

// Der Aufruf kommt aus der nativen App per fetch; CORS ist dort nicht zwingend,
// schadet aber nicht und macht das Testen aus dem Studio/Browser möglich.
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

  // 1. Aufrufende Person per JWT identifizieren. Der Anon-Client mit dem
  //    weitergereichten Authorization-Header sieht genau die eine Session; wer
  //    ohne gültiges Token kommt, bekommt keinen User.
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

  // Ab hier mit service_role: Storage-Dateien löschen und deleteUser gehen nur
  // damit. persistSession aus — die Function hält keinen Zustand.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 2. Die zu löschenden Pfade stehen in der DB-Zeile, nicht im Storage-Listing
    //    — die DB ist die Wahrheit (ADR-0004). avatar_path + gallery_paths.
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('avatar_path, gallery_paths')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const paths = [profile?.avatar_path, ...(profile?.gallery_paths ?? [])].filter(
      (p): p is string => !!p,
    );

    // 3. Dateien ZUERST. Schlägt es fehl, hier abbrechen — der Account bleibt
    //    unangetastet und die Person kann den Knopf erneut drücken. Ein bereits
    //    fehlendes File lässt `remove` ohne Fehler durchgehen.
    if (paths.length > 0) {
      const { error: removeError } = await admin.storage
        .from(PROFILE_IMAGES_BUCKET)
        .remove(paths);
      if (removeError) throw removeError;
    }

    // 4. Apple-Refresh-Token VOR dem deleteUser lesen — die Zeile hängt per
    //    FK-Cascade am Auth-User und wäre danach weg (Migration 0032).
    const { data: appleRow, error: appleRowError } = await admin
      .from('apple_refresh_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();
    if (appleRowError) throw appleRowError;

    // 5. Auth-User löschen. Die vorhandenen FK-Cascades räumen Profil, Sessions
    //    und Anfragen ab; messages.sender_id wird auf NULL gesetzt (Migration
    //    0010), die Nachrichten überleben als „Deleted user".
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    // 6. Apple-Verknüpfung widerrufen (App-Store-Pflicht, ADR-0004-Update) —
    //    NACH dem Löschen und Best-Effort: Der Account ist weg, ein Apple-
    //    Ausfall darf daraus keinen Fehler machen. Schlägt es fehl, bleibt die
    //    App in den Apple-ID-Einstellungen der Person sichtbar (dort auch
    //    manuell entfernbar) — ärgerlich, aber kein Datenleck.
    if (appleRow?.refresh_token && isAppleConfigured()) {
      try {
        await revokeRefreshToken(appleRow.refresh_token);
      } catch (e) {
        console.error('delete-account: Apple token revoke failed', e);
      }
    }

    return json({ ok: true }, 200);
  } catch (e) {
    // Bewusst generisch nach außen — die Person soll es schlicht erneut
    // versuchen können. Details landen im Function-Log.
    console.error('delete-account failed', e);
    return json({ error: 'Could not delete the account. Please try again.' }, 500);
  }
});
