import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase-0-Platzhalter. Wird in Phase 3 durch den echten Feed (useOpenSessions) ersetzt.
export default function Dashboard() {
  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <View className="flex-1 items-center justify-center gap-1">
        <Text className="font-display-bold text-2xl text-rock-900">Dashboard</Text>
        <Text className="font-sans text-sm text-rock-500">Feed kommt in Phase 3</Text>
      </View>
    </SafeAreaView>
  );
}
