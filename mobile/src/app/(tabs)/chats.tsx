import { router, useFocusEffect } from 'expo-router';
import { Clock, Hand, LogOut, MessageCircle, Trash2, Undo2, Users } from 'lucide-react-native';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useMyChats, type ChatListItem } from '@/queries/chat';
import { usePendingCountsForSessions, useWithdrawRequest } from '@/queries/matches';
import {
  useDeleteSession,
  useLeaveSession,
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

// Orange „Aufmerksamkeit"-Punkt: ungelesene Nachricht ODER offene Beitritts-Anfragen.
// Ein Punkt pro Zeile — der Chats-Tab-Badge zählt genau die Zeilen mit diesem Punkt.
function AttentionDot() {
  return <View className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />;
}

// Kleine Info-Pill für die Gastgeber-Sicht: „N wollen mit". Sitzt auf der Session-
// Zeile, weil eine Gruppensession gleichzeitig einen laufenden Chat UND offene Requests
// haben kann. Rein anzeigend — das Annehmen/Ablehnen passiert dort, wohin die Zeile
// ohnehin tippt: in den Chat (Anfragen oben angeheftet) bzw. die Session-Detailseite.
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

// Rollen-abhängige Wisch-Aktion. `danger` (rot) NUR fürs Auflösen, das die Session
// samt Chat für ALLE zerstört; Verlassen/Zurückziehen betreffen nur mich und sind
// umkehrbar → neutraler Ton (rock-500), damit die eine echt gefährliche Aktion
// visuell heraussticht statt in einem Meer aus Rot zu verschwinden.
function SwipeAction({
  label,
  icon,
  tone,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  tone: 'danger' | 'neutral';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        'w-24 items-center justify-center active:opacity-90',
        tone === 'danger' ? 'bg-danger' : 'bg-rock-500',
      )}>
      {icon}
      <Text className="mt-1 text-center font-sans-medium text-xs text-rock-0">{label}</Text>
    </Pressable>
  );
}

// Ein Wisch macht in RNGH aus dem Loslassen einen Tap auf die darunterliegende
// Pressable — sonst öffnete jedes Aufwischen sofort den Chat. Der Kontext liefert den
// Zeilen einen Wächter: `blocked()` ist wahr, sobald gezogen/geöffnet wird, und die
// Zeilen-onPress fällt dann aus.
const SwipeGuardContext = createContext<{ blocked: () => boolean }>({ blocked: () => false });

// Zeilen-Navigations-onPress durch den Wächter schleusen: während eines Wischs (oder bei
// offener Zeile) unterdrückt, sonst normal.
function useSwipeGuardedPress(onPress?: () => void) {
  const guard = useContext(SwipeGuardContext);
  return useCallback(() => {
    if (guard.blocked() || !onPress) return;
    onPress();
  }, [guard, onPress]);
}

// Wisch-Wrapper mit rechter Aktion. Die Zeilen darunter (StatusRow/ConversationRow)
// haben eine deckende Fläche, sonst schimmerte die Aktion beim Wischen durch.
function SwipeRow({ action, children }: { action: React.ReactNode; children: React.ReactNode }) {
  // Ref statt State: der Wert wird nur im onPress-Moment gelesen, ein Re-Render wäre
  // Verschwendung. `true` ab Zieh-Beginn und solange offen; erst beim Schließen wieder frei.
  const activeRef = useRef(false);
  const guard = useMemo(() => ({ blocked: () => activeRef.current }), []);

  return (
    <SwipeGuardContext.Provider value={guard}>
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        onSwipeableOpenStartDrag={() => {
          activeRef.current = true;
        }}
        onSwipeableWillOpen={() => {
          activeRef.current = true;
        }}
        onSwipeableWillClose={() => {
          activeRef.current = false;
        }}
        renderRightActions={() => action}>
        {children}
      </ReanimatedSwipeable>
    </SwipeGuardContext.Provider>
  );
}

// Verlassen kostet den Zugang zum Gruppenchat und ist nicht mit einem Tipp umkehrbar
// (die Ersteller:in muss neu zusagen) → Rückfrage. Zurückziehen dagegen ist trivial
// umkehrbar und braucht keine.
function confirmLeave(onConfirm: () => void) {
  Alert.alert('Leave session?', "You'll leave the group chat. You can ask to rejoin later.", [
    { text: 'Stay', style: 'cancel' },
    { text: 'Leave', style: 'destructive', onPress: onConfirm },
  ]);
}

// Löschen ist unwiderruflich und trifft alle — Rückfrage mit Kontext, ob schon
// jemand dabei ist (dann geht auch der Gruppenchat verloren).
function confirmDissolve(hasGroup: boolean, onConfirm: () => void) {
  Alert.alert(
    'Delete session?',
    hasGroup
      ? 'This removes the session and the group chat for everyone.'
      : 'This removes the session for good.',
    [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ],
  );
}

// Status-Optik (Icon-Kachel, Halle+Zeit, Statustext + optionale Pill) für Zeilen ohne
// menschliches Gegenüber: die angefragte Session, der seltene aufgenommene-ohne-Chat-Race
// und — neu — die noch leere eigene Session. Das Tap-Ziel ist überschreibbar: die leere
// eigene Session hat längst einen (leeren) Chat und springt dorthin (`onPress`), alle
// anderen fallen auf die Session-Detailseite zurück.
function StatusRow({
  session,
  icon,
  subtitle,
  pill,
  dot,
  onPress,
}: {
  session: SessionWithMeta;
  icon: React.ReactNode;
  subtitle: string;
  pill?: React.ReactNode;
  dot?: boolean;
  onPress?: () => void;
}) {
  const gym = session.gym?.name ?? 'Session';
  const handlePress = useSwipeGuardedPress(
    onPress ?? (() => router.push(`/sessions/${session.id}`)),
  );
  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-3 bg-rock-25 px-5 py-3 active:bg-rock-50">
      <IconTile icon={icon} />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="flex-1 font-display text-[15px] text-rock-900">
            {gym}
            <Text className="font-sans text-[13px] text-rock-400">
              {'  ·  '}
              {formatSessionTime(session.starts_at, { withDay: true })}
            </Text>
          </Text>
          {dot ? <AttentionDot /> : null}
        </View>
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
  // Zeile braucht Aufmerksamkeit: ungelesene Nachricht ODER offene Anfragen. Genau
  // dieselbe Bedingung zählt der Chats-Tab-Badge (eine Zeile = ein Punkt = +1).
  const dotted = chat.unread || showRequests;
  const handlePress = useSwipeGuardedPress(() => router.push(`/chats/${chat.id}`));

  return (
    <Pressable
      onPress={handlePress}
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
          {dotted ? <AttentionDot /> : null}
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
  const withdraw = useWithdrawRequest();
  const dissolve = useDeleteSession();
  const leave = useLeaveSession();
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

  // Eine Konversations- oder Statuszeile für eine eigene/beigetretene Session. Jede
  // Zeile ist wischbar — rollen-abhängig: als Gastgeber:in auflösen (rot), als
  // Beigetretene:r verlassen (neutral). Auch die chat-losen Statuszeilen (leere eigene
  // Session, seltener Beitritts-Race) sind wischbar, sonst gäbe es keinen Ausweg.
  function renderEntry({ session, chat }: Entry, role: 'host' | 'joined'): Row {
    const hosting = role === 'host';
    const pendingCount = pendingCounts.data?.[session.id] ?? 0;

    // Gastgeber-Sicht: seit 0017 hat JEDE eigene Session von Anfang an einen Chat, also
    // taugt die Chat-Existenz nicht mehr als Verzweigung. Maßgeblich ist, ob schon wer
    // dabei ist. Niemand aufgenommen → Status-Optik („No climbers yet"/Anfragen-Pill),
    // die aber in den (leeren) Chat tippt statt auf die Detailseite. Sobald jemand
    // beitritt, wird daraus die normale Konversationszeile. Das fängt zugleich den
    // ADR-0004-Fall ab (accepted_count>0, aber kein anderes Mitglied mehr → „Deleted
    // user" in der ConversationRow statt fälschlich „No climbers yet").
    const inner = hosting ? (
      session.accepted_count > 0 && chat ? (
        <ConversationRow chat={chat} hosting={hosting} pendingCount={pendingCount} />
      ) : (
        <StatusRow
          session={session}
          icon={<Hand size={22} color={colors.brand[600]} strokeWidth={2} />}
          subtitle={pendingCount > 0 ? '' : 'No climbers yet'}
          pill={pendingCount > 0 ? <RequestsPill count={pendingCount} /> : undefined}
          dot={pendingCount > 0}
          onPress={chat ? () => router.push(`/chats/${chat.id}`) : undefined}
        />
      )
    ) : chat ? (
      <ConversationRow chat={chat} hosting={hosting} pendingCount={pendingCount} />
    ) : (
      // Beigetreten, aber (noch) kein Chat — seltener Race, trotzdem sichtbar halten.
      <StatusRow
        session={session}
        icon={<Users size={22} color={colors.brand[600]} strokeWidth={2} />}
        subtitle={`with ${session.creator?.display_name ?? 'Anonymous'}`}
      />
    );

    const action = hosting ? (
      <SwipeAction
        label="Delete session"
        tone="danger"
        icon={<Trash2 size={22} color={colors.rock[0]} strokeWidth={2} />}
        onPress={() =>
          confirmDissolve(!!chat || session.accepted_count > 0, () =>
            dissolve.mutate(session.id),
          )
        }
      />
    ) : (
      <SwipeAction
        label="Leave"
        tone="neutral"
        icon={<LogOut size={22} color={colors.rock[0]} strokeWidth={2} />}
        onPress={() => confirmLeave(() => leave.mutate(session.id))}
      />
    );

    return { key: chat?.id ?? session.id, node: <SwipeRow action={action}>{inner}</SwipeRow> };
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
                  <SwipeRow
                    action={
                      <SwipeAction
                        label="Withdraw request"
                        tone="neutral"
                        icon={<Undo2 size={22} color={colors.rock[0]} strokeWidth={2} />}
                        onPress={() => withdraw.mutate(session.id)}
                      />
                    }>
                    <StatusRow
                      session={session}
                      icon={<Clock size={22} color={colors.brand[600]} strokeWidth={2} />}
                      subtitle={`with ${session.creator?.display_name ?? 'Anonymous'} · Waiting for reply`}
                    />
                  </SwipeRow>
                ),
              }))}
            />
          ) : null}

          {mySessions.length > 0 ? (
            <Section title="My Sessions" rows={mySessions.map((e) => renderEntry(e, 'host'))} />
          ) : null}

          {joined.length > 0 ? (
            <Section title="Joined Sessions" rows={joined.map((e) => renderEntry(e, 'joined'))} />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
