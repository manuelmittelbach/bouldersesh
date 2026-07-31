import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Lock, Mail, Mountain } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

type Mode = 'signin' | 'signup';

// Login-first-Einstieg. E-Mail/Passwort (kein Magic-Link → kein Deep-Linking nötig).
// Bei Erfolg setzt supabase die Session; das Root-Gate (Stack.Protected) leitet dann
// automatisch in die App um — hier ist keine Navigation nötig.
//
// Aufbau: ein Foto einer Boulderhalle als „Wand" (Front-Tür-Moment), davor steigt die
// helle Formular-Fläche auf (rock-25 = der Grund jeder App-Seite danach). Ein dunkler
// Farbverlauf (SVG-Scrim) über dem Foto hält den weißen Text + den Send-Orange-Akzent
// lesbar — egal wie hell das Bild an einer Stelle ist. Der Primär-Button ist der einzige
// weitere Orange-Hit im Screen (DS: ein Akzent pro View).
//
// Das Hero-Bild ist ein lizenzfreies Stock-Foto (Pexels). Zum Austauschen gegen ein
// eigenes Hallen-Foto einfach `assets/images/gym-hero.jpg` ersetzen.

export default function Login() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        // Ist E-Mail-Bestätigung serverseitig an, kommt keine Session zurück → Hinweis.
        if (!data.session) setConfirmSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
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
                (Headline). Die Mitte bleibt klar, damit das Foto so lebendig wirkt wie das
                Original (bunte Griffe + Kletterin). */}
            {/* viewBox + preserveAspectRatio="none" → das 0..100-Koordinatensystem wird auf
                die volle Hero-Fläche gestreckt. Prozentwerte in react-native-svg lösen gegen
                den Container NICHT zuverlässig auf (ergaben eine sichtbare Box statt Full-Bleed). */}
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

          {/* ── Der Grund ── helle Formular-Fläche, steigt vor der Wand auf (-mt + Radius). */}
          <View
            className="-mt-4 flex-1 rounded-t-[20px] bg-rock-25 px-6 pt-7"
            style={{ paddingBottom: insets.bottom + 20 }}>
            <View>
              <Text className="font-display-bold text-[22px] leading-7 text-rock-900">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </Text>
              <Text className="mt-1.5 font-sans text-[15px] leading-5 text-rock-500">
                {mode === 'signup'
                  ? "Email and a password — that's it."
                  : "Sign in to see who's climbing."}
              </Text>
            </View>

            {confirmSent ? (
              <View className="mt-7 rounded-lg bg-success-surface p-5">
                <Text className="font-display text-base text-success">Check your inbox</Text>
                <Text className="mt-1 font-sans text-sm leading-5 text-rock-700">
                  We sent a confirmation link to {email}. Tap it, then you can sign in.
                </Text>
              </View>
            ) : (
              <View className="mt-6 gap-3">
                {/* Modus-Umschalter */}
                <View className="mb-1 flex-row gap-1 rounded-md bg-rock-100 p-1">
                  {(['signin', 'signup'] as Mode[]).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setMode(m);
                        setError(null);
                      }}
                      className={`flex-1 items-center rounded-sm py-2 ${mode === m ? 'bg-rock-0 shadow-xs' : ''}`}>
                      <Text
                        className={`font-sans-semibold text-sm ${mode === m ? 'text-rock-900' : 'text-rock-500'}`}>
                        {m === 'signin' ? 'Sign in' : 'Sign up'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  icon={<Mail size={18} color={colors.rock[400]} strokeWidth={2} />}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  inputMode="email"
                />
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password (min. 6 characters)"
                  icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
                  secureTextEntry
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />

                {/* Fehler als eigene Zeile — nicht an ein einzelnes Feld gebunden, da die
                    Meldung Mail ODER Passwort ODER allgemein betreffen kann. */}
                {error ? <Text className="font-sans text-sm text-danger">{error}</Text> : null}

                <Button
                  onPress={submit}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={busy}
                  className="mt-1">
                  {mode === 'signup' ? 'Create account' : 'Sign in'}
                </Button>
              </View>
            )}

            <Text className="mt-auto pt-8 text-center font-sans text-xs text-rock-400">
              By signing in you accept our privacy policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
