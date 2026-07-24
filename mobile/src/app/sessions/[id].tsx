import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Flag,
  Hand,
  MapPin,
  MessageCircle,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileGallery } from '@/components/ProfileGallery';
import { Avatar, Button, Card, GradePill, IconButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, formatSessionTime, gradeBand, skillLabel } from '@/lib/utils';
import { useChatForSession } from '@/queries/chat';
import {
  useCreateMatchRequest,
  useMyRequestForSession,
  useRequestsForSession,
  useRespondToMatchRequest,
  useWithdrawRequest,
  type MatchRequestWithRequester,
} from '@/queries/matches';
import { useHasReported, useReportProfile } from '@/queries/reports';
import { useDeleteSession, useSession } from '@/queries/sessions';
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

/** Eine eingehende Anfrage mit Annehmen/Ablehnen — oder ihrem aufgelösten Zustand. */
function RequestRow({
  request,
  sessionId,
  full,
}: {
  request: MatchRequestWithRequester;
  sessionId: string;
  /** Session ist voll — keine Annahme mehr möglich (Gürtel-und-Hosenträger; volle
   *  Sessions haben ohnehin keine pending Anfragen mehr, ADR-0007). */
  full: boolean;
}) {
  const respond = useRespondToMatchRequest();
  const chat = useChatForSession(sessionId, request.status === 'accepted');

  const name = request.requester?.display_name ?? 'Anonymous';
  const skill = request.requester?.skill_level;
  const pending = respond.isPending && respond.variables?.requestId === request.id;

  async function accept() {
    if (full) return;
    const res = await respond.mutateAsync({ requestId: request.id, action: 'accept' });
    if (res.chatId) router.push(`/chats/${res.chatId}`);
  }

  return (
    <Card className="flex-row items-center gap-3 p-3">
      <Avatar
        name={name}
        tone={avatarTone(request.requester?.id ?? name)}
        size="md"
        src={publicImageUrl(request.requester?.avatar_path)}
      />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-display text-[15px] text-rock-900">
          {name}
        </Text>
        {skill ? (
          <Text className="font-sans text-xs text-rock-500">{skillLabel(skill) ?? skill}</Text>
        ) : null}
      </View>

      {request.status === 'pending' ? (
        <View className="flex-row items-center gap-2">
          <IconButton
            variant="soft"
            size="md"
            label="Decline"
            disabled={pending}
            onPress={() => respond.mutate({ requestId: request.id, action: 'decline' })}>
            <X size={20} color={colors.rock[500]} strokeWidth={2} />
          </IconButton>
          <IconButton
            variant="brand"
            size="md"
            label="Accept"
            disabled={pending || full}
            onPress={accept}>
            <Check size={20} color={colors.rock[0]} strokeWidth={2.5} />
          </IconButton>
        </View>
      ) : request.status === 'accepted' ? (
        chat.data ? (
          <Button
            variant="ghost"
            size="sm"
            className="bg-brand-50"
            icon={<MessageCircle size={16} color={colors.brand[700]} strokeWidth={2} />}
            onPress={() => router.push(`/chats/${chat.data}`)}>
            <Text className="font-sans-semibold text-[13px] text-brand-700">Chat</Text>
          </Button>
        ) : (
          <View className="flex-row items-center gap-1.5">
            <CheckCircle2 size={16} color={colors.success} strokeWidth={2} />
            <Text className="font-sans-semibold text-[13px] text-success">Accepted</Text>
          </View>
        )
      ) : (
        <Text className="font-sans text-[13px] text-rock-400">Declined</Text>
      )}
    </Card>
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

function IncomingRequests({ sessionId, full }: { sessionId: string; full: boolean }) {
  const { data: requests, isLoading } = useRequestsForSession(sessionId);

  return (
    <View className="mt-8">
      <View className="mb-2 flex-row items-center gap-1.5">
        <Users size={14} color={colors.rock[500]} strokeWidth={2} />
        <Text className="font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
          Requests
        </Text>
      </View>

      {isLoading ? (
        <Text className="py-4 font-sans text-sm text-rock-400">Loading…</Text>
      ) : requests && requests.length > 0 ? (
        <View className="gap-2.5">
          {requests.map((req) => (
            <RequestRow key={req.id} request={req} sessionId={sessionId} full={full} />
          ))}
        </View>
      ) : (
        <View className="rounded-lg bg-rock-50 p-4">
          <Text className="font-sans text-sm leading-5 text-rock-500">
            No requests yet. As soon as someone wants to join, it shows up here.
          </Text>
        </View>
      )}
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
  const del = useDeleteSession();

  // Ist die Session meine? Vor den frühen Returns berechnet (session evtl. noch
  // undefined → false), damit die folgenden Hooks unbedingt laufen (Hook-Regeln).
  const isMine = !!session && user?.id === session.creator_id;

  // Mein eigener Anfrage-Status an dieser fremden Session (ADR-0006). Realtime
  // lässt „Request sent" live zu „Open chat" umschlagen, wenn angenommen wird.
  const myRequest = useMyRequestForSession(id, !!session && !isMine);
  const myStatus = myRequest.data?.status;
  const chat = useChatForSession(id, myStatus === 'accepted');

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

  // Plätze (ADR-0007): die Ersteller:in ist Gastgeber:in, kein Platz — es gibt also
  // capacity − 1 Plätze für Mitkletternde, jede angenommene Anfrage belegt einen. Voll,
  // wenn keiner frei ist — oder der Trigger die Session schon auf `matched` (= voll) kippt.
  const spotsTotal = session.capacity - 1;
  const spotsLeft = Math.max(0, spotsTotal - session.accepted_count);
  const full = spotsLeft === 0 || session.status === 'matched';
  const spotsLabel = full
    ? 'Full'
    : `${spotsLeft} of ${spotsTotal} ${spotsTotal === 1 ? 'spot' : 'spots'} left`;

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
    const joined = session!.accepted_count;
    const body =
      joined > 0
        ? `${joined} ${joined === 1 ? 'climber' : 'climbers'} already joined. They’ll lose the session and the group chat. This can’t be undone.`
        : 'It’ll be removed from the feed. This can’t be undone.';
    Alert.alert('Delete this session?', body, [
      { text: 'Cancel', style: 'cancel' },
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
        contentContainerStyle={{ paddingBottom: isMine ? 32 : 160 }}>
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
          <InfoRow
            icon={<Users size={16} color={colors.brand[700]} strokeWidth={2} />}
            label="Spots"
            value={spotsLabel}
          />
        </Card>

        {session.note ? (
          <View className="mt-4 rounded-lg bg-rock-50 p-4">
            <Text className="mb-1.5 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
              Note
            </Text>
            <Text className="font-sans text-sm leading-6 text-rock-700">{session.note}</Text>
          </View>
        ) : null}

        {/* Owner: eingehende Anfragen annehmen/ablehnen. */}
        {isMine ? <IncomingRequests sessionId={session.id} full={full} /> : null}

        {/* Owner: Session löschen. Bewusst am Ende und dezent — die Absage ist der
            Ausnahmefall, nicht die angebotene Handlung (wie „Report profile"). */}
        {isMine ? (
          <View className="mt-10 items-center">
            <Button
              variant="ghost"
              size="md"
              loading={del.isPending}
              icon={<Trash2 size={16} color={colors.danger} strokeWidth={2} />}
              onPress={confirmDelete}>
              <Text className="font-sans-semibold text-[15px] text-danger">Delete session</Text>
            </Button>
          </View>
        ) : null}
      </ScrollView>

      {/* Aktionsleiste — nur für fremde Sessions. Ein Platz, Inhalt je Zustand
          (ADR-0006): laden → still, pending → „Request sent", accepted → „Open
          chat", declined → dezent, sonst der „Climb together?"-Button. */}
      {!isMine ? (
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
                onPress={() =>
                  Alert.alert('Withdraw request?', undefined, [
                    { text: 'Keep', style: 'cancel' },
                    {
                      text: 'Withdraw',
                      style: 'destructive',
                      onPress: () => withdraw.mutate(session.id),
                    },
                  ])
                }>
                <Text className="font-sans-semibold text-[15px] text-rock-500">
                  Withdraw request
                </Text>
              </Button>
            </View>
          ) : accepted ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              // Nur solange der Chat wirklich noch lädt spinnen. Löst er (selten)
              // auf null auf, bleibt der Button tippbar und versucht es erneut,
              // statt ewig zu drehen.
              loading={chat.isLoading}
              icon={<MessageCircle size={18} color={colors.rock[0]} strokeWidth={2} />}
              onPress={() =>
                chat.data ? router.push(`/chats/${chat.data}`) : chat.refetch()
              }>
              Open chat
            </Button>
          ) : declined ? (
            <View className="h-[52px] items-center justify-center">
              <Text className="font-sans text-sm text-rock-400">Not this time</Text>
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
