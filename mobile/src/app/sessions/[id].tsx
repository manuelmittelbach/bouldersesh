import { router, useLocalSearchParams } from "expo-router";
import {
  Calendar,
  CheckCircle2,
  Crown,
  Hand,
  LogOut,
  MapPin,
  Pencil,
  Trash2,
  UsersRound,
} from "lucide-react-native";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Avatar, Button, Card, GradePill, ScreenHeader } from "@/components/ui";
import { isHostedBy, spotsLabel } from "@/domain/session";
import { useAuth } from "@/hooks/useAuth";
import { publicImageUrl } from "@/lib/images";
import {
  avatarTone,
  formatSessionTime,
  gradeBand,
  hasLeftFeed,
  skillLabel,
} from "@/lib/utils";
import {
  useCreateMatchRequest,
  useMyRequestForSession,
  useSessionClimbers,
  useWithdrawRequest,
} from "@/queries/matches";
import {
  useDeleteSession,
  useLeaveChat,
  useLeaveSession,
  useSession,
} from "@/queries/sessions";
import { colors } from "@/theme/colors";

function InfoRow({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50">
        {icon}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-display text-sm text-rock-900">{value}</Text>
      </View>
    </View>
  );
}

/** Eine Person in der „Buddies"-Zeile: die angenommenen Mitkletternden (ohne den/die
 *  Ersteller:in). `id === null` = gelöschtes Profil (untippbar). */
type Buddy = { id: string | null; name: string; avatarPath: string | null };

/** „Buddies"-Zeile im selben Info-Block-Stil wie When/Where (InfoRow), nur dass der
 *  Wert eine kleine Avatar-Reihe ist statt Text: die Beigetretenen (ohne Host).
 *  Jeder Avatar ist tippbar zum read-only Profil (profile/[id]), wie die Feed-Avatare.
 *  Hinter den Avataren steht dezent, wie viele Plätze noch frei sind (`spotsLabel`) —
 *  die frühere eigene „Spots"-Zeile ist darin aufgegangen. */
function BuddiesRow({
  people,
  spotsLabel,
}: {
  people: Buddy[];
  spotsLabel: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50">
        <UsersRound size={16} color={colors.brand[700]} strokeWidth={2} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center gap-1.5">
          {people.map((p) => (
            <Pressable
              key={p.id ?? p.name}
              accessibilityRole="button"
              accessibilityLabel={`View ${p.name}’s profile`}
              disabled={!p.id}
              onPress={() => p.id && router.push(`/profile/${p.id}`)}
              className="active:opacity-70"
            >
              <Avatar
                name={p.name}
                tone={avatarTone(p.id ?? p.name)}
                size="md"
                src={publicImageUrl(p.avatarPath)}
              />
            </Pressable>
          ))}
          <Text className="ml-1 font-sans text-[13px] text-rock-500">
            {spotsLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: session, isLoading } = useSession(id);
  const { user } = useAuth();
  const request = useCreateMatchRequest();
  const withdraw = useWithdrawRequest();
  const leave = useLeaveSession();
  const leaveChat = useLeaveChat();
  const del = useDeleteSession();

  // Ist die Session meine? Vor den frühen Returns berechnet (session evtl. noch
  // undefined → false), damit die folgenden Hooks unbedingt laufen (Hook-Regeln).
  const isMine = !!session && isHostedBy(session, user?.id);

  // Mein eigener Anfrage-Status an dieser fremden Session (ADR-0006). Wie die ganze
  // Seite ein Snapshot beim Öffnen — eine Annahme zeigt sich beim nächsten Öffnen;
  // sofort melden sie Push und Chats-Tab (siehe useMyRequestForSession).
  const myRequest = useMyRequestForSession(id, !!session && !isMine);
  const myStatus = myRequest.data?.status;

  // Der bestätigte Kader (accepted) — die „Buddies"-Liste weiter unten. Lädt wie
  // useSession bei jedem Öffnen frisch und bleibt dann stehen (useSessionClimbers).
  const { data: climbers } = useSessionClimbers(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-rock-25">
        <ActivityIndicator color={colors.brand[500]} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
        <ScreenHeader />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-sans text-rock-500">
            This session doesn’t exist (anymore).
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = session.creator?.display_name ?? "Anonymous";

  // Wer beigetreten ist — nur die angenommenen Mitkletternden (der/die Ersteller:in
  // steht als Host oben im Screen, nicht mehr in dieser Reihe). Speist die kompakte
  // Avatar-Reihe in der „Buddies"-Zeile. Gelöschte Profile (kein requester) bleiben
  // als untippbarer Avatar drin.
  const roster: Buddy[] = (climbers ?? []).map((c) => ({
    id: c.requester?.id ?? null,
    name: c.requester?.display_name ?? "Anonymous",
    avatarPath: c.requester?.avatar_path ?? null,
  }));

  // Plätze und „Full"-Label fragt jetzt das Session-Modul (domain/session): capacity − 1
  // Plätze (die Ersteller:in ist Gastgeber:in, kein Platz, ADR-0007), voll bei 0 freien
  // ODER `matched` — dieselbe eine Regel wie Feed und Chat. Kompakt hinter den Climbers-
  // Avataren: nur „N spots left" bzw. „Full", die belegten Plätze zeigen ja die Avatare.
  const spots = spotsLabel(session);

  // Der eine untere Aktions-Platz wechselt seinen Inhalt je nach eigenem Anfrage-
  // Zustand (ADR-0006). Der geladene Status GEWINNT immer — so schlägt der frisch
  // geladene Stand (Mount-Refetch bzw. eigene Mutation) sofort durch. `isSuccess`
  // überbrückt nur das Fenster, bevor myRequest erstmals „pending" liefert (Status
  // noch unbekannt), damit der Button nach dem Absenden nicht zurückblitzt.
  const status = myStatus ?? (request.isSuccess ? "pending" : undefined);
  const pending = status === "pending";
  const accepted = status === "accepted";
  const declined = status === "declined";

  // Ist die Session vom Feed gefallen (>1h nach Start)? Dann ist „Absagen" (Delete/
  // Leave session) vorbei — der Plan ist gelaufen. Die untere Aktion wird für Host UND
  // Aufgenommene zum stillen „Leave chat" (die Session bleibt für die anderen stehen).
  const offFeed = hasLeftFeed(session.starts_at);

  // Löschen ist endgültig (Row weg, Chat via Cascade mit) → immer bestätigen. Die
  // Copy passt sich der Zahl bereits Beigetretener an: sind Leute dabei, benennen wir
  // den Preis (sie verlieren Session und Gruppenchat) statt ihn zu verschweigen.
  function confirmDelete() {
    // Gleiche Copy wie der „Delete session"-Swipe im Chats-Tab (confirmDissolve),
    // damit dieselbe Handlung an beiden Stellen identisch klingt. Eigene Sessions
    // haben von Anfang an einen Gruppenchat → immer die „für alle"-Copy.
    Alert.alert(
      "Delete session?",
      "This removes the session from the feed and the group chat for everyone.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            del.mutate(session!.id, {
              onSuccess: () => router.back(),
              onError: () =>
                Alert.alert(
                  "Couldn’t delete",
                  "Something went wrong. Please try again.",
                ),
            }),
        },
      ],
    );
  }

  // Nur den Chat verlassen (Host wie Aufgenommene:r), sobald die Session vom Feed ist —
  // endgültig, ohne Re-Join. Session und Chat bleiben für die anderen stehen (leave_chat,
  // 0023). Gleiche Copy wie der „Leave chat"-Swipe im Chats-Tab (confirmLeaveChat).
  function confirmLeaveChat() {
    Alert.alert(
      "Leave chat?",
      "You'll leave this group chat.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () =>
            leaveChat.mutate(session!.id, {
              onSuccess: () => router.back(),
              onError: () =>
                Alert.alert(
                  "Couldn’t leave",
                  "Something went wrong. Please try again.",
                ),
            }),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
      <ScreenHeader />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: declined ? 32 : 160 }}
      >
        {/* Host-Karte: ersetzt den früheren großen Hero oben. Mini-Avatar + Name +
            „Host"-Pill machen die/den Gastgeber:in eindeutig (der Kader steht separat im
            Info-Block darunter). Die ganze Kopfzeile ist — wie zuvor der Hero — tippbar
            zum read-only Profil (profile/[id]); gelöschter Creator → untippbar. Ist eine
            Notiz gesetzt, steht sie als deren „Stimme" darunter: linksbündiger Fließtext
            wie im Feed. */}
        {/* Ganze Karte ist der Touch-Target zum Host-Profil – nicht nur die
            Kopfzeile. Card mit onPress wird selbst zum Pressable (Padding inkl.,
            Press-Scale). Gelöschter Creator → kein onPress, also untippbar. */}
        <Card
          className="mt-2 gap-3"
          accessibilityRole="button"
          accessibilityLabel={`View ${name}’s profile`}
          onPress={
            session.creator?.id
              ? () => router.push(`/profile/${session.creator!.id}`)
              : undefined
          }
        >
          <View className="flex-row items-center gap-3">
            <Avatar
              name={name}
              tone={avatarTone(session.creator?.id ?? name)}
              size="md"
              src={publicImageUrl(session.creator?.avatar_path)}
            />
            <View className="min-w-0 flex-1">
              {/* Host-Kennzeichnung als Eyebrow über dem Namen (Krone + „Host", Brand). */}
              <View className="flex-row items-center gap-1">
                <Crown size={12} color={colors.brand[600]} strokeWidth={2.5} />
                <Text className="font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-brand-700">
                  Host
                </Text>
              </View>
              <Text
                numberOfLines={1}
                className="mt-0.5 font-display text-[17px] text-rock-900"
              >
                {name}
              </Text>
            </View>
            {/* Skill-Level dort, wo vorher das Host-Pill saß (oben rechts). Kein Niveau
                → kein Pill. */}
            {skillLabel(session.creator?.skill_level) ? (
              <GradePill
                grade={skillLabel(session.creator?.skill_level)!}
                band={gradeBand(session.creator?.skill_level)}
              />
            ) : null}
          </View>
          {session.note ? (
            <Text className="font-sans text-[15px] leading-6 text-rock-700">
              {session.note}
            </Text>
          ) : null}
        </Card>

        {/* Info-Block */}
        <Card className="mt-6 gap-3.5">
          <InfoRow
            icon={
              <Calendar size={16} color={colors.brand[700]} strokeWidth={2} />
            }
            value={formatSessionTime(session.starts_at)}
          />
          <InfoRow
            icon={
              <MapPin size={16} color={colors.brand[700]} strokeWidth={2} />
            }
            value={session.gym?.name ?? "—"}
          />
          {/* Buddies — kleine Avatare im selben Info-Block-Stil (ohne Host), dahinter
              die freien Plätze (spotsLabel). Frisch bei jedem Öffnen der Seite
              (useSessionClimbers). Steht immer, damit „N spots left" auch dann sichtbar
              bleibt, wenn noch niemand beigetreten ist. */}
          <BuddiesRow people={roster} spotsLabel={spots} />
        </Card>

        {/* Beitritts-Anfragen leben seit 0017 allein im Chat (oben angeheftet), nicht
            mehr hier — jede eigene Session hat von Anfang an einen Chat. Von hier
            führt der Chat-Einstieg über die Chats-Zeile bzw. den Info-Button im Chat. */}
      </ScrollView>

      {/* Aktionsleiste — ein fester Platz am unteren Rand, Inhalt je Zustand
          (ADR-0006): eigene Session → „Delete session"; sonst laden → still,
          pending → „Request sent", accepted → „Leave session", declined → dezent
          (keine Leiste), sonst der „Climb together?"-Button. Delete und Leave sitzen
          bewusst an derselben Stelle. */}
      {isMine ? (
        <View
          className="absolute inset-x-0 bottom-0 border-t border-rock-100 bg-rock-0 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {offFeed ? (
            // Session vom Feed → nicht mehr absagen, nur noch still den Chat verlassen.
            <Button
              variant="ghost"
              size="md"
              fullWidth
              loading={leaveChat.isPending}
              icon={<LogOut size={16} color={colors.danger} strokeWidth={2} />}
              onPress={confirmLeaveChat}
            >
              <Text className="font-sans-semibold text-[15px] text-danger">
                Leave chat
              </Text>
            </Button>
          ) : (
            // Edit + Delete (ADR-0017): Edit ist die konstruktive Zweit-Handlung im
            // selben Zeitfenster wie Delete — vorausgefülltes Formular, gleiche Route
            // wie aus Feed-Sheet und Chats-Swipe.
            <View className="gap-1">
              <Button
                variant="ghost"
                size="md"
                fullWidth
                icon={<Pencil size={16} color={colors.rock[700]} strokeWidth={2} />}
                onPress={() => router.push(`/sessions/edit/${session.id}`)}
              >
                <Text className="font-sans-semibold text-[15px] text-rock-900">
                  Edit session
                </Text>
              </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                loading={del.isPending}
                icon={<Trash2 size={16} color={colors.danger} strokeWidth={2} />}
                onPress={confirmDelete}
              >
                <Text className="font-sans-semibold text-[15px] text-danger">
                  Delete session
                </Text>
              </Button>
            </View>
          )}
        </View>
      ) : !declined ? (
        <View
          className="absolute inset-x-0 bottom-0 border-t border-rock-100 bg-rock-0 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {myRequest.isLoading ? (
            // Kein Button-Flackern, solange der eigene Status noch lädt.
            <View className="h-[52px] items-center justify-center">
              <ActivityIndicator color={colors.brand[500]} />
            </View>
          ) : pending ? (
            // „Request sent" + Zurückziehen: hat man mehrere Sessions angefragt und
            // wird nur bei einer angenommen, tritt man hier von den anderen zurück
            // (ADR-0006). Zurückziehen ist umkehrbar → danach wieder der Button.
            <View className="gap-2">
              <View className="h-[52px] flex-row items-center justify-center gap-2 rounded-md bg-success-surface">
                <CheckCircle2
                  size={16}
                  color={colors.success}
                  strokeWidth={2}
                />
                <Text className="font-sans-semibold text-base text-success">
                  Request sent
                </Text>
              </View>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                loading={withdraw.isPending}
                onPress={() =>
                  Alert.alert("Withdraw request?", undefined, [
                    { text: "Keep", style: "cancel" },
                    {
                      text: "Withdraw",
                      style: "destructive",
                      // Zurück zum Ausgangs-Tab (Sessions oder Chats) — die Detailseite
                      // liegt über den Tabs, back enthüllt also den richtigen.
                      onPress: () =>
                        withdraw.mutate(session.id, {
                          onSuccess: () => router.back(),
                        }),
                    },
                  ])
                }
              >
                <Text className="font-sans-semibold text-[15px] text-rock-500">
                  Withdraw request
                </Text>
              </Button>
            </View>
          ) : accepted ? (
            // Aufgenommen: nur austreten (den Chat erreicht man über den Chats-Tab).
            // Vor dem Feed-Ende ist es „Leave session" — setzt die eigene Anfrage auf
            // `cancelled` (die Mutations-Invalidierung in useLeaveSession kippt diesen
            // Block auf „Climb together?" zurück), gibt den Platz frei, Wiedereintritt
            // bleibt möglich. Ist die
            // Session vom Feed gefallen (>1h nach Start), gibt es nichts mehr freizugeben:
            // dann nur noch „Leave chat" — endgültig, ohne Re-Join (wie beim Host).
            <View className="gap-2">
              {offFeed ? (
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  loading={leaveChat.isPending}
                  icon={
                    <LogOut size={16} color={colors.danger} strokeWidth={2} />
                  }
                  onPress={confirmLeaveChat}
                >
                  <Text className="font-sans-semibold text-[15px] text-danger">
                    Leave chat
                  </Text>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  loading={leave.isPending}
                  icon={
                    <LogOut size={16} color={colors.danger} strokeWidth={2} />
                  }
                  onPress={() =>
                    // Gleiche Copy und Optik (rot + LogOut) wie der „Leave session"-Swipe
                    // im Chats-Tab (confirmLeave), damit die Handlung überall gleich wirkt.
                    Alert.alert(
                      "Leave session?",
                      "You'll leave this session and its chat.",
                      [
                        { text: "Stay", style: "cancel" },
                        {
                          text: "Leave",
                          style: "destructive",
                          // Zurück zum Ausgangs-Tab (Sessions oder Chats) — s. o.
                          onPress: () =>
                            leave.mutate(session.id, {
                              onSuccess: () => router.back(),
                            }),
                        },
                      ],
                    )
                  }
                >
                  <Text className="font-sans-semibold text-[15px] text-danger">
                    Leave session
                  </Text>
                </Button>
              )}
            </View>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={request.isPending}
                icon={<Hand size={18} color={colors.rock[0]} strokeWidth={2} />}
                onPress={() => request.mutate(session.id)}
              >
                Climb together?
              </Button>
              {request.isError ? (
                <Text className="mt-2 text-center font-sans text-sm text-danger">
                  Request failed. Maybe you already asked?
                </Text>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
