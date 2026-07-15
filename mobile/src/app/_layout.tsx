// Subpath-Imports statt Barrel (@expo-google-fonts/inter): Metro macht kein
// Tree-Shaking, ein Barrel-Import würde ALLE Gewichte ins Bundle ziehen. Der Subpath
// zieht nur genau dieses eine Gewicht.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono/600SemiBold';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono/700Bold';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';

import '../global.css';

SplashScreen.preventAutoHideAsync();

// Login-first-Gate: liest die Session aus useAuth (TanStack-Query-backed) und gibt per
// Stack.Protected je nach An-/Abmeldung entweder die App-Routen oder den Login frei.
// Wechselt die Session (Login/Logout), leitet expo-router automatisch auf die Anker-Route um.
function RootNavigator() {
  const { session, isLoading } = useAuth();

  // Splash erst freigeben, wenn die Session-Frage beantwortet ist — sonst flasht kurz
  // der Login, bevor eine bestehende Session geladen wurde.
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sessions/new" />
        <Stack.Screen name="sessions/[id]" />
        <Stack.Screen name="chats/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Marken-Fonts zur Laufzeit laden. Die useFonts-Keys sind zugleich die Familiennamen,
  // die die fontFamily-Tokens in tailwind.config.js referenzieren.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  // Rendern erst freigeben, wenn Fonts geladen (oder fehlgeschlagen) sind. Der native
  // Splash bleibt bis dahin sichtbar (preventAutoHide); RootNavigator ruft hideAsync.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
          <StatusBar style="dark" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
