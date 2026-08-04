import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Mail, Mountain } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button } from '@/components/ui';
import { mapAuthError } from '@/lib/authErrors';
import { openLegal, PRIVACY_URL, TERMS_URL } from '@/lib/legal';
import {
  isGoogleSignInConfigured,
  signInWithApple,
  signInWithGoogle,
} from '@/lib/socialAuth';
import { colors } from '@/theme/colors';

// Screen 1 des Auth-Flows (ADR-0016): die Wahl der Anmelde-METHODE, noch kein
// Formular. Apple/Google nativ (oben, App-Store-Konvention) — oder Email als
// Fallback, die zu Screen 2 (`auth/email`) führt. KEIN Signin/Signup-Toggle mehr:
// derselbe Einstieg für neue wie wiederkehrende Nutzer:innen.
//
// Apple/Google laufen über die nativen SDKs + signInWithIdToken (socialAuth.ts);
// nach Erfolg navigieren die Session-Gates im Root-Layout von selbst. Abbruch im
// System-Sheet ist kein Fehler und bleibt still. Der Apple-Button ist Apples
// EIGENER (AppleAuthenticationButton) — ein selbstgebauter wäre ein
// App-Store-Ablehnungsgrund. Er erscheint nur auf iOS; der Google-Button bleibt
// deaktiviert, bis die OAuth-Client-IDs in der .env stehen (socialAuth.ts).
//
// Aufbau: ein Foto einer Boulderhalle als „Wand" (Front-Tür-Moment), davor steigt
// die helle Fläche auf. Ein dunkler SVG-Scrim über dem Foto hält Text + Akzent
// lesbar. Das Hero-Bild ist ein lizenzfreies Stock-Foto (Pexels) —
// `assets/images/gym-hero.jpg` ersetzen für ein eigenes Hallen-Foto.

function OrDivider() {
  return (
    <View className="my-5 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-rock-200" />
      <Text className="font-sans text-[13px] text-rock-400">or</Text>
      <View className="h-px flex-1 bg-rock-200" />
    </View>
  );
}

export default function Login() {
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSocial(provider: 'apple' | 'google') {
    if (pending) return;
    setPending(provider);
    setError(null);
    try {
      const signIn = provider === 'apple' ? signInWithApple : signInWithGoogle;
      await signIn();
      // Erfolg braucht keine Navigation — das Session-Gate übernimmt.
      // Abbruch ({ cancelled: true }) bleibt bewusst still.
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setPending(null);
    }
  }

  return (
    <View className="flex-1 bg-rock-25">
      {/* Über dem Foto ist die Statusbar hell. */}
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          {/* ── Die Wand ── Boulderhallen-Foto, blutet unter die Statusbar. */}
          <View
            className="relative overflow-hidden bg-rock-950 px-6 pb-12"
            style={{ paddingTop: insets.top + 20 }}>
            <Image
              source={require('../../assets/images/gym-hero.jpg')}
              contentFit="cover"
              accessibilityLabel="Climber on an indoor bouldering wall"
              style={StyleSheet.absoluteFill}
            />
            {/* Scrim: NUR die Text-Zonen schützen — oben (Statusbar/Wortmarke) und unten
                (Headline). Die Mitte bleibt klar, damit das Foto lebendig wirkt. */}
            <Svg
              style={StyleSheet.absoluteFill}
              preserveAspectRatio="none"
              viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.rock[950]} stopOpacity="0.45" />
                  <Stop offset="0.26" stopColor={colors.rock[950]} stopOpacity="0.04" />
                  <Stop offset="0.5" stopColor={colors.rock[950]} stopOpacity="0" />
                  <Stop offset="0.72" stopColor={colors.rock[950]} stopOpacity="0.42" />
                  <Stop offset="1" stopColor={colors.rock[950]} stopOpacity="0.92" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100" height="100" fill="url(#scrim)" />
            </Svg>

            {/* Wortmarke — das echte App-Lockup: Send-Orange-Kachel + Space Grotesk. */}
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-md bg-brand-500">
                <Mountain size={22} color={colors.rock[0]} strokeWidth={2} />
              </View>
              <Text className="font-display-bold text-lg text-rock-0">Boulder Buddy</Text>
            </View>

            {/* Freiraum, damit das Foto zwischen Wortmarke und Headline sichtbar bleibt. */}
            <View className="h-36" />

            {/* Hero — Feed-Behandlung übernommen (Space Grotesk, ein Brand-Wort). */}
            <Text className="font-display-bold text-[30px] leading-9 text-rock-0">
              Find your next{'\n'}
              session <Text className="text-brand-500">partner.</Text>
            </Text>
          </View>

          {/* ── Der Grund ── helle Fläche, steigt vor der Wand auf (-mt + Radius). */}
          <View
            className="-mt-4 flex-1 rounded-t-[20px] bg-rock-25 px-6 pt-7"
            style={{ paddingBottom: insets.bottom + 20 }}>
            <Text className="font-display-bold text-[22px] leading-7 text-rock-900">
              Get climbing
            </Text>
            <Text className="mt-1.5 font-sans text-[15px] leading-5 text-rock-500">
              Sign in or create an account to see who’s climbing near you.
            </Text>

            <View className="mt-6 gap-3">
              {/* Social — Apple oben (App-Store-Konvention: sobald irgendein
                  Social-Login angeboten wird, ist Apple Pflicht und erwartet
                  Prominenz). Nur auf iOS; Android bekommt nur Google + Email. */}
              {Platform.OS === 'ios' ? (
                <View pointerEvents={pending ? 'none' : 'auto'}>
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={
                      AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                    }
                    buttonStyle={
                      AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                    }
                    cornerRadius={12}
                    style={styles.appleButton}
                    onPress={() => handleSocial('apple')}
                  />
                </View>
              ) : null}
              <Button
                variant="outline"
                size="lg"
                fullWidth
                disabled={!isGoogleSignInConfigured || pending !== null}
                loading={pending === 'google'}
                onPress={() => handleSocial('google')}>
                Continue with Google
              </Button>
              {!isGoogleSignInConfigured ? (
                <Text className="text-center font-sans text-xs text-rock-400">
                  Google sign-in is coming soon.
                </Text>
              ) : null}
              {error ? (
                <Text className="text-center font-sans text-sm text-danger">{error}</Text>
              ) : null}

              <OrDivider />

              {/* Email — der voll funktionsfähige Weg. Führt zu Screen 2. */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.push('/auth/email')}
                icon={<Mail size={19} color={colors.rock[0]} strokeWidth={2} />}>
                Continue with email
              </Button>
            </View>

            {/* Inline-ToS — Platzhalter-URLs, im In-App-Browser (kein Deep-Link). */}
            <Text className="mt-auto pt-8 text-center font-sans text-xs leading-5 text-rock-400">
              By continuing you agree to our{' '}
              <Text className="text-rock-600 underline" onPress={() => openLegal(TERMS_URL)}>
                Terms
              </Text>{' '}
              and{' '}
              <Text className="text-rock-600 underline" onPress={() => openLegal(PRIVACY_URL)}>
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Der native Apple-Button ist kein DS-Button und nimmt kein className —
// Höhe/Breite hier per style an size="lg" (52px, volle Breite) angeglichen.
const styles = StyleSheet.create({
  appleButton: { height: 52, width: '100%' },
});
