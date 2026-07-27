import { router, useFocusEffect } from 'expo-router';
import { Clock, Hand, MessageCircle, Trash2, Users } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, cn, formatChatTime, formatSessionTime } from '@/lib/utils';
import { useHideChat, useMyChats, type ChatListItem } from '@/queries/chat';
import { usePendingCountsForSessions } from '@/queries/matches';
import {
  useMyParticipations,
  useMySessions,
  type SessionWithMeta,
} from '@/queries/sessions';
import { colors } from '@/theme/colors';

// Der „Chats"-Tab bündelt alles, was mit meinen Sessions zu tun hat — nach ROLLE
// gruppiert, nicht als flache Chat-Liste: „My Sessions" (selbst erstellt), „Requested
// Sessions" (Beitritt angefragt, wartet) und „Joined Sessions" (aufgenommen). Jede
// Session steht in genau einer Sektion; der Chat (falls schon vorhanden) sitzt inline
// in der Zeile. Grund: ein Chat entsteht erst mit dem Match, pending hat also keinen.

function Eyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-1 mt-2 px-5 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

// Hairline zwischen zwei Zeilen, eingerückt bis unter den Text (Avatar lg = 56 + px-5).
function RowSeparator() {
  return <View className="ml-[76px] h-px bg-rock-100" />;
}

// Icon-Kachel in Avatar-lg-Größe für Zeilen ohne menschliches Gegenüber (offene
// Anfrage, noch leere eigene Session) — bewusst anders als ein Personen-Avatar,
// damit „hier ist noch niemand" auf einen Blick lesbar ist.
function IconTile({ icon }: { icon: React.ReactNode }) {
  return (
    <View className="h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50">
      {icon}
    </View>
  );
}

// Kleine Pill für die Gastgeber-Sicht: „N wollen mit". Sitzt auf der Session-Zeile,
// weil eine Gruppensession gleichzeitig einen laufenden Chat UND offene Requests
// haben kann — sonst stünde sie doppelt.
function RequestsPill({ count }: { count: number }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5">
      <Users size={11} color={colors.brand[600]} strokeWidth={2.5} />
      <Text className="font-sans-semibold text-[11px] text-brand-700">
        {count === 1 ? '1 wants to join' : `${count} want to join`}
      </Text>
    </View>
  );
}

// Rote Wisch-Aktion — blendet den Chat aus MEINER Liste aus (nicht für die anderen),
// siehe useHideChat. Nur an Zeilen mit echtem Chat.
function DeleteAction({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Delete chat"
      className="w-24 items-center justify-center bg-danger active:opacity-90">
      <Trash2 size={22} color={colors.rock[0]} strokeWidth={2} />
      <Text className="mt-1 font-sans-medium text-xs text-rock-0">Delete</Text>
    </Pressable>
  );
}

// Zeile für eine Session OHNE (noch) Chat: offene eigene Session, angefragte Session
// oder — als seltener Rand-/Race-Fall — eine aufgenommene ohne Chat. Statuszeile mit
// Icon-Kachel, Halle+Zeit oben, Statustext (+ optionale Pill) darunter. Tippt in die
// Session-Detailseite, den Chat gibt es hier noch nicht.
function StatusRow({
  session,
  icon,
  subtitle,
  pill,
}: {
  session: SessionWithMeta;
  icon: React.ReactNode;
  subtitle: string;
  pill?: React.ReactNode;
}) {
  const gym = session.gym?.name ?? 'Session';
  return (
    <Pressable
      onPress={() => router.push(`/sessions/${session.id}`)}
      className="flex-row items-center gap-3 bg-rock-25 px-5 py-3 active:bg-rock-50">
      <IconTile icon={icon} />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-display text-[15px] text-rock-900">
          {gym}
          <Text className="font-sans text-[13px] text-rock-400">
            {'  ·  '}
            {formatSessionTime(session.starts_at, { withDay: true })}
          </Text>
        </Text>
        <View className="mt-0.5 flex-row items-center justify-between gap-2">
          <Text numberOfLines={1} className="flex-1 font-sans text-[13px] text-rock-500">
            {subtitle}
          </Text>
          {pill ?? null}
        </View>
      </View>
    </Pressable>
  );
}

// Eine Session MIT Chat — die eigentliche Konversationszeile (Avatar, letzte Nachricht,
// Ungelesen-Punkt). Bei eigenen Sessions kann rechts die „N wollen mit"-Pill stehen.
// Tippen öffnet den Gruppenchat.
function ConversationRow({
  chat,
  hosting,
  pendingCount,
}: {
  chat: ChatListItem;
  hosting: boolean;
  pendingCount: number;
}) {
  const name = chat.title || (chat.counterpartDeleted ? 'Deleted user' : 'Anonymous');
  const preview = chat.lastMessage?.body ?? 'No messages yet';
  const stamp = chat.lastMessage?.sent_at ?? chat.createdAt;
  const showRequests = hosting && pendingCount > 0;

  return (
    <Pressable
      onPress={() => router.push(`/chats/${chat.id}`)}
      // Deckende Fläche (= Seitenhintergrund), sonst schimmert beim Wischen die rote
      // Delete-Aktion durch.
      className="flex-row items-center gap-3 bg-rock-25 px-5 py-3 active:bg-rock-50">
      <Avatar
        name={name}
        tone={avatarTone(chat.other?.id ?? name)}
        size="lg"
        src={publicImageUrl(chat.other?.avatar_path)}
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text numberOfLines={1} className="flex-1 font-display text-[15px] text-rock-900">
            {name}
          </Text>
          <Text
            className={cn(
              'shrink-0 font-mono text-[11px]',
              chat.unread ? 'text-brand-600' : 'text-rock-400',
            )}>
            {formatChatTime(stamp)}
          </Text>
        </View>
        <View className="mt-0.5 flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className={cn(
              'flex-1 text-[13px]',
              chat.unread ? 'font-sans-medium text-rock-900' : 'font-sans text-rock-500',
            )}>
            {preview}
          </Text>
          {chat.unread ? (
            <View className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
          ) : null}
        </View>
        <View className="mt-0.5 flex-row items-center justify-between gap-2">
          {chat.session?.gym ? (
            <Text numberOfLines={1} className="flex-1 font-sans text-xs text-rock-400">
              {chat.session.gym.name} · {formatSessionTime(chat.session.starts_at)}
            </Text>
          ) : (
            <View className="flex-1" />
          )}
          {showRequests ? <RequestsPill count={pendingCount} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

type Entry = { session: SessionWithMeta; chat: ChatListItem | undefined };

type Row = { key: string; node: React.ReactNode };

// Eine Sektion mit Eyebrow und hairline-getrennten Zeilen. Auf Modulebene (nicht in
// Chats verschachtelt), sonst wäre es bei jedem Render ein neuer Komponententyp →
// Remount, das würde u. a. den offenen Swipe-Zustand zurücksetzen.
function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <View className="mt-2">
      <Eyebrow>{title}</Eyebrow>
      {rows.map((row, i) => (
        <View key={row.key}>
          {i > 0 ? <RowSeparator /> : null}
          {row.node}
        </View>
      ))}
    </View>
  );
}

// Sortierschlüssel: Zeilen mit Chat nach letzter Aktivität (neu → alt), Zeilen ohne
// Chat nach Termin (früh → spät) dahinter. So stehen aktive Gespräche oben, ruhende
// oder noch leere Sessions darunter.
function sortEntries(entries: Entry[]): Entry[] {
  const activity = (e: Entry) => e.chat?.lastMessage?.sent_at ?? e.chat?.createdAt ?? '';
  const withChat = entries
    .filter((e) => e.chat)
    .sort((a, b) => activity(b).localeCompare(activity(a)));
  const withoutChat = entries
    .filter((e) => !e.chat)
    .sort((a, b) => a.session.starts_at.localeCompare(b.session.starts_at));
  return [...withChat, ...withoutChat];
}

export default function Chats() {
  const created = useMySessions();
  const participations = useMyParticipations();
  const chats = useMyChats();
  const hide = useHideChat();
  const [refreshing, setRefreshing] = useState(false);

  // Alle drei on-focus refetchen: der Tab bleibt in expo-router gemountet, ohne das
  // tauchte eine gerade angenommene/erstellte Session erst nach App-Neustart auf.
  const refetchCreated = created.refetch;
  const refetchParticipations = participations.refetch;
  const refetchChats = chats.refetch;
  useFocusEffect(
    useCallback(() => {
      refetchCreated();
      refetchParticipations();
      refetchChats();
    }, [refetchCreated, refetchParticipations, refetchChats]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refetchCreated(), refetchParticipations(), refetchChats()]);
    } finally {
      setRefreshing(false);
    }
  }

  // Session-ID → Chat, um jeder Session ihren (evtl. schon vorhandenen) Chat zuzuordnen.
  const chatBySession = useMemo(() => {
    const m = new Map<string, ChatListItem>();
    for (const c of chats.data ?? []) {
      if (c.session?.id) m.set(c.session.id, c);
    }
    return m;
  }, [chats.data]);

  // Offene Anfragen je EIGENER Session (Gastgeber-Sicht) für die „N wollen mit"-Pill.
  const hostedIds = useMemo(() => (created.data ?? []).map((s) => s.id), [created.data]);
  const pendingCounts = usePendingCountsForSessions(hostedIds);

  // My Sessions = alles, was ich selbst erstellt habe (mit Chat, sobald wer dabei ist).
  const mySessions = useMemo<Entry[]>(
    () => sortEntries((created.data ?? []).map((s) => ({ session: s, chat: chatBySession.get(s.id) }))),
    [created.data, chatBySession],
  );

  // Requested = fremde Sessions, deren Beitritt ich angefragt habe (wartet auf Zusage).
  const requested = useMemo<SessionWithMeta[]>(
    () =>
      (participations.data ?? [])
        .filter((p) => p.myStatus === 'pending')
        .map((p) => p.session)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [participations.data],
  );

  // Joined = fremde Sessions, in die ich aufgenommen wurde (mit Chat).
  const joined = useMemo<Entry[]>(
    () =>
      sortEntries(
        (participations.data ?? [])
          .filter((p) => p.myStatus === 'accepted')
          .map((p) => ({ session: p.session, chat: chatBySession.get(p.session.id) })),
      ),
    [participations.data, chatBySession],
  );

  const isLoading = created.isLoading || participations.isLoading;
  const error = (created.error ?? participations.error) as Error | null;
  const isEmpty = mySessions.length === 0 && requested.length === 0 && joined.length === 0;

  // Eine Konversations- oder Statuszeile für eine eigene/beigetretene Session. Zeilen
  // mit Chat sind wischbar (ausblenden), Statuszeilen nicht.
  function renderEntry({ session, chat }: Entry, hosting: boolean): Row {
    const pendingCount = pendingCounts.data?.[session.id] ?? 0;
    if (chat) {
      return {
        key: chat.id,
        node: (
          <ReanimatedSwipeable
            friction={2}
            rightThreshold={40}
            overshootRight={false}
            renderRightActions={() => <DeleteAction onPress={() => hide.mutate(chat.id)} />}>
            <ConversationRow chat={chat} hosting={hosting} pendingCount={pendingCount} />
          </ReanimatedSwipeable>
        ),
      };
    }
    if (hosting) {
      return {
        key: session.id,
        node: (
          <StatusRow
            session={session}
            icon={<Hand size={22} color={colors.brand[600]} strokeWidth={2} />}
            subtitle={pendingCount > 0 ? '' : 'No climbers yet'}
            pill={pendingCount > 0 ? <RequestsPill count={pendingCount} /> : undefined}
          />
        ),
      };
    }
    // Beigetreten, aber (noch) kein Chat — seltener Race, trotzdem sichtbar halten.
    return {
      key: session.id,
      node: (
        <StatusRow
          session={session}
          icon={<Users size={22} color={colors.brand[600]} strokeWidth={2} />}
          subtitle={`with ${session.creator?.display_name ?? 'Anonymous'}`}
        />
      ),
    };
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <View className="px-5 pb-3 pt-2">
        <Text className="font-display-bold text-[30px] leading-none text-rock-900">Chats</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[500]} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-sans text-sm text-danger">
            Couldn’t load: {error.message}
          </Text>
        </View>
      ) : isEmpty ? (
        <View className="flex-1 items-center px-6 pt-16">
          <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <MessageCircle size={28} color={colors.brand[600]} strokeWidth={2} />
          </View>
          <Text className="font-display text-base text-rock-900">No chats yet</Text>
          <Text className="mt-1 text-center font-sans text-sm leading-5 text-rock-500">
            Join a session from the feed or create your own — your requests and chats show up
            here.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/sessions/new')}
            className="mt-5 rounded-md bg-brand-500 px-4 py-2.5 active:opacity-90">
            <Text className="font-sans-semibold text-[14px] text-rock-0">Create a session</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-10"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand[500]}
            />
          }>
          {requested.length > 0 ? (
            <Section
              title="Requested Sessions"
              rows={requested.map((session) => ({
                key: session.id,
                node: (
                  <StatusRow
                    session={session}
                    icon={<Clock size={22} color={colors.brand[600]} strokeWidth={2} />}
                    subtitle={`with ${session.creator?.display_name ?? 'Anonymous'} · Waiting for reply`}
                  />
                ),
              }))}
            />
          ) : null}

          {mySessions.length > 0 ? (
            <Section title="My Sessions" rows={mySessions.map((e) => renderEntry(e, true))} />
          ) : null}

          {joined.length > 0 ? (
            <Section title="Joined Sessions" rows={joined.map((e) => renderEntry(e, false))} />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
