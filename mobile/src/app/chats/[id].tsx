import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Users } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBubble } from '@/components/MessageBubble';
import { RequestRow } from '@/components/RequestRow';
import { Avatar, IconButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, formatClock } from '@/lib/utils';
import {
  useChatMembers,
  useMessages,
  useSendMessage,
  useSessionIdForChat,
} from '@/queries/chat';
import { useRequestsForSession } from '@/queries/matches';
import { useSession } from '@/queries/sessions';
import type { Message } from '@/types/database';
import { colors } from '@/theme/colors';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(id);
  const { data: members } = useChatMembers(id);
  const send = useSendMessage(id);

  // Zu welcher Session gehört dieser Chat — und bin ich die Gastgeber:in? Dann werden
  // die offenen Beitritts-Anfragen oben angeheftet (Annehmen/Ablehnen direkt hier),
  // statt in die Session-Detailseite abzuspringen.
  const { data: sessionId } = useSessionIdForChat(id);
  const { data: session } = useSession(sessionId ?? undefined);
  const isHost = !!session && !!user?.id && session.creator_id === user.id;
  const { data: requests } = useRequestsForSession(isHost && sessionId ? sessionId : undefined);
  const pendingRequests = (requests ?? []).filter((r) => r.status === 'pending');
  // Voll: keine freien Plätze mehr (capacity − 1 Mitkletternde) oder Trigger hat auf
  // „matched" gekippt — dann ist Annehmen gesperrt (ADR-0007).
  const spotsTotal = session ? session.capacity - 1 : 0;
  const full =
    !!session && (session.status === 'matched' || session.accepted_count >= spotsTotal);

  const memberById = new Map((members ?? []).map((m) => [m.id, m]));
  // Der Kopf zeigt die *anderen* Mitglieder (ADR-0007) als Avatar+Name-Leiste — jede
  // Person tippbar zu ihrem Profil. Hat sich das einzige Gegenüber gelöscht, ist der
  // Chat nur noch ich → generisches „Chat“ (ADR-0004).
  const others = (members ?? []).filter((m) => m.id !== user?.id);
  const [body, setBody] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  async function submit() {
    const text = body.trim();
    if (!text || send.isPending) return;
    setBody('');
    try {
      await send.mutateAsync(text);
    } catch {
      setBody(text); // bei Fehler den Text zurückgeben, damit nichts verloren geht
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-1 border-b border-rock-100 px-3 pb-2">
        <IconButton variant="ghost" label="Back" onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.rock[700]} strokeWidth={2} />
        </IconButton>
        {/* Mitglieder-Leiste: jede andere Person als Avatar + Name, tippbar zum
            read-only Profil. Horizontal scrollbar, falls die Namen nicht in eine
            Zeile passen. Gelöschtes Gegenüber (keine anderen) → untippbares „Chat“. */}
        {others.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerClassName="items-center gap-3 pr-2">
            {others.map((m) => {
              const memberName = m.display_name ?? 'Anonymous';
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${memberName}’s profile`}
                  onPress={() => router.push(`/profile/${m.id}`)}
                  className="flex-row items-center gap-1.5 active:opacity-70">
                  <Avatar
                    name={memberName}
                    tone={avatarTone(m.id)}
                    size="xs"
                    src={publicImageUrl(m.avatar_path)}
                  />
                  <Text
                    numberOfLines={1}
                    className="max-w-[140px] font-display text-base text-rock-900">
                    {memberName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text numberOfLines={1} className="flex-1 font-display text-base text-rock-900">
            Chat
          </Text>
        )}
      </View>

      {/* Angeheftete Beitritts-Anfragen (nur Gastgeber:in, nur wenn offene da sind).
          Sitzt fix unter dem Kopf über den Nachrichten — bei vielen Anfragen scrollt
          der Block in sich, statt die Nachrichten aus dem Bild zu schieben. */}
      {isHost && pendingRequests.length > 0 ? (
        <View className="border-b border-rock-100 bg-rock-25">
          <View className="flex-row items-center gap-1.5 px-4 pb-2 pt-3">
            <Users size={14} color={colors.rock[500]} strokeWidth={2} />
            <Text className="font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
              {pendingRequests.length === 1
                ? '1 wants to join'
                : `${pendingRequests.length} want to join`}
            </Text>
          </View>
          <ScrollView className="max-h-64" contentContainerClassName="gap-2.5 px-4 pb-3">
            {pendingRequests.map((req) => (
              <RequestRow
                key={req.id}
                request={req}
                sessionId={sessionId!}
                full={full}
                openChatOnAccept={false}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Kein keyboardVerticalOffset: die KAV reicht bis zur Screen-Unterkante, die
            Eingabeleiste sitzt so direkt über der Tastatur. */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.brand[500]} />
          </View>
        ) : (
          <FlatList<Message>
            ref={listRef}
            data={messages ?? []}
            keyExtractor={(m) => m.id}
            className="flex-1"
            contentContainerClassName="px-4 py-4 gap-1"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item, index }) => {
              // System-Zeile („Ben joined", ADR-0007): zentrierte Meta-Zeile, keine
              // Blase, kein Avatar — abgesetzt vom Gespräch.
              if (item.kind === 'system') {
                return (
                  <View className="items-center py-1.5">
                    <Text className="font-sans text-xs text-rock-400">{item.body}</Text>
                  </View>
                );
              }
              const mine = !!item.sender_id && item.sender_id === user?.id;
              const list = messages ?? [];
              // Zeitstempel nur an der letzten Blase einer Sender-Gruppe — sonst zu laut.
              const isGroupEnd =
                index === list.length - 1 || list[index + 1]?.sender_id !== item.sender_id;
              // sender_id === null: Account gelöscht, die Nachricht bleibt (ADR-0004).
              const sender = item.sender_id ? memberById.get(item.sender_id) : undefined;
              const senderName = item.sender_id
                ? (sender?.display_name ?? 'Anonymous')
                : 'Deleted user';
              return (
                <MessageBubble
                  mine={mine}
                  time={isGroupEnd ? formatClock(item.sent_at) : undefined}
                  avatar={
                    isGroupEnd ? (
                      <Avatar
                        name={senderName}
                        tone={avatarTone(item.sender_id ?? senderName)}
                        size="xs"
                        src={publicImageUrl(sender?.avatar_path)}
                      />
                    ) : undefined
                  }>
                  {item.body}
                </MessageBubble>
              );
            }}
          />
        )}

        {/* Eingabeleiste */}
        <View
          className="flex-row items-center gap-2 border-t border-rock-100 bg-rock-0 px-3 pt-2"
          style={{ paddingBottom: insets.bottom + 8 }}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Message …"
            placeholderTextColor={colors.rock[400]}
            multiline
            className="max-h-28 flex-1 rounded-full bg-rock-50 px-4 py-2.5 font-sans text-[15px] text-rock-900"
          />
          <IconButton
            variant="brand"
            size="md"
            label="Send"
            disabled={!body.trim() || send.isPending}
            onPress={submit}>
            <Send size={18} color={colors.rock[0]} strokeWidth={2} />
          </IconButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
