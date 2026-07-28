import { useEffect, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { usePendingCountsForSessions } from "@/queries/matches";
import { useMyParticipations, useMySessions } from "@/queries/sessions";
import type { Message } from "@/types/database";

const MESSAGES_KEY = (chatId: string) => ["chat", chatId, "messages"] as const;
const CHATS_LIST_KEY = (userId: string) => ["chats", "list", userId] as const;

async function getMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("sent_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export function useMessages(chatId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: MESSAGES_KEY(chatId ?? ""),
    queryFn: () => getMessages(chatId!),
    enabled: !!chatId,
  });

  // Realtime subscription — see Lessons §3.3.
  // Patches the cache instead of invalidating to avoid the round-trip flicker.
  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          queryClient.setQueryData<Message[]>(
            MESSAGES_KEY(chatId),
            (prev = []) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            },
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);

  return query;
}

export function useSendMessage(chatId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!chatId) throw new Error("No chat selected");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("messages")
        .insert({ chat_id: chatId, sender_id: auth.user.id, body })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (msg) => {
      // Realtime echo will also patch the cache, the dedupe in useMessages handles it.
      queryClient.setQueryData<Message[]>(
        MESSAGES_KEY(msg.chat_id),
        (prev = []) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        },
      );
    },
  });
}

// ------------------------------------------------------------------
// Chat members — who is in this chat, with their avatar.
// ------------------------------------------------------------------
// Bewusst getrennt von den Nachrichten statt als Join: Das Realtime-INSERT
// liefert die rohe messages-Zeile ohne eingebettetes Profil. Mit Join müsste der
// Screen bei jeder Nachricht nachladen statt den Cache zu patchen — genau der
// Round-Trip-Flacker, den Lessons §3.3 vermeidet. Die Mitglieder ändern sich
// dagegen so gut wie nie, ein eigener Query kostet nichts.

export type ChatMember = {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
};

async function getChatMembers(chatId: string): Promise<ChatMember[]> {
  const { data, error } = await supabase
    .from("chat_members")
    .select("profile:profiles ( id, display_name, avatar_path )")
    .eq("chat_id", chatId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => (row as unknown as { profile: ChatMember | null }).profile)
    .filter((p): p is ChatMember => !!p);
}

export function useChatMembers(chatId: string | undefined) {
  return useQuery({
    queryKey: ["chat", chatId ?? "", "members"] as const,
    queryFn: () => getChatMembers(chatId!),
    enabled: !!chatId,
    staleTime: 5 * 60 * 1000,
  });
}

// ------------------------------------------------------------------
// Chat list — every chat the current user is a member of.
// ------------------------------------------------------------------

export type ChatCounterpart = {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
  skill_level: string | null;
};

/**
 * Personen-zentrierter Chat-Titel (ADR-0007). Eine Zweier-Runde zeigt den einen Namen
 * (wie bisher), eine Gruppe „Anna, Ben +1". Leere Liste → "" (Aufrufer setzt den
 * Fallback, z. B. „Deleted user"/„Chat").
 */
export function buildChatTitle(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export type ChatListItem = {
  id: string;
  createdAt: string;
  /** The other person in this chat — first counterpart (null if none resolvable). */
  other: ChatCounterpart | null;
  /** Alle anderen Mitglieder (für Gruppen-Titel/gestapelte Avatare). 1:1 → genau eins. */
  others: ChatCounterpart[];
  /** Personen-zentrierter Titel: 1:1 der eine Name, Gruppe „Anna, Ben +1". */
  title: string;
  /**
   * Es gibt außer mir kein Mitglied mehr — das Gegenüber hat seinen Account
   * gelöscht, die `chat_members`-Zeile ist mitgegangen (ADR-0004). Zu
   * unterscheiden von `other === null`, was auch heißen kann, dass das Profil
   * nur nicht aufgelöst werden konnte.
   */
  counterpartDeleted: boolean;
  session: {
    id: string;
    starts_at: string;
    gym: { name: string } | null;
  } | null;
  /** `sender_id === null`: die Absender:in hat ihren Account gelöscht (ADR-0004). */
  lastMessage: { body: string; sent_at: string; sender_id: string | null } | null;
  unread: boolean;
};

async function getMyChats(userId: string): Promise<ChatListItem[]> {
  // 1. Which chats am I in, and when did I last read them?
  const { data: memberships, error: mErr } = await supabase
    .from("chat_members")
    .select("chat_id, last_read_at")
    .eq("user_id", userId);
  if (mErr) throw mErr;

  const rows = memberships ?? [];
  const chatIds = rows.map((r) => r.chat_id);
  if (chatIds.length === 0) return [];
  const lastReadByChat = new Map(rows.map((r) => [r.chat_id, r.last_read_at]));

  // 2. The chats with the other member's profile and the session context.
  //    RLS lets a member read every chat_members row of chats they belong to,
  //    so the embedded members include the counterpart.
  const { data: chats, error: cErr } = await supabase
    .from("chats")
    .select(
      `
        id,
        created_at,
        session:sessions ( id, starts_at, gym:gyms ( name ) ),
        members:chat_members ( user_id, profile:profiles ( id, display_name, avatar_path, skill_level ) )
      `,
    )
    .in("id", chatIds);
  if (cErr) throw cErr;

  // 3. Last message per chat (fetch newest-first, keep the first seen per chat).
  const { data: msgs, error: msgErr } = await supabase
    .from("messages")
    .select("chat_id, body, sent_at, sender_id")
    .in("chat_id", chatIds)
    .order("sent_at", { ascending: false });
  if (msgErr) throw msgErr;

  const lastByChat = new Map<
    string,
    { body: string; sent_at: string; sender_id: string | null }
  >();
  for (const m of msgs ?? []) {
    if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, m);
  }

  type ChatRowRaw = {
    id: string;
    created_at: string;
    session: ChatListItem["session"];
    members: { user_id: string; profile: ChatCounterpart | null }[];
  };

  const items: ChatListItem[] = (
    (chats ?? []) as unknown as ChatRowRaw[]
  ).map((c) => {
    const otherMembers = (c.members ?? []).filter((mem) => mem.user_id !== userId);
    const others = otherMembers
      .map((mem) => mem.profile)
      .filter((p): p is ChatCounterpart => !!p);
    const other = others[0] ?? null;
    const title = buildChatTitle(others.map((p) => p.display_name ?? "Anonymous"));
    const lastMessage = lastByChat.get(c.id) ?? null;
    const lastRead = lastReadByChat.get(c.id) ?? null;
    const unread =
      !!lastMessage &&
      lastMessage.sender_id !== userId &&
      (!lastRead || lastMessage.sent_at > lastRead);

    return {
      id: c.id,
      createdAt: c.created_at,
      other,
      others,
      title,
      counterpartDeleted: otherMembers.length === 0,
      session: c.session ?? null,
      lastMessage,
      unread,
    };
  });

  // Newest activity first (last message, else the chat's creation time).
  items.sort((a, b) => {
    const ta = a.lastMessage?.sent_at ?? a.createdAt;
    const tb = b.lastMessage?.sent_at ?? b.createdAt;
    return tb.localeCompare(ta);
  });

  return items;
}

export function useMyChats() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  // Eindeutig PRO Hook-Instanz: useMyChats läuft an mehreren Stellen gleichzeitig
  // (My-Sessions-Screen UND der Tab-Badge in _layout). Zwei Kanäle mit demselben
  // Topic-Namen kollidieren in supabase-js („cannot add postgres_changes callbacks
  // after subscribe()"). Der Topic-Name ist nur ein Client-Identifier — der Filter
  // steckt in den `.on()`-Bindings —, also macht der Instanz-Suffix ihn kollisionsfrei.
  const channelId = useId();

  const query = useQuery({
    queryKey: CHATS_LIST_KEY(userId ?? ""),
    queryFn: () => getMyChats(userId!),
    enabled: !!userId,
  });

  // Realtime: a new membership (chat just created for me) or any incoming
  // message refreshes the list. Realtime enforces RLS, so the message stream
  // only carries chats I'm a member of.
  useEffect(() => {
    if (!userId) return;
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: CHATS_LIST_KEY(userId) });

    const channel = supabase
      .channel(`my-chats:${userId}:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_members",
          filter: `user_id=eq.${userId}`,
        },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        invalidate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, channelId]);

  return query;
}

/**
 * Der Zähler am Chats-Tab-Badge = Anzahl ZEILEN in der Chats-Pipeline, die einen
 * Aufmerksamkeits-Punkt tragen („dotted rows"), NICHT Anzahl ungelesener Nachrichten.
 * Eine Zeile ist gepunktet, wenn sie mich braucht:
 *
 *   • My Sessions (Gastgeber): ungelesener Chat ODER offene Beitritts-Anfragen (>0)
 *   • Joined (beigetreten):    ungelesener Chat
 *   • Requested (ausgehend):   nie — wartet auf jemand anderen
 *
 * Pro Zeile genau +1: eine eigene Session mit ungelesenem Chat UND offenen Anfragen
 * bleibt eine Zeile, ein Punkt, +1. So stimmt die Zahl exakt mit den sichtbaren
 * Punkten überein, wenn man den Tab öffnet. Realtime kommt aus useMyChats (Nachrichten)
 * und usePendingCountsForSessions (Anfragen) — der Badge stimmt auf jedem Tab.
 */
export function useChatsBadgeCount(): number {
  const { data: chats } = useMyChats();
  const { data: created } = useMySessions();
  const { data: participations } = useMyParticipations();

  const hostedIds = (created ?? []).map((s) => s.id);
  const { data: pendingCounts } = usePendingCountsForSessions(hostedIds);

  // Ungelesen-Flag je Session (ein Chat gehört zu genau einer Session).
  const unreadBySession = new Map<string, boolean>();
  for (const c of chats ?? []) {
    if (c.session?.id && c.unread) unreadBySession.set(c.session.id, true);
  }

  let count = 0;
  // My Sessions: ungelesener Chat ODER offene Anfragen.
  for (const s of created ?? []) {
    const unread = unreadBySession.get(s.id) ?? false;
    const pending = (pendingCounts?.[s.id] ?? 0) > 0;
    if (unread || pending) count++;
  }
  // Joined: nur ungelesener Chat. (Ersteller:in und Anfragende überschneiden sich nie,
  // also zählt keine Session doppelt.)
  for (const p of participations ?? []) {
    if (p.myStatus === "accepted" && unreadBySession.get(p.session.id)) count++;
  }
  return count;
}

/** The chat that belongs to a session (created when a request was accepted). */
async function getChatForSession(sessionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("chats")
    .select("id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export function useChatForSession(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["chats", "for-session", sessionId ?? ""],
    queryFn: () => getChatForSession(sessionId!),
    enabled: !!sessionId && enabled,
  });
}
