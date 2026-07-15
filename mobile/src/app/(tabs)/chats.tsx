import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase-0-Platzhalter. Wird in Phase 3 durch die echte Chat-Liste (useMyChats) ersetzt.
export default function ChatList() {
  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <View className="flex-1 items-center justify-center gap-1">
        <Text className="font-display-bold text-2xl text-rock-900">Chats</Text>
        <Text className="font-sans text-sm text-rock-500">Kommt in Phase 3</Text>
      </View>
    </SafeAreaView>
  );
}
