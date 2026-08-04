import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtpInput } from '@/components/OtpInput';
import { Button, ScreenHeader } from '@/components/ui';
import { mapAuthError } from '@/lib/authErrors';
import { resendEmailChangeCode, verifyEmailChangeCode } from '@/lib/auth';

// Letzter Schritt des Email-Wechsels (Option B / Industrie-Standard): das Passwort
// wurde auf dem Account-Screen schon re-authentifiziert, updateUser hat einen
// 8-stelligen Code an die NEUE Adresse geschickt. Hier tippt der Nutzer ihn ab.
//
// Bewusst ein EIGENER, authentifizierter Screen — nicht auth/verify.tsx: der liegt
// im !session-Stack und lebt vom Session-Gate. Der Email-Wechsel passiert MIT
// Session, also braucht er In-App-Chrome (ScreenHeader) und eigene Navigation:
// bei Erfolg feuert GoTrue USER_UPDATED, useAuth zieht die neue user.email nach,
// und wir gehen zum Account zurück — dort steht dann „Currently <neue Adresse>".

const CODE_LENGTH = 8;
const RESEND_COOLDOWN = 30;

export default function VerifyEmailChange() {
  const params = useLocalSearchParams<{ email?: string }>();
  const newEmail = params.email ?? '';

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Doppel-Submit verhindern: onComplete (Auto) und der Button können sonst
  // gleichzeitig feuern.
  const submitting = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function submit(value: string) {
    if (submitting.current || value.length !== CODE_LENGTH || !newEmail) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await verifyEmailChangeCode(newEmail, value);
      // Erfolg → USER_UPDATED aktualisiert user.email; zurück zum Account, dort
      // signalisiert emailUpdated die grüne „Email updated."-Meldung (analog zu
      // Name/Passwort, die aber direkt auf dem Account-Screen bestätigt werden).
      router.dismissTo({ pathname: '/account', params: { emailUpdated: '1' } });
    } catch (e) {
      setError(mapAuthError(e));
      setCode('');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function resend() {
    if (cooldown > 0 || busy || !newEmail) return;
    setError(null);
    // Optimistisch sperren (verhindert Doppel-Tap), aber bei Fehler sofort wieder
    // freigeben — ein misslungener Resend soll nicht 30 s lang blockieren.
    setCooldown(RESEND_COOLDOWN);
    try {
      await resendEmailChangeCode(newEmail);
    } catch (e) {
      setCooldown(0);
      setError(mapAuthError(e));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled">
          <Text className="mt-2 font-display-bold text-[28px] leading-8 text-rock-900">
            Confirm your new email
          </Text>
          <Text className="mt-3 font-sans text-base leading-6 text-rock-500">
            {`We sent an 8-digit code to ${newEmail || 'your new address'}. Enter it to finish the switch — your email won’t change until you do.`}
          </Text>

          <View className="mt-9">
          <OtpInput
            value={code}
            onChangeText={(next) => {
              setCode(next);
              if (error) setError(null);
            }}
            onComplete={submit}
            invalid={!!error}
            autoFocus
            editable={!busy}
          />

          {error ? (
            <Text className="mt-3 font-sans text-sm text-danger">{error}</Text>
          ) : null}

          <Button
            onPress={() => submit(code)}
            variant="primary"
            size="lg"
            fullWidth
            loading={busy}
            disabled={code.length !== CODE_LENGTH || busy}
            className="mt-6">
            Confirm email
          </Button>

          <View className="mt-6 flex-row justify-center gap-1.5">
            <Text className="font-sans text-sm text-rock-500">Didn’t get it?</Text>
            <Pressable
              accessibilityRole="button"
              disabled={cooldown > 0}
              onPress={resend}
              className="active:opacity-60">
              <Text
                className={
                  cooldown > 0
                    ? 'font-sans-medium text-sm text-rock-400'
                    : 'font-sans-semibold text-sm text-brand-600'
                }>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </Text>
            </Pressable>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
