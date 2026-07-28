import { router } from 'expo-router';
import { Check, CheckCircle2, MessageCircle, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Button, Card, IconButton } from '@/components/ui';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, skillLabel } from '@/lib/utils';
import { useChatForSession } from '@/queries/chat';
import { useRespondToMatchRequest, type MatchRequestWithRequester } from '@/queries/matches';
import { colors } from '@/theme/colors';

/**
 * Eine eingehende Anfrage mit Annehmen/Ablehnen — oder ihrem aufgelösten Zustand.
 * Geteilt zwischen Session-Detail und dem oben angehefteten Anfragen-Block im Chat.
 */
export function RequestRow({
  request,
  sessionId,
  full,
  /**
   * Nach dem Annehmen in den (frisch erstellten) Chat springen. Im Session-Detail
   * gewünscht; im Chat selbst NICHT — man ist schon drin, die neue Person taucht per
   * System-Zeile auf, ein erneuter Push auf denselben Chat wäre nur ein Doppel-Screen.
   */
  openChatOnAccept = true,
}: {
  request: MatchRequestWithRequester;
  sessionId: string;
  /** Session ist voll — keine Annahme mehr möglich (Gürtel-und-Hosenträger; volle
   *  Sessions haben ohnehin keine pending Anfragen mehr, ADR-0007). */
  full: boolean;
  openChatOnAccept?: boolean;
}) {
  const respond = useRespondToMatchRequest();
  const chat = useChatForSession(sessionId, request.status === 'accepted');

  const name = request.requester?.display_name ?? 'Anonymous';
  const skill = request.requester?.skill_level;
  const pending = respond.isPending && respond.variables?.requestId === request.id;

  async function accept() {
    if (full) return;
    const res = await respond.mutateAsync({ requestId: request.id, action: 'accept' });
    if (openChatOnAccept && res.chatId) router.push(`/chats/${res.chatId}`);
  }

  return (
    <Card className="flex-row items-center gap-3 p-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${name}’s profile`}
        disabled={!request.requester?.id}
        onPress={() => request.requester?.id && router.push(`/profile/${request.requester.id}`)}
        className="active:opacity-70">
        <Avatar
          name={name}
          tone={avatarTone(request.requester?.id ?? name)}
          size="md"
          src={publicImageUrl(request.requester?.avatar_path)}
        />
      </Pressable>
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
