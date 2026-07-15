import { LogOut } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme/colors';

// Phase-0-Platzhalter. Der Logout ist schon echt verdrahtet, damit sich der Login-first-Gate
// end-to-end testen lässt (Abmelden → Root-Gate leitet zurück auf /login). Voll ausgebaut
// (Profil bearbeiten via useProfile/useUpdateProfile) in Phase 3.
export default function Profile() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="font-display-bold text-2xl text-rock-900">Profil</Text>
        <Text className="font-sans text-sm text-rock-500">{user?.email ?? 'Kommt in Phase 3'}</Text>

        <Pressable
          onPress={signOut}
          className="mt-6 h-12 flex-row items-center justify-center gap-2 rounded-md border border-rock-200 bg-rock-0 px-5">
          <LogOut size={18} color={colors.rock[700]} strokeWidth={2} />
          <Text className="font-sans-semibold text-base text-rock-700">Abmelden</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
