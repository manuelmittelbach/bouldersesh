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
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useRecovery } from "@/hooks/useRecovery";
import { setupNotificationHandling } from "@/lib/notifications";
import { queryClient } from "@/lib/queryClient";

import "../global.css";

SplashScreen.preventAutoHideAsync();

// Vor dem ersten Render setzen, damit auch eine Notification, die die App
// gerade öffnet, schon das konfigurierte Foreground-Verhalten bekommt.
setupNotificationHandling();

// Gestaffelte Gates über Stack.Protected — jedes tiefere Gate setzt das äußere
// voraus. Fällt ein Guard auf false, wirft expo-router die History dieser Screens
// weg und leitet auf den ersten verfügbaren Screen um — die Umleitung braucht
// also keinen Code. Reihenfolge von außen nach innen (ADR-0016):
//   1. Session       — ohne Session nur der Auth-Stack (login + auth/*).
//   2. recoveryPending — nach einem Recovery-Code gibt es zwar eine Session, aber
//      erst nach dem neuen Passwort App-Zugang; dieses Gate gewinnt über alles.
//   3. display_name  — Identitäts-Gate: ohne Anzeigenamen nur das Onboarding.
//   4. Stadt         — ohne gewählte Stadt nur `city`.
// `city` liegt bewusst NUR im display_name-Guard (nicht im Stadt-Guard), damit
// derselbe Screen später als Wechsler per router.push('/city') erreichbar bleibt.
function RootNavigator() {
  const { session, profile, isLoading, provisioning } = useAuth();
  const { cityId, isLoading: cityLoading } = useActiveCity();
  const { recoveryPending } = useRecovery();

  // Erst wenn alle Gates offen sind: vorher existieren die Deep-Link-Ziele
  // ((tabs), chats/[id], sessions/[id]) im Stack nicht.
  usePushNotifications({
    enabled:
      !!session && !recoveryPending && !!profile?.display_name && !!cityId,
  });

  // Splash erst freigeben, wenn Session UND Stadt beantwortet sind — sonst flasht kurz
  // der Login bzw. der Stadt-Screen, bevor der gespeicherte Zustand geladen wurde.
  // `provisioning` hält den Boot-Zustand zusätzlich, während ein Apple-Login den
  // Namen persistiert — sonst blitzt das Onboarding auf, bis display_name gesetzt ist.
  const booting = isLoading || cityLoading || provisioning;
  useEffect(() => {
    if (!booting) SplashScreen.hideAsync();
  }, [booting]);

  if (booting) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        {/* Passwort-Wiederherstellung: hat Vorrang vor allen App-Gates. */}
        <Stack.Protected guard={recoveryPending}>
          <Stack.Screen name="reset-password" />
        </Stack.Protected>
        <Stack.Protected guard={!recoveryPending}>
          <Stack.Protected guard={!!profile?.display_name}>
            <Stack.Protected guard={!!cityId}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="sessions/new" />
              <Stack.Screen name="sessions/[id]" />
              <Stack.Screen name="sessions/edit/[id]" />
              <Stack.Screen name="chats/[id]" />
              <Stack.Screen name="profile/[id]" />
            </Stack.Protected>
            <Stack.Screen name="city" />
            {/* Aus dem Profil erreichbare Account-Screens. Bei delete-account gilt:
                verwirft die Löschung die Session, flippt der Session-Guard und
                leitet selbst auf Login (ADR-0004). */}
            <Stack.Screen name="account" />
            <Stack.Screen name="edit-name" />
            <Stack.Screen name="change-email" />
            <Stack.Screen name="change-password" />
            <Stack.Screen name="verify-email-change" />
            <Stack.Screen name="delete-account" />
            <Stack.Screen name="blocked" />
            <Stack.Screen name="feedback" />
          </Stack.Protected>
          {/* Identitäts-Gate: ohne Anzeigenamen nur das Onboarding. Das Onboarding
              MUSS selbst hinter einem Guard liegen (nicht als freier Screen daneben):
              expo-router leitet nur bei true→false automatisch um. Läge es frei,
              würde das Speichern des Namens zwar (tabs)/city freischalten, den
              Nutzer aber NICHT vom Onboarding wegschieben — er säße fest. Mit
              `guard={!display_name}` kippt der Guard beim Speichern auf false und
              die dokumentierte Auto-Umleitung greift. */}
          <Stack.Protected guard={!profile?.display_name}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          {/* Eigener Bild-Zuschnitt (Avatar). BEWUSST außerhalb des Stadt- und
              display_name-Gates: der Avatar kann schon im Onboarding (vor Stadt
              und vor gesetztem Namen) gewählt werden, und pickAndUploadProfileImage
              wartet auf genau diesen Screen — läge er im Stadt-Gate, hinge der
              Upload im Onboarding ewig. Vollbild-Modal für die runde Crop-Maske. */}
          <Stack.Screen
            name="crop-image"
            options={{ presentation: "fullScreenModal", animation: "fade" }}
          />
        </Stack.Protected>
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
        <Stack.Screen name="auth/email" />
        <Stack.Screen name="auth/verify" />
        <Stack.Screen name="auth/forgot" />
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
