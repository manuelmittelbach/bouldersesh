// Push-Versand über die Expo Push API. Aufgerufen NUR von den DB-Triggern aus
// Migration 0029 (pg_net) — nicht aus der App. Auth läuft deshalb nicht über
// User-JWTs (verify_jwt=false), sondern über das gemeinsame Vault-Secret
// 'push_fn_secret': Der Trigger schickt es als Bearer, wir lesen es zum
// Vergleich über den service_role-only RPC get_push_secret().
//
// Deploy-Voraussetzungen (verify_jwt=false, Vault-Secret, FCM): dokumentiert
// unter [functions.send-push] in supabase/config.toml.
//
// Payload: { event: 'request_created' | 'request_accepted' | 'message_created'
//                  | 'session_updated',
//            record: <die auslösende Zeile als JSON> }
// Empfänger und Anzeigenamen werden hier per service_role nachgeladen — der
// Payload liefert nur IDs und (bei Nachrichten) den Text.
//
// Deep-Link-Ziel ist immer der Chat der Session (existiert seit 0017 ab
// Session-Erstellung); fällt die Chat-Suche aus, die Session-Detailseite.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
// Die Expo Push API nimmt maximal 100 Nachrichten pro Request.
const EXPO_BATCH_SIZE = 100;
// Push-Payload-Budget ist 4 KiB gesamt — lange Chat-Nachrichten kappen.
const BODY_PREVIEW_LENGTH = 140;

type PushEvent =
  | 'request_created'
  | 'request_accepted'
  | 'message_created'
  | 'session_updated';

type Notification = {
  userIds: string[];
  title: string;
  body: string;
  url: string;
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

// Chat zur Session finden (fürs Tap-Routing). null = Fallback auf die Session.
async function chatUrlForSession(
  admin: SupabaseClient,
  sessionId: string,
): Promise<string> {
  const { data: chat } = await admin
    .from('chats')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle();
  return chat ? `/chats/${chat.id}` : `/sessions/${sessionId}`;
}

async function displayName(
  admin: SupabaseClient,
  userId: string | null,
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();
  return data?.display_name ?? null;
}

async function buildNotification(
  admin: SupabaseClient,
  event: PushEvent,
  record: Record<string, unknown>,
): Promise<Notification | null> {
  switch (event) {
    case 'request_created': {
      const sessionId = record.session_id as string;
      const { data: session } = await admin
        .from('sessions')
        .select('creator_id, gym:gyms(name)')
        .eq('id', sessionId)
        .maybeSingle();
      if (!session) return null;
      const name = (await displayName(admin, record.requester_id as string)) ?? 'Someone';
      const gym = (session.gym as { name: string } | null)?.name;
      return {
        userIds: [session.creator_id],
        title: 'New join request',
        body: gym ? `${name} wants to join your session at ${gym}` : `${name} wants to join your session`,
        url: await chatUrlForSession(admin, sessionId),
      };
    }
    case 'request_accepted': {
      const sessionId = record.session_id as string;
      const { data: session } = await admin
        .from('sessions')
        .select('creator_id, gym:gyms(name)')
        .eq('id', sessionId)
        .maybeSingle();
      if (!session) return null;
      const host = (await displayName(admin, session.creator_id)) ?? 'The host';
      const gym = (session.gym as { name: string } | null)?.name;
      return {
        userIds: [record.requester_id as string],
        title: "You're in!",
        body: gym ? `${host} accepted your request — see you at ${gym}` : `${host} accepted your request`,
        url: await chatUrlForSession(admin, sessionId),
      };
    }
    case 'message_created': {
      const chatId = record.chat_id as string;
      const senderId = (record.sender_id as string | null) ?? null;
      const { data: members } = await admin
        .from('chat_members')
        .select('user_id')
        .eq('chat_id', chatId);
      const recipients = (members ?? [])
        .map((m) => m.user_id as string)
        .filter((id) => id !== senderId);
      if (recipients.length === 0) return null;
      return {
        userIds: recipients,
        title: (await displayName(admin, senderId)) ?? 'New message',
        body: truncate((record.body as string) ?? '', BODY_PREVIEW_LENGTH),
        url: `/chats/${chatId}`,
      };
    }
    case 'session_updated': {
      // Zeit/Halle einer Session geändert (Trigger 0033, ADR-0017). record ist die
      // sessions-Zeile. Empfänger: Chat-Mitglieder außer Host — also genau die
      // angenommenen Mitglieder; pending Requester bekommen bewusst nichts.
      const sessionId = record.id as string;
      const creatorId = (record.creator_id as string | null) ?? null;
      const { data: chat } = await admin
        .from('chats')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();
      if (!chat) return null;
      const { data: members } = await admin
        .from('chat_members')
        .select('user_id')
        .eq('chat_id', chat.id);
      const recipients = (members ?? [])
        .map((m) => m.user_id as string)
        .filter((id) => id !== creatorId);
      if (recipients.length === 0) return null;
      const { data: gym } = await admin
        .from('gyms')
        .select('name')
        .eq('id', record.gym_id as string)
        .maybeSingle();
      // Gleiches festes Zeitformat wie die System-Zeile im Chat (0033: „Aug 7, 18:30",
      // Monat zuerst → en-US) und gleiche feste Zone Europe/Berlin — alle Städte
      // liegen in Deutschland.
      const when = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Berlin',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(record.starts_at as string));
      return {
        userIds: recipients,
        title: 'Session updated',
        body: gym ? `Now ${when} at ${gym.name}` : `Now ${when}`,
        url: `/chats/${chat.id}`,
      };
    }
    default:
      return null;
  }
}

// Das Secret ändert sich praktisch nie — pro Isolate cachen; bei Mismatch wird
// einmal neu geladen (deckt Rotation ab, ohne pro Request die DB zu fragen).
let cachedSecret: string | null = null;

async function fetchSecret(admin: SupabaseClient): Promise<string | null> {
  const { data } = await admin.rpc('get_push_secret');
  return typeof data === 'string' && data.length > 0 ? data : null;
}

// Vergleich über SHA-256-Digests statt String-Gleichheit: macht den Vergleich
// unabhängig von der Position des ersten abweichenden Zeichens (Timing).
async function digestsMatch(a: string, b: string): Promise<boolean> {
  const encode = (s: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  const [da, db] = await Promise.all([encode(a), encode(b)]);
  const ba = new Uint8Array(da);
  const bb = new Uint8Array(db);
  return ba.every((byte, i) => byte === bb[i]);
}

async function isAuthorized(admin: SupabaseClient, provided: string): Promise<boolean> {
  if (!provided) return false;
  if (!cachedSecret) cachedSecret = await fetchSecret(admin);
  if (!cachedSecret) return false;
  if (await digestsMatch(provided, cachedSecret)) return true;
  // Mismatch kann Rotation sein: einmal frisch laden und erneut prüfen.
  cachedSecret = await fetchSecret(admin);
  return cachedSecret !== null && (await digestsMatch(provided, cachedSecret));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Function is misconfigured' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Secret prüfen — nur die DB-Trigger kennen es.
  const provided = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!(await isAuthorized(admin, provided))) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { event, record } = (await req.json()) as {
      event: PushEvent;
      record: Record<string, unknown>;
    };
    if (!event || !record) return json({ error: 'Bad payload' }, 400);

    // 2. Empfänger + Texte bestimmen.
    const notification = await buildNotification(admin, event, record);
    if (!notification) return json({ ok: true, sent: 0 }, 200);

    // 3. Geräte-Tokens der Empfänger laden.
    const { data: tokenRows, error: tokenError } = await admin
      .from('push_tokens')
      .select('token')
      .in('user_id', notification.userIds);
    if (tokenError) throw tokenError;
    if (!tokenRows || tokenRows.length === 0) return json({ ok: true, sent: 0 }, 200);

    const messages = tokenRows.map((row) => ({
      to: row.token as string,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: { url: notification.url },
      channelId: 'default',
    }));

    // 4. In 100er-Batches an Expo schicken; tote Tokens einsammeln.
    const deadTokens: string[] = [];
    let sent = 0;
    for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
      const batch = messages.slice(i, i + EXPO_BATCH_SIZE);
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      const payload = await res.json().catch(() => null);
      const tickets = payload?.data;
      if (!res.ok || !Array.isArray(tickets)) {
        console.error('expo push request failed', res.status, payload);
        continue;
      }
      tickets.forEach((ticket, idx) => {
        if (ticket?.status === 'ok') {
          sent += 1;
        } else if (ticket?.details?.error === 'DeviceNotRegistered') {
          // Ausgetragenes Gerät (App gelöscht, Permission entzogen) — Token
          // löschen, sonst schicken wir für immer ins Leere.
          deadTokens.push(batch[idx].to);
        } else {
          console.error('expo push ticket error', ticket);
        }
      });
    }

    if (deadTokens.length > 0) {
      await admin.from('push_tokens').delete().in('token', deadTokens);
    }

    return json({ ok: true, sent }, 200);
  } catch (e) {
    console.error('send-push failed', e);
    return json({ error: 'Internal error' }, 500);
  }
});
