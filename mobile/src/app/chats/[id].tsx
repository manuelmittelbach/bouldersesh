import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBubble } from '@/components/MessageBubble';
import { IconButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { formatClock } from '@/lib/utils';
import { useMessages, useSendMessage } from '@/queries/chat';
import type { Message } from '@/types/database';
import { colors } from '@/theme/colors';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(id);
  const send = useSendMessage(id);
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
        <Text className="font-display text-base text-rock-900">Chat</Text>
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
              const mine = item.sender_id === user?.id;
              const list = messages ?? [];
              // Zeitstempel nur an der letzten Blase einer Sender-Gruppe — sonst zu laut.
              const isGroupEnd =
                index === list.length - 1 || list[index + 1]?.sender_id !== item.sender_id;
              return (
                <MessageBubble mine={mine} time={isGroupEnd ? formatClock(item.sent_at) : undefined}>
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
