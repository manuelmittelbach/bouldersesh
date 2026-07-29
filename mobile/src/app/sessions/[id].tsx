import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Flag,
  Hand,
  LogOut,
  MapPin,
  Trash2,
  Undo2,
  UsersRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileGallery } from '@/components/ProfileGallery';
import { Avatar, Button, Card, GradePill, IconButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, formatSessionTime, gradeBand, skillLabel } from '@/lib/utils';
import {
  useCreateMatchRequest,
  useMyRequestForSession,
  useSessionClimbers,
  useWithdrawRequest,
} from '@/queries/matches';
import { useHasReported, useReportProfile } from '@/queries/reports';
import { useDeleteSession, useLeaveSession, useSession } from '@/queries/sessions';
import { colors } from '@/theme/colors';

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50">
        {icon}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-xs text-rock-500">{label}</Text>
        <Text className="font-display text-sm text-rock-900">{value}</Text>
      </View>
    </View>
  );
}

/** Eine Person in der „Climbers"-Zeile: nur der/die Ersteller:in ist immer dabei,
 *  danach folgen die angenommenen Mitkletternden. `id === null` = gelöschtes Profil
 *  (untippbar). */
type Climber = { id: string | null; name: string; avatarPath: string | null };

/** „Climbers"-Zeile im selben Info-Block-Stil wie When/Where (InfoRow), nur dass der
 *  Wert eine kleine Avatar-Reihe ist statt Text: Host zuerst, dann die Beigetretenen.
 *  Jeder Avatar ist tippbar zum read-only Profil (profile/[id]), wie die Feed-Avatare.
 *  Hinter den Avataren steht dezent, wie viele Plätze noch frei sind (`spotsLabel`) —
 *  die frühere eigene „Spots"-Zeile ist darin aufgegangen. */
function ClimbersRow({ people, spotsLabel }: { people: Climber[]; spotsLabel: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50">
        <UsersRound size={16} color={colors.brand[700]} strokeWidth={2} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans text-xs text-rock-500">Climbers</Text>
        <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
          {people.map((p) => (
            <Pressable
              key={p.id ?? p.name}
              accessibilityRole="button"
              accessibilityLabel={`View ${p.name}’s profile`}
              disabled={!p.id}
              onPress={() => p.id && router.push(`/profile/${p.id}`)}
              className="active:opacity-70">
              <Avatar
                name={p.name}
                tone={avatarTone(p.id ?? p.name)}
                size="md"
                src={publicImageUrl(p.avatarPath)}
              />
            </Pressable>
          ))}
          <Text className="ml-1 font-sans text-[13px] text-rock-500">{spotsLabel}</Text>
        </View>
      </View>
    </View>
  );
}

/** Melden eines fremden Profils. Bewusst ohne Grund-Eingabe: die Meldung soll
 *  keine Hürde haben, geprüft wird ohnehin von Hand. */
function ReportButton({ profileId, name }: { profileId: string; name: string }) {
  const { data: alreadyReported } = useHasReported(profileId);
  const report = useReportProfile();
  const done = alreadyReported || report.isSuccess;

  function confirm() {
    Alert.alert(
      `Report ${name}?`,
      'We’ll take a look at this profile. Nothing happens to it right away, and they won’t be told who reported them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => report.mutate({ reportedId: profileId }),
        },
      ],
    );
  }

  if (done) {
    return (
      <Text className="font-sans text-[13px] text-rock-400">
        You reported this profile. We’re looking into it.
      </Text>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Report ${name}`}
      disabled={report.isPending}
      onPress={confirm}
      className="flex-row items-center gap-1.5 px-3 py-2 active:opacity-60">
      <Flag size={13} color={colors.rock[400]} strokeWidth={2} />
      <Text className="font-sans text-[13px] text-rock-400">Report profile</Text>
    </Pressable>
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
  const del = useDeleteSession();

  // Ist die Session meine? Vor den frühen Returns berechnet (session evtl. noch
  // undefined → false), damit die folgenden Hooks unbedingt laufen (Hook-Regeln).
  const isMine = !!session && user?.id === session.creator_id;

  // Mein eigener Anfrage-Status an dieser fremden Session (ADR-0006). Realtime
  // lässt „Request sent" live zu „Leave session" umschlagen, wenn angenommen wird.
  const myRequest = useMyRequestForSession(id, !!session && !isMine);
  const myStatus = myRequest.data?.status;

  // Der bestätigte Kader (accepted) — die „Climbers"-Liste weiter unten. Realtime
  // hält sie live und konsistent mit „Spots left" (siehe useSessionClimbers).
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
      <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
        <View className="px-4 py-3">
          <IconButton variant="ghost" label="Back" onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.rock[700]} strokeWidth={2} />
          </IconButton>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-sans text-rock-500">
            This session doesn’t exist (anymore).
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = session.creator?.display_name ?? 'Anonymous';

  // Wer dabei ist — Host zuerst (immer, er:sie zählt zur Runde), dann die angenommenen
  // Mitkletternden. Speist die kompakte Avatar-Reihe in der „Climbers"-Zeile. Gelöschte
  // Profile (kein creator / kein requester) bleiben als untippbarer Avatar drin.
  const roster: Climber[] = [
    ...(session.creator
      ? [
          {
            id: session.creator.id,
            name,
            avatarPath: session.creator.avatar_path,
          },
        ]
      : []),
    ...(climbers ?? []).map((c) => ({
      id: c.requester?.id ?? null,
      name: c.requester?.display_name ?? 'Anonymous',
      avatarPath: c.requester?.avatar_path ?? null,
    })),
  ];

  // Plätze (ADR-0007): die Ersteller:in ist Gastgeber:in, kein Platz — es gibt also
  // capacity − 1 Plätze für Mitkletternde, jede angenommene Anfrage belegt einen. Voll,
  // wenn keiner frei ist — oder der Trigger die Session schon auf `matched` (= voll) kippt.
  const spotsTotal = session.capacity - 1;
  const spotsLeft = Math.max(0, spotsTotal - session.accepted_count);
  const full = spotsLeft === 0 || session.status === 'matched';
  // Kompakt, weil er:sie jetzt hinter den Climbers-Avataren steht (keine eigene Zeile
  // mehr): nur „N spots left" bzw. „Full" — die belegten Plätze zeigen ja die Avatare.
  const spotsLabel = full
    ? 'Full'
    : `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`;

  // Der eine untere Aktions-Platz wechselt seinen Inhalt je nach eigenem Anfrage-
  // Zustand (ADR-0006). Der geladene Status GEWINNT immer — so schlägt ein
  // Realtime-Wechsel (Ersteller:in nimmt an/lehnt ab) sofort durch. `isSuccess`
  // überbrückt nur das Fenster, bevor myRequest erstmals „pending" liefert (Status
  // noch unbekannt), damit der Button nach dem Absenden nicht zurückblitzt.
  const status = myStatus ?? (request.isSuccess ? 'pending' : undefined);
  const pending = status === 'pending';
  const accepted = status === 'accepted';
  const declined = status === 'declined';

  // Löschen ist endgültig (Row weg, Chat via Cascade mit) → immer bestätigen. Die
  // Copy passt sich der Zahl bereits Beigetretener an: sind Leute dabei, benennen wir
  // den Preis (sie verlieren Session und Gruppenchat) statt ihn zu verschweigen.
  function confirmDelete() {
    // Gleiche Copy wie der „Delete session"-Swipe im Chats-Tab (confirmDissolve),
    // damit dieselbe Handlung an beiden Stellen identisch klingt. Eigene Sessions
    // haben immer einen Gruppenchat, sobald jemand beigetreten ist.
    const body =
      session!.accepted_count > 0
        ? 'This removes the session and the group chat for everyone.'
        : 'This removes the session for good.';
    Alert.alert('Delete session?', body, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          del.mutate(session!.id, {
            onSuccess: () => router.back(),
            onError: () =>
              Alert.alert('Couldn’t delete', 'Something went wrong. Please try again.'),
          }),
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <View className="px-4 py-2">
        <IconButton variant="ghost" label="Back" onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.rock[700]} strokeWidth={2} />
        </IconButton>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingBottom: declined ? 32 : 160 }}>
        {/* Creator — tippbar zum read-only Profil (profile/[id]). Ist die
            Ersteller:in gelöscht (kein creator), bleibt der Block untippbar. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${name}’s profile`}
          disabled={!session.creator?.id}
          onPress={() =>
            session.creator?.id && router.push(`/profile/${session.creator.id}`)
          }
          className="mt-2 items-center active:opacity-70">
          <Avatar
            name={name}
            tone={avatarTone(session.creator?.id ?? name)}
            size="xl"
            src={publicImageUrl(session.creator?.avatar_path)}
          />
          <Text className="mt-3 font-display-bold text-[22px] text-rock-900">{name}</Text>
          {/* Pill = Niveau der Ersteller:in (ADR-0005). Kein Niveau gesetzt → kein Pill. */}
          {skillLabel(session.creator?.skill_level) ? (
            <View className="mt-3">
              <GradePill
                grade={skillLabel(session.creator?.skill_level)!}
                band={gradeBand(session.creator?.skill_level)}
              />
            </View>
          ) : null}
        </Pressable>

        {/* Galeriefotos der Ersteller:in. Der Creator-Block oben führt zum vollen
            (read-only) Profil-Screen; die Galerie steht hier zusätzlich im Kontext. */}
        {session.creator?.gallery_paths?.length ? (
          <View className="mt-5">
            <ProfileGallery paths={session.creator.gallery_paths} />
          </View>
        ) : null}

        {/* Melden — nur bei fremden Sessions, und unauffällig: die Meldung ist
            der Ausnahmefall, nicht die angebotene Handlung. */}
        {!isMine && session.creator ? (
          <View className="mt-4 items-center">
            <ReportButton profileId={session.creator.id} name={name} />
          </View>
        ) : null}

        {/* Info-Block */}
        <Card className="mt-6 gap-3.5">
          <InfoRow
            icon={<Calendar size={16} color={colors.brand[700]} strokeWidth={2} />}
            label="When"
            value={formatSessionTime(session.starts_at)}
          />
          <InfoRow
            icon={<MapPin size={16} color={colors.brand[700]} strokeWidth={2} />}
            label="Where"
            value={session.gym?.name ?? '—'}
          />
          {/* Climbers — kleine Avatare im selben Info-Block-Stil, Host zuerst, dahinter
              die freien Plätze (spotsLabel). Wächst per Realtime live
              (useSessionClimbers); Host ist immer dabei, also steht die Zeile immer. */}
          {roster.length > 0 ? (
            <ClimbersRow people={roster} spotsLabel={spotsLabel} />
          ) : null}
        </Card>

        {session.note ? (
          <View className="mt-4 rounded-lg bg-rock-50 p-4">
            <Text className="mb-1.5 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
              Note
            </Text>
            <Text className="font-sans text-sm leading-6 text-rock-700">{session.note}</Text>
          </View>
        ) : null}

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
          style={{ paddingBottom: insets.bottom + 12 }}>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            loading={del.isPending}
            icon={<Trash2 size={16} color={colors.danger} strokeWidth={2} />}
            onPress={confirmDelete}>
            <Text className="font-sans-semibold text-[15px] text-danger">Delete session</Text>
          </Button>
        </View>
      ) : !declined ? (
        <View
          className="absolute inset-x-0 bottom-0 border-t border-rock-100 bg-rock-0 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}>
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
                <CheckCircle2 size={16} color={colors.success} strokeWidth={2} />
                <Text className="font-sans-semibold text-base text-success">Request sent</Text>
              </View>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                loading={withdraw.isPending}
                icon={<Undo2 size={16} color={colors.rock[500]} strokeWidth={2} />}
                onPress={() =>
                  Alert.alert('Withdraw request?', undefined, [
                    { text: 'Keep', style: 'cancel' },
                    {
                      text: 'Withdraw',
                      style: 'destructive',
                      // Zurück zum Ausgangs-Tab (Sessions oder Chats) — die Detailseite
                      // liegt über den Tabs, back enthüllt also den richtigen.
                      onPress: () => withdraw.mutate(session.id, { onSuccess: () => router.back() }),
                    },
                  ])
                }>
                <Text className="font-sans-semibold text-[15px] text-rock-500">
                  Withdraw request
                </Text>
              </Button>
            </View>
          ) : accepted ? (
            // Aufgenommen: nur austreten (den Chat erreicht man über den Chats-Tab).
            // Verlassen setzt die eigene Anfrage auf `cancelled` (Realtime kippt diesen
            // Block danach auf „Climb together?" zurück) und gibt den Platz frei —
            // Wiedereintritt bleibt möglich.
            <View className="gap-2">
              <Button
                variant="ghost"
                size="md"
                fullWidth
                loading={leave.isPending}
                icon={<LogOut size={16} color={colors.danger} strokeWidth={2} />}
                onPress={() =>
                  // Gleiche Copy und Optik (rot + LogOut) wie der „Leave session"-Swipe
                  // im Chats-Tab (confirmLeave), damit die Handlung überall gleich wirkt.
                  Alert.alert('Leave session?', "You'll leave this session and its chat.", [
                    { text: 'Stay', style: 'cancel' },
                    {
                      text: 'Leave',
                      style: 'destructive',
                      // Zurück zum Ausgangs-Tab (Sessions oder Chats) — s. o.
                      onPress: () => leave.mutate(session.id, { onSuccess: () => router.back() }),
                    },
                  ])
                }>
                <Text className="font-sans-semibold text-[15px] text-danger">Leave session</Text>
              </Button>
            </View>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={request.isPending}
                icon={<Hand size={18} color={colors.rock[0]} strokeWidth={2} />}
                onPress={() => request.mutate(session.id)}>
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
