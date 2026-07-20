import { Lock, Mail, Mountain } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

type Mode = 'signin' | 'signup';

// Login-first-Einstieg. E-Mail/Passwort (kein Magic-Link → kein Deep-Linking nötig).
// Bei Erfolg setzt supabase die Session; das Root-Gate (Stack.Protected) leitet dann
// automatisch in die App um — hier ist keine Navigation nötig.
export default function Login() {
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
    <SafeAreaView className="flex-1 bg-rock-25">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <View className="flex-1 px-6 pb-6 pt-10">
          {/* Wortmarke */}
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-md bg-brand-500">
              <Mountain size={22} color={colors.rock[0]} strokeWidth={2} />
            </View>
            <Text className="font-display-bold text-xl text-rock-900">Boulder Buddy</Text>
          </View>

          <View className="mt-12">
            <Text className="font-display-bold text-[28px] leading-8 text-rock-900">
              {mode === 'signup' ? 'Get started.' : 'Welcome back.'}
            </Text>
            <Text className="mt-3 font-sans text-base text-rock-500">
              {mode === 'signup'
                ? 'An email and a password are all it takes.'
                : 'Sign in with your email and password.'}
            </Text>
          </View>

          {confirmSent ? (
            <View className="mt-8 rounded-lg bg-success-surface p-5">
              <Text className="font-display text-base text-success">Check your inbox</Text>
              <Text className="mt-1 font-sans text-sm leading-5 text-rock-700">
                We sent a confirmation link to {email}. Tap it, then you can sign in.
              </Text>
            </View>
          ) : (
            <View className="mt-8 gap-3">
              {/* Modus-Umschalter */}
              <View className="mb-1 flex-row gap-1 rounded-md bg-rock-100 p-1">
                {(['signin', 'signup'] as Mode[]).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => {
                      setMode(m);
                      setError(null);
                    }}
                    className={`flex-1 items-center rounded-sm py-2 ${mode === m ? 'bg-rock-0' : ''}`}>
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

          <Text className="mt-auto text-center font-sans text-xs text-rock-400">
            By signing in you accept our privacy policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
