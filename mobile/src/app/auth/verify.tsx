import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/AuthScaffold';
import { OtpInput } from '@/components/OtpInput';
import { Button } from '@/components/ui';
import { mapAuthError } from '@/lib/authErrors';
import {
  requestPasswordReset,
  resendEmailCode,
  verifyEmailCode,
  verifyRecoveryCode,
} from '@/lib/auth';
import { useRecovery } from '@/hooks/useRecovery';

// Ein Code-Screen für ZWEI Wege (ADR-0016): Email-Bestätigung nach dem Signup
// und Recovery beim Passwort-Reset. Der Unterschied ist nur, welches verifyOtp
// läuft und wohin es führt:
//   • signup   → Session entsteht → Root-Gate schickt ins Onboarding.
//   • recovery → recoveryPending setzen, dann verifyOtp → Session → das
//                Recovery-Gate zeigt den Neues-Passwort-Screen.

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function AuthVerify() {
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const mode = params.mode === 'recovery' ? 'recovery' : 'signup';
  const email = params.email ?? '';
  const { setRecoveryPending } = useRecovery();

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
    if (submitting.current || value.length !== CODE_LENGTH) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'recovery') {
        // VOR verifyOtp setzen: greift erst, wenn die Session da ist, und hebt
        // dann den Reset-Screen über alle App-Gates.
        setRecoveryPending(true);
        await verifyRecoveryCode(email, value);
        // Erfolg → Session → Recovery-Gate übernimmt. Kein manuelles Navigieren.
      } else {
        await verifyEmailCode(email, value);
        // Erfolg → Session → Onboarding-Gate übernimmt.
      }
    } catch (e) {
      if (mode === 'recovery') setRecoveryPending(false);
      setError(mapAuthError(e));
      setCode('');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function resend() {
    if (cooldown > 0 || busy) return;
    setError(null);
    // Optimistisch sperren (verhindert Doppel-Tap), aber bei Fehler sofort wieder
    // freigeben — ein misslungener Resend soll nicht 30 s lang blockieren.
    setCooldown(RESEND_COOLDOWN);
    try {
      if (mode === 'recovery') await requestPasswordReset(email);
      else await resendEmailCode(email);
    } catch (e) {
      setCooldown(0);
      setError(mapAuthError(e));
    }
  }

  return (
    <AuthScaffold
      title="Enter the code"
      subtitle={`We sent a 6-digit code to ${email || 'your email'}. It expires shortly.`}>
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

      {error ? <Text className="mt-3 font-sans text-sm text-danger">{error}</Text> : null}

      <Button
        onPress={() => submit(code)}
        variant="primary"
        size="lg"
        fullWidth
        loading={busy}
        disabled={code.length !== CODE_LENGTH || busy}
        className="mt-6">
        Verify
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
    </AuthScaffold>
  );
}
