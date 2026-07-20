import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Hand,
  MapPin,
  MessageCircle,
  Users,
  X,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Card, GradePill, IconButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { avatarTone, formatSessionTime, gradeBand } from '@/lib/utils';
import { useChatForSession } from '@/queries/chat';
import {
  useCreateMatchRequest,
  useRequestsForSession,
  useRespondToMatchRequest,
  type MatchRequestWithRequester,
} from '@/queries/matches';
import { useSession } from '@/queries/sessions';
import { colors } from '@/theme/colors';

const SKILL_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};

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
}: {
  request: MatchRequestWithRequester;
  sessionId: string;
}) {
  const respond = useRespondToMatchRequest();
  const chat = useChatForSession(sessionId, request.status === 'accepted');

  const name = request.requester?.display_name ?? 'Anonymous';
  const skill = request.requester?.skill_level;
  const pending = respond.isPending && respond.variables?.requestId === request.id;

  async function accept() {
    const res = await respond.mutateAsync({ requestId: request.id, action: 'accept' });
    if (res.chatId) router.push(`/chats/${res.chatId}`);
  }

  return (
    <Card className="flex-row items-center gap-3 p-3">
      <Avatar name={name} tone={avatarTone(request.requester?.id ?? name)} size="md" />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-display text-[15px] text-rock-900">
          {name}
        </Text>
        {skill ? (
          <Text className="font-sans text-xs text-rock-500">{SKILL_LABEL[skill] ?? skill}</Text>
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
            disabled={pending}
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

function IncomingRequests({ sessionId }: { sessionId: string }) {
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
            <RequestRow key={req.id} request={req} sessionId={sessionId} />
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

  const isMine = user?.id === session.creator_id;
  const sent = request.isSuccess;
  const name = session.creator?.display_name ?? 'Anonymous';
  const buddies = session.max_buddies ?? 1;

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
        contentContainerStyle={{ paddingBottom: isMine ? 32 : 120 }}>
        {/* Creator */}
        <View className="mt-2 items-center">
          <Avatar name={name} tone={avatarTone(session.creator?.id ?? name)} size="xl" />
          <Text className="mt-3 font-display-bold text-[22px] text-rock-900">{name}</Text>
          <View className="mt-3">
            <GradePill grade={session.level} band={gradeBand(session.creator?.skill_level)} />
          </View>
        </View>

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
            value={buddies > 1 ? `Looking for ${buddies} buddies` : 'Looking for 1 buddy'}
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
        {isMine ? <IncomingRequests sessionId={session.id} /> : null}
      </ScrollView>

      {/* Aktionsleiste — nur für fremde Sessions. */}
      {!isMine ? (
        <View
          className="absolute inset-x-0 bottom-0 border-t border-rock-100 bg-rock-0 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}>
          {sent ? (
            <View className="h-[52px] flex-row items-center justify-center gap-2 rounded-md bg-success-surface">
              <CheckCircle2 size={16} color={colors.success} strokeWidth={2} />
              <Text className="font-sans-semibold text-base text-success">Request sent</Text>
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
