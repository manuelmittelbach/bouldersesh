import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
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
// Chat list — every chat the current user is a member of.
// ------------------------------------------------------------------

export type ChatListItem = {
  id: string;
  createdAt: string;
  /** The other person in this 1:1 chat (null if we can't resolve them). */
  other: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    skill_level: string | null;
  } | null;
  session: {
    id: string;
    starts_at: string;
    level: string;
    gym: { name: string } | null;
  } | null;
  lastMessage: { body: string; sent_at: string; sender_id: string } | null;
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
        session:sessions ( id, starts_at, level, gym:gyms ( name ) ),
        members:chat_members ( user_id, profile:profiles ( id, display_name, avatar_url, skill_level ) )
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
    { body: string; sent_at: string; sender_id: string }
  >();
  for (const m of msgs ?? []) {
    if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, m);
  }

  type ChatRowRaw = {
    id: string;
    created_at: string;
    session: ChatListItem["session"];
    members: Array<{ user_id: string; profile: ChatListItem["other"] }>;
  };

  const items: ChatListItem[] = (
    (chats ?? []) as unknown as ChatRowRaw[]
  ).map((c) => {
    const other =
      (c.members ?? [])
        .map((mem) => mem.profile)
        .find((p) => p && p.id !== userId) ?? null;
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
      .channel(`my-chats:${userId}`)
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
  }, [userId, queryClient]);

  return query;
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
