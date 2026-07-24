import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBubble } from '@/components/MessageBubble';
import { Avatar, IconButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, formatClock } from '@/lib/utils';
import { buildChatTitle, useChatMembers, useMessages, useSendMessage } from '@/queries/chat';
import type { Message } from '@/types/database';
import { colors } from '@/theme/colors';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(id);
  const { data: members } = useChatMembers(id);
  const send = useSendMessage(id);

  const memberById = new Map((members ?? []).map((m) => [m.id, m]));
  // Der Titel kommt aus den *anderen* Mitgliedern (ADR-0007): eine Zweier-Runde zeigt
  // den einen Namen, eine Gruppe „Anna, Ben +1". Hat sich das einzige Gegenüber gelöscht,
  // ist der Chat nur noch ich → generisches „Chat“ (ADR-0004).
  const others = (members ?? []).filter((m) => m.id !== user?.id);
  const isGroup = others.length > 1;
  const title = others.length
    ? buildChatTitle(others.map((m) => m.display_name ?? 'Anonymous'))
    : 'Chat';
  // Nur bei genau einem Gegenüber führt der Kopf zum Profil — eine Gruppe hat kein
  // einzelnes Ziel.
  const soloOther = others.length === 1 ? others[0] : null;
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
        {/* Gruppe: gestapelte Avatare + untippbarer Titel. 1:1: der Name führt zum
            read-only Profil. Gelöschtes Gegenüber (soloOther === null, kein Gruppe) →
            untippbares „Chat“. */}
        {isGroup ? (
          <View className="flex-1 flex-row items-center gap-2">
            <View className="flex-row">
              {others.slice(0, 3).map((m, i) => (
                <View
                  key={m.id}
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                  className="rounded-full border-2 border-rock-25">
                  <Avatar
                    name={m.display_name ?? 'Anonymous'}
                    tone={avatarTone(m.id)}
                    size="xs"
                    src={publicImageUrl(m.avatar_path)}
                  />
                </View>
              ))}
            </View>
            <Text numberOfLines={1} className="flex-1 font-display text-base text-rock-900">
              {title}
            </Text>
          </View>
        ) : soloOther?.id ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${title}’s profile`}
            onPress={() => router.push(`/profile/${soloOther.id}`)}
            className="flex-1 active:opacity-70">
            <Text numberOfLines={1} className="font-display text-base text-rock-900">
              {title}
            </Text>
          </Pressable>
        ) : (
          <Text numberOfLines={1} className="flex-1 font-display text-base text-rock-900">
            {title}
          </Text>
        )}
      </View>

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
