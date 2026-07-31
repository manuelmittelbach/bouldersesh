// Subpath-Imports statt Barrel (@expo-google-fonts/inter): Metro macht kein
// Tree-Shaking, ein Barrel-Import würde ALLE Gewichte ins Bundle ziehen. Der Subpath
// zieht nur genau dieses eine Gewicht.
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono/500Medium";
import { JetBrainsMono_600SemiBold } from "@expo-google-fonts/jetbrains-mono/600SemiBold";
import { JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono/700Bold";
import { SpaceGrotesk_500Medium } from "@expo-google-fonts/space-grotesk/500Medium";
import { SpaceGrotesk_600SemiBold } from "@expo-google-fonts/space-grotesk/600SemiBold";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk/700Bold";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useActiveCity } from "@/hooks/useActiveCity";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

import "../global.css";

SplashScreen.preventAutoHideAsync();

// Zwei gestaffelte Gates, beide über Stack.Protected:
//   1. Login — ohne Session gibt es nur `login`.
//   2. Stadt — mit Session, aber ohne gewählte Stadt gibt es nur `city`.
// Verschachtelte Guards heißen: beide müssen true sein, damit die App-Routen erreichbar
// sind. Fällt ein Guard auf false, wirft expo-router die History dieser Screens weg und
// leitet auf den ersten verfügbaren Screen um — die Umleitung braucht also keinen Code.
// `city` liegt bewusst NUR im Session-Guard, damit derselbe Screen später als Wechsler
// per router.push('/city') erreichbar bleibt.
function RootNavigator() {
  const { session, isLoading } = useAuth();
  const { cityId, isLoading: cityLoading } = useActiveCity();

  // Splash erst freigeben, wenn Session UND Stadt beantwortet sind — sonst flasht kurz
  // der Login bzw. der Stadt-Screen, bevor der gespeicherte Zustand geladen wurde.
  const booting = isLoading || cityLoading;
  useEffect(() => {
    if (!booting) SplashScreen.hideAsync();
  }, [booting]);

  if (booting) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Protected guard={!!cityId}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sessions/new" />
          <Stack.Screen name="sessions/[id]" />
          <Stack.Screen name="chats/[id]" />
          <Stack.Screen name="profile/[id]" />
          {/* Eigener Bild-Zuschnitt (Avatar). Vollbild-Modal, damit die
              Maske die runde Form zeigt statt der eckigen OS-Crop-UI. */}
          <Stack.Screen
            name="crop-image"
            options={{ presentation: "fullScreenModal", animation: "fade" }}
          />
        </Stack.Protected>
        <Stack.Screen name="city" />
        {/* Aus dem Profil erreichbare Account-Screens. Bewusst nur im Session-
            Guard, nicht im Stadt-Guard. Bei delete-account gilt zusätzlich:
            verwirft die Löschung die Session, flippt der Guard und leitet selbst
            auf Login (ADR-0004). */}
        <Stack.Screen name="account" />
        <Stack.Screen name="delete-account" />
        <Stack.Screen name="blocked" />
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
      <KeyboardProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <RootNavigator />
            <StatusBar style="dark" />
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
