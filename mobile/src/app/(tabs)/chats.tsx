import { router } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui';
import { avatarTone, cn, formatChatTime } from '@/lib/utils';
import { useMyChats, type ChatListItem } from '@/queries/chat';
import { colors } from '@/theme/colors';

function ChatRow({ chat }: { chat: ChatListItem }) {
  const name = chat.other?.display_name ?? 'Anonymous';
  // Fallback bewusst OHNE Emoji (DS: kein Emoji).
  const preview = chat.lastMessage?.body ?? 'No messages yet';
  const stamp = chat.lastMessage?.sent_at ?? chat.createdAt;

  return (
    <Pressable
      onPress={() => router.push(`/chats/${chat.id}`)}
      className="flex-row items-center gap-3 px-5 py-3 active:bg-rock-50">
      <Avatar
        name={name}
        tone={avatarTone(chat.other?.id ?? name)}
        size="lg"
        src={chat.other?.avatar_url}
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
          {chat.unread ? (
            <View className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
          ) : null}
        </View>
        {chat.session?.gym ? (
          <Text numberOfLines={1} className="mt-0.5 font-sans text-xs text-rock-400">
            {chat.session.gym.name} · {chat.session.level}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ChatList() {
  const { data: chats, isLoading, error, refetch } = useMyChats();
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
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
            Couldn’t load: {(error as Error).message}
          </Text>
        </View>
      ) : (
        <FlatList<ChatListItem>
          data={chats ?? []}
          keyExtractor={(c) => c.id}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ItemSeparatorComponent={() => <View className="ml-[76px] h-px bg-rock-100" />}
          renderItem={({ item }) => <ChatRow chat={item} />}
          ListEmptyComponent={
            <View className="items-center px-6 py-16">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-50">
                <MessageCircle size={28} color={colors.brand[600]} strokeWidth={2} />
              </View>
              <Text className="font-display text-base text-rock-900">No chats yet</Text>
              <Text className="mt-1 text-center font-sans text-sm leading-5 text-rock-500">
                Once you accept a climbing request — or someone accepts yours — the chat shows
                up here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
