import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

// Phase-0-Platzhalter (gestackter Detail-Screen außerhalb der Tabs). Wird in Phase 3 durch
// den echten Session-Detail (useSession + Match-Request) ersetzt.
export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="flex-1 bg-rock-25">
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center gap-1 px-4 py-3">
        <ChevronLeft size={22} color={colors.rock[700]} strokeWidth={2} />
        <Text className="font-sans-medium text-base text-rock-700">Zurück</Text>
      </Pressable>
      <View className="flex-1 items-center justify-center gap-1">
        <Text className="font-display-bold text-2xl text-rock-900">Session-Detail</Text>
        <Text className="font-mono text-sm text-rock-500">#{id}</Text>
      </View>
    </SafeAreaView>
  );
}
