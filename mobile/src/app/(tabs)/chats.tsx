import { router, useFocusEffect } from 'expo-router';
import { Clock, Crown, LogOut, MessageCircle, Trash2, Undo2, Users } from 'lucide-react-native';
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
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { Avatar } from '@/components/ui';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, cn, formatSessionTime, hasLeftFeed } from '@/lib/utils';
import {
  CHAT_MEMBERS_KEY,
  CHAT_SESSION_ID_KEY,
  useMyChats,
  type ChatListItem,
} from '@/queries/chat';
import { usePendingCountsForSessions, useWithdrawRequest } from '@/queries/matches';
import {
  SESSION_KEY,
  useDeleteSession,
  useLeaveChat,
  useLeaveSession,
  useMyParticipations,
  useMySessions,
  type SessionWithMeta,
} from '@/queries/sessions';
import { colors } from '@/theme/colors';

// Der „Chats"-Tab bündelt alles, was mit meinen Sessions zu tun hat — in ZWEI Sektionen,
// nicht als flache Chat-Liste: „Requested Sessions" (Beitritt angefragt, wartet, noch kein
// Chat) und „Your Sessions" (selbst erstellt ODER aufgenommen — beide haben einen Chat,
// zeitlich gemischt). Die Trennlinie ist „noch offen" vs. „läuft schon", nicht Host vs.
// Gast: die Rolle steht ohnehin pro Zeile (Krone vs. Gastgeber-Avatar, Delete vs. Leave).
// Der Chat (falls schon vorhanden) sitzt inline in der Zeile; pending hat keinen, weil ein
// Chat erst mit dem Match entsteht. Früher drei Rollen-Sektionen (Hosting/Joined getrennt);
// zusammengelegt für eine ruhigere Liste, da die Zeile die Rolle schon selbst trägt.

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
// damit „hier ist noch niemand" auf einen Blick lesbar ist. `tint` legt den runden
// Hintergrund rollen-abhängig fest (Krone brand, Uhr neutral) — angelehnt an die
// Rollen-Streifen der Feed-Karten (SessionCard).
function IconTile({ icon, tint }: { icon: React.ReactNode; tint?: string }) {
  return (
    <View
      className={cn(
        'h-14 w-14 shrink-0 items-center justify-center rounded-full',
        tint,
      )}>
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

// Koordiniert die offenen Wisch-Zeilen listenweit: es darf immer nur EINE offen sein,
// und ein Tap oder Scroll woanders schließt sie wieder. So bleibt kein Wisch-Zustand
// „hängen" (auch nicht über einen Tab-Wechsel hinweg — der Screen schließt beim Blur).
type OpenRow = { close: () => void };
const SwipeCoordinatorContext = createContext<{
  onOpen: (row: OpenRow) => void;
  onClose: (row: OpenRow) => void;
  closeOpen: () => boolean;
}>({ onOpen: () => {}, onClose: () => {}, closeOpen: () => false });

// Hält ein Ref auf die eine gerade offene Zeile. Öffnet sich eine andere (oder tippt/
// scrollt man woanders), wird die alte geschlossen. Stabil über useMemo, damit der
// Provider-Wert nicht bei jedem Render neu ist.
function useSwipeCoordinator() {
  const openRef = useRef<OpenRow | null>(null);
  return useMemo(
    () => ({
      onOpen: (row: OpenRow) => {
        const prev = openRef.current;
        if (prev && prev !== row) prev.close();
        openRef.current = row;
      },
      onClose: (row: OpenRow) => {
        if (openRef.current === row) openRef.current = null;
      },
      closeOpen: () => {
        const cur = openRef.current;
        if (!cur) return false;
        cur.close();
        openRef.current = null;
        return true;
      },
    }),
    [],
  );
}

// Zeilen-Navigations-onPress durch Wächter und Koordinator schleusen.
// Reihenfolge ist wichtig: Zuerst der Wächter — der beim Loslassen entstehende
// Phantom-Tap trifft die GERADE geöffnete Zeile (deren `blocked()` wahr ist) und muss
// unterdrückt werden, OHNE sie gleich wieder zu schließen. Erst danach der Koordinator:
// tippt man eine ANDERE Zeile an, während irgendwo eine offen ist, schließt der Tap nur
// diese (ohne zu navigieren). Sonst normal navigieren.
function useSwipeGuardedPress(onPress?: () => void) {
  const guard = useContext(SwipeGuardContext);
  const coordinator = useContext(SwipeCoordinatorContext);
  return useCallback(() => {
    if (guard.blocked()) return;
    if (coordinator.closeOpen()) return;
    if (!onPress) return;
    onPress();
  }, [guard, coordinator, onPress]);
}

// Wisch-Wrapper mit rechter Aktion. Die SessionRow darunter hat eine deckende Fläche,
// sonst schimmerte die Aktion beim Wischen durch.
function SwipeRow({ action, children }: { action: React.ReactNode; children: React.ReactNode }) {
  // Ref statt State: der Wert wird nur im onPress-Moment gelesen, ein Re-Render wäre
  // Verschwendung. `true` ab Zieh-Beginn und solange offen; erst beim Schließen wieder frei.
  const activeRef = useRef(false);
  const guard = useMemo(() => ({ blocked: () => activeRef.current }), []);
  const coordinator = useContext(SwipeCoordinatorContext);
  // Imperatives Handle auf die Swipeable, damit der Koordinator diese Zeile schließen kann.
  const swipeRef = useRef<SwipeableMethods | null>(null);
  const openRow = useMemo<OpenRow>(() => ({ close: () => swipeRef.current?.close() }), []);

  return (
    <SwipeGuardContext.Provider value={guard}>
      <ReanimatedSwipeable
        ref={swipeRef}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        onSwipeableOpenStartDrag={() => {
          activeRef.current = true;
          // Aufziehen schließt sofort jede andere noch offene Zeile.
          coordinator.onOpen(openRow);
        }}
        onSwipeableWillOpen={() => {
          activeRef.current = true;
          coordinator.onOpen(openRow);
        }}
        onSwipeableWillClose={() => {
          activeRef.current = false;
          coordinator.onClose(openRow);
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
  Alert.alert('Leave session?', "You'll leave this session and its chat.", [
    { text: 'Stay', style: 'cancel' },
    { text: 'Leave', style: 'destructive', onPress: onConfirm },
  ]);
}

// Löschen ist unwiderruflich und trifft alle. Eigene Sessions haben von Anfang an einen
// Gruppenchat (0017) → immer die „für alle"-Copy (gleicher Wortlaut wie confirmDelete im
// Session-Detail). Nur verfügbar, solange die Session auf dem Feed ist — danach greift
// stattdessen confirmLeaveChat.
function confirmDissolve(onConfirm: () => void) {
  Alert.alert(
    'Delete session?',
    'This removes the session from the feed and the group chat for everyone.',
    [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ],
  );
}

// Nur den Chat verlassen (Host wie Aufgenommene:r), sobald die Session vom Feed gefallen
// ist — endgültig, ohne Re-Join. Session und Chat bleiben für die anderen stehen
// (leave_chat, 0023). Gleicher Wortlaut wie confirmLeaveChat im Session-Detail.
function confirmLeaveChat(onConfirm: () => void) {
  Alert.alert(
    'Leave chat?',
    "You'll leave this group chat.",
    [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: onConfirm },
    ],
  );
}

// Die EINE Session-Zeile für beide Sektionen (ADR-0012): linkes Glyph · Titel
// (Halle · Tag · Zeit) · Meta (letzte Nachricht oder Status). Das linke Glyph rendert die
// Aufrufstelle je Rolle (Krone / Avatar der Gastgeber:in / Uhr), damit die Zeile selbst
// rollen-frei bleibt. `emphasized` hebt die Meta-Zeile bei ungelesener Nachricht hervor.
// Das Tap-Ziel ist überschreibbar: Zeilen mit Chat springen dorthin (`onPress`), der Rest
// fällt auf die Session-Detailseite zurück (Requested hat keinen Chat).
function SessionRow({
  session,
  leading,
  subtitle,
  emphasized,
  pill,
  dot,
  onPress,
}: {
  session: SessionWithMeta;
  leading: React.ReactNode;
  subtitle: string;
  emphasized?: boolean;
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
      {leading}
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
          <Text
            numberOfLines={1}
            className={cn(
              'flex-1 text-[13px]',
              emphasized ? 'font-sans-medium text-rock-900' : 'font-sans text-rock-500',
            )}>
            {subtitle}
          </Text>
          {pill ?? null}
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

export default function Chats() {
  const queryClient = useQueryClient();
  const created = useMySessions();
  const participations = useMyParticipations();
  const chats = useMyChats();
  const withdraw = useWithdrawRequest();
  const dissolve = useDeleteSession();
  const leave = useLeaveSession();
  const leaveChat = useLeaveChat();
  const [refreshing, setRefreshing] = useState(false);
  const swipe = useSwipeCoordinator();

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
      // Beim Verlassen des Tabs keinen offenen Wisch-Zustand zurücklassen.
      return () => {
        swipe.closeOpen();
      };
    }, [refetchCreated, refetchParticipations, refetchChats, swipe]),
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

  // „Leave chat" (leave_chat, 0023) entfernt nur die eigene chat_members-Zeile — die
  // Session bleibt in created/participations, soll aber aus „Your Sessions" verschwinden,
  // sobald ich kein Mitglied mehr bin. useMyChats spiegelt genau meine Mitgliedschaft
  // (chatBySession), also gaten beide Quellen (mySessions/joined) darauf. Erst prüfen, wenn useMyChats
  // geladen ist (isSuccess) — sonst blitzten Zeilen beim Erstladen weg, bevor die
  // Mitgliedschaft bekannt ist (Host/Joined sind ab Erstellung/Zusage immer Mitglied).
  const stillMember = useCallback(
    (sessionId: string) => !chats.isSuccess || chatBySession.has(sessionId),
    [chats.isSuccess, chatBySession],
  );

  // Offene Anfragen je EIGENER Session (Gastgeber-Sicht) für die „N wollen mit"-Pill.
  const hostedIds = useMemo(() => (created.data ?? []).map((s) => s.id), [created.data]);
  const pendingCounts = usePendingCountsForSessions(hostedIds);

  // My Sessions = alles, was ich selbst erstellt habe (mit Chat, sobald wer dabei ist).
  // Nie-bespielte Sessions (niemand ist beigetreten UND der Chat hatte nie eine
  // Nachricht) fallen 1h nach Start raus — sie sind wie eine Session, die es nie gab.
  // Sobald aber mal jemand drin war (accepted ODER der Chat trägt Verlauf, auch wenn
  // die Person wieder ging), bleibt sie die vollen 24h (Chat-Fenster). Spiegelt den
  // pg_cron-Job 0022; „Chat hatte je eine Nachricht" = jeder Beitritt erzeugt eine
  // „X joined"-Systemzeile (0017), eine nie-bespielte Session hat einen leeren Chat.
  const mySessions = useMemo<Entry[]>(() => {
    const emptyCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    return (created.data ?? [])
      .map((s) => ({ session: s, chat: chatBySession.get(s.id) }))
      .filter(
        (e) =>
          // Nach „Leave chat" bin ich kein Mitglied mehr → Zeile fällt raus.
          stillMember(e.session.id) &&
          (e.session.accepted_count > 0 ||
            e.chat?.lastMessage != null ||
            e.session.starts_at >= emptyCutoff),
      );
  }, [created.data, chatBySession, stillMember]);

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
      (participations.data ?? [])
        // Nach „Leave chat" bin ich kein Mitglied mehr → Zeile fällt raus.
        .filter((p) => p.myStatus === 'accepted' && stillMember(p.session.id))
        .map((p) => ({ session: p.session, chat: chatBySession.get(p.session.id) })),
    [participations.data, chatBySession, stillMember],
  );

  // „Your Sessions" = eigene + beigetretene Sessions in EINER zeitlich sortierten Liste.
  // Die Rolle reist als Tag mit, damit renderEntry weiter Krone/Avatar, Pill und Delete-vs-
  // Leave rollenrichtig rendert — nur die Sektions-Überschrift entfällt. EINZIGE Sortierstelle
  // für diese Zeilen (mySessions/joined kommen ungeordnet rein): nach Termin (früh → spät),
  // damit die nächste Session oben steht, unabhängig von Rolle und Chat-Aktivität — gleicher
  // Schlüssel wie die Requested-Liste.
  const active = useMemo<{ entry: Entry; role: 'host' | 'joined' }[]>(
    () =>
      [
        ...mySessions.map((entry) => ({ entry, role: 'host' as const })),
        ...joined.map((entry) => ({ entry, role: 'joined' as const })),
      ].sort((a, b) => a.entry.session.starts_at.localeCompare(b.entry.session.starts_at)),
    [mySessions, joined],
  );

  const isLoading = created.isLoading || participations.isLoading;
  const error = (created.error ?? participations.error) as Error | null;
  const isEmpty = active.length === 0 && requested.length === 0;

  // Eine einheitliche Session-Zeile für eine eigene/beigetretene Session (ADR-0012). Jede
  // Zeile ist wischbar — rollen-abhängig: als Gastgeber:in auflösen (rot), als
  // Beigetretene:r verlassen (neutral).
  function renderEntry({ session, chat }: Entry, role: 'host' | 'joined'): Row {
    const hosting = role === 'host';
    const pendingCount = pendingCounts.data?.[session.id] ?? 0;
    const unread = chat?.unread ?? false;

    // Linkes Glyph rollen-abhängig: Hosting trägt durchgängig die Krone (identisch zum
    // Feed), Joined das Gesicht der Gastgeber:in.
    const leading = hosting ? (
      <IconTile tint="bg-brand-50" icon={<Crown size={22} color={colors.brand[600]} strokeWidth={2} />} />
    ) : (
      <Avatar
        name={session.creator?.display_name ?? 'Anonymous'}
        tone={avatarTone(session.creator?.id ?? session.id)}
        size="lg"
        src={publicImageUrl(session.creator?.avatar_path)}
      />
    );

    // Zeile 2: letzte Nachricht mit Status-Fallback. „No climbers yet" hat bei der leeren
    // eigenen Session Vorrang — „hier ist noch niemand" ist die wichtigere Info als
    // „No messages yet". Sobald wer dabei ist, greift die Chat-Vorschau (fängt zugleich
    // den ADR-0004-Fall ab: accepted_count>0, aber kein Mitglied mehr → schlicht die
    // letzte Nachricht bzw. „No messages yet").
    // Der letzten Nachricht immer den Absender voranstellen („Anna: …" / „You: …",
    // WhatsApp-Stil), damit ohne Öffnen klar ist, wer schrieb. Bewusst auch im scheinbaren
    // 1:1-Chat: eine Gruppensession kann jederzeit wachsen, dann wäre ein namensloses
    // Präfix plötzlich mehrdeutig. Fällt nur weg, wenn der Absender nicht auflösbar ist.
    const lastMsg = chat?.lastMessage;
    const preview = lastMsg
      ? lastMsg.senderName
        ? `${lastMsg.senderName}: ${lastMsg.body}`
        : lastMsg.body
      : 'No messages yet';
    const subtitle =
      hosting && session.accepted_count === 0 ? 'No climbers yet' : preview;

    const inner = (
      <SessionRow
        session={session}
        leading={leading}
        subtitle={subtitle}
        emphasized={unread}
        // Aufmerksamkeit: ungelesene Nachricht ODER offene Anfragen — dieselbe Bedingung
        // zählt der Chats-Tab-Badge (eine Zeile = ein Punkt).
        dot={unread || (hosting && pendingCount > 0)}
        pill={hosting && pendingCount > 0 ? <RequestsPill count={pendingCount} /> : undefined}
        // Chat vorhanden → dorthin (auch die leere eigene Session hat seit 0017 einen);
        // sonst fällt SessionRow auf die Session-Detailseite zurück.
        // Vor der Navigation die frischen Daten — die diese Zeile ohnehin schon hält —
        // in die Caches des Chat-Screens legen: die chatId→sessionId-Stufe, die Session
        // selbst und die Mitgliederliste. Sonst baut der Chat-Screen Status und Avatare
        // über eigene, oft noch veraltete/leere Query-Ketten neu auf und zeigt kurz den
        // alten Stand, bevor der Hintergrund-Refetch ihn ersetzt (sichtbares Umspringen).
        onPress={
          chat
            ? () => {
                queryClient.setQueryData(CHAT_SESSION_ID_KEY(chat.id), session.id);
                queryClient.setQueryData(SESSION_KEY(session.id), session);
                queryClient.setQueryData(CHAT_MEMBERS_KEY(chat.id), chat.members);
                router.push(`/chats/${chat.id}`);
              }
            : undefined
        }
      />
    );

    // Vom Feed gefallen (>1h nach Start)? Dann für BEIDE Rollen nur noch „Leave chat" —
    // absagen (Delete/Leave session) ergibt nach dem Termin keinen Sinn mehr.
    const offFeed = hasLeftFeed(session.starts_at);
    const action = offFeed ? (
      <SwipeAction
        label="Leave chat"
        tone="danger"
        icon={<LogOut size={22} color={colors.rock[0]} strokeWidth={2} />}
        onPress={() => confirmLeaveChat(() => leaveChat.mutate(session.id))}
      />
    ) : hosting ? (
      <SwipeAction
        label="Delete session"
        tone="danger"
        icon={<Trash2 size={22} color={colors.rock[0]} strokeWidth={2} />}
        onPress={() => confirmDissolve(() => dissolve.mutate(session.id))}
      />
    ) : (
      <SwipeAction
        label="Leave session"
        tone="danger"
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
        </View>
      ) : (
        <SwipeCoordinatorContext.Provider value={swipe}>
          <ScrollView
            className="flex-1"
            contentContainerClassName="pb-10"
            // Scrollen woanders schließt eine offene Wisch-Zeile.
            onScrollBeginDrag={() => swipe.closeOpen()}
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
                    <SessionRow
                      session={session}
                      leading={<IconTile tint="bg-rock-100" icon={<Clock size={22} color={colors.rock[400]} strokeWidth={2} />} />}
                      subtitle="Waiting for reply"
                    />
                  </SwipeRow>
                ),
              }))}
            />
          ) : null}

            {active.length > 0 ? (
              <Section
                title="Your Sessions"
                rows={active.map(({ entry, role }) => renderEntry(entry, role))}
              />
            ) : null}

            {/* Housekeeping-Hinweis ans Listen-Ende (nicht an den Kopf): leise Meta-Info
                zur 24h-Chat-Retention (ADR-0014), keine Aktion. Steht nur, wenn es
                überhaupt Chats gibt — der Empty-State oben braucht ihn nicht. */}
            <Text className="px-6 pt-6 text-center font-sans text-[12px] leading-4 text-rock-400">
              Chats disappear 24h after the session starts.
            </Text>
          </ScrollView>
        </SwipeCoordinatorContext.Provider>
      )}
    </SafeAreaView>
  );
}
