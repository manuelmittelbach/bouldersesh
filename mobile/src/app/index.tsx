import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Smoke-Test-Screen: beweist, dass die NativeWind-Pipeline steht
// (Tailwind-Utilities, dark:-Varianten und der Marken-Token bg-send-orange).
// Wird im Salvage-Schritt durch den echten Dashboard-Screen ersetzt.
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          Boulder Buddy
        </Text>
        <View className="rounded-xl bg-send-orange px-4 py-2">
          <Text className="text-base font-semibold text-white">NativeWind läuft ✔</Text>
        </View>
        <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          Expo-Scaffold steht. Als Nächstes: Salvage der Query-Schicht und der Design-Tokens.
        </Text>
      </View>
    </SafeAreaView>
  );
}
