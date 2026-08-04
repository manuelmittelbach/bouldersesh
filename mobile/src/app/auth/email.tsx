import { router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/AuthScaffold';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { Button, Input } from '@/components/ui';
import { authErrorCode, mapAuthError } from '@/lib/authErrors';
import { resendEmailCode, signIn, signUp } from '@/lib/auth';
import { MIN_PASSWORD } from '@/lib/password';
import { colors } from '@/theme/colors';

// Screen 2 (ADR-0016): Email + Passwort. EIN Screen für beide Modi — ein
// Text-Switch dreht zwischen Anmelden und Registrieren, statt zwei Wege zu bauen.
// Bei Erfolg setzt supabase die Session; das Root-Gate leitet automatisch weiter
// (App bzw. Onboarding). Nur der Signup-Verify-Weg navigiert von Hand zum
// Code-Screen — dort gibt es noch keine Session.

type Mode = 'signin' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthEmail() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = EMAIL_RE.test(email.trim());
  const passwordOk = mode === 'signup' ? password.length >= MIN_PASSWORD : password.length > 0;
  const canSubmit = emailOk && passwordOk && !busy;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const addr = email.trim();
    try {
      if (mode === 'signup') {
        const { needsVerification } = await signUp(addr, password);
        // Bei aktiver Bestätigung (Regelfall) → Code-Screen. Sonst hat die App
        // schon eine Session und das Gate übernimmt.
        if (needsVerification) {
          router.push({ pathname: '/auth/verify', params: { mode: 'signup', email: addr } });
        }
      } else {
        await signIn(addr, password);
        // Erfolg → Session gesetzt → Root-Gate leitet weiter. Nichts zu tun.
      }
    } catch (e) {
      // Sonderfall: bekannte, aber unbestätigte Email → statt einer Sackgasse
      // gleich den Code neu schicken und zum Verify-Screen führen.
      if (authErrorCode(e) === 'email_not_confirmed') {
        void resendEmailCode(addr).catch(() => {});
        router.push({ pathname: '/auth/verify', params: { mode: 'signup', email: addr } });
        return;
      }
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScaffold
      title={mode === 'signup' ? 'Create your account' : 'Welcome back'}
      subtitle={
        mode === 'signup'
          ? 'Email and a password — that’s it.'
          : 'Sign in to see who’s climbing.'
      }>
      <View className="gap-3">
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
        <View className="gap-1.5">
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder={
              mode === 'signup' ? `Password (min. ${MIN_PASSWORD} characters)` : 'Password'
            }
            icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {mode === 'signup' ? <PasswordStrengthMeter password={password} /> : null}
        </View>

        {mode === 'signin' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/auth/forgot')}
            className="self-start py-1 active:opacity-60">
            <Text className="font-sans-medium text-sm text-brand-600">Forgot password?</Text>
          </Pressable>
        ) : null}

        {error ? <Text className="font-sans text-sm text-danger">{error}</Text> : null}

        <Button
          onPress={submit}
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          disabled={!canSubmit}
          className="mt-1">
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </Button>
      </View>

      {/* Text-Switch statt Toggle-Pill (ADR-0016). */}
      <View className="mt-6 flex-row justify-center gap-1.5">
        <Text className="font-sans text-sm text-rock-500">
          {mode === 'signup' ? 'Already have an account?' : 'New to BoulderSesh?'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
          className="active:opacity-60">
          <Text className="font-sans-semibold text-sm text-brand-600">
            {mode === 'signup' ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>
      </View>
    </AuthScaffold>
  );
}
