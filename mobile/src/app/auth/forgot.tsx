import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Text } from 'react-native';

import { AuthScaffold } from '@/components/AuthScaffold';
import { Button, Input } from '@/components/ui';
import { mapAuthError } from '@/lib/authErrors';
import { requestPasswordReset } from '@/lib/auth';
import { colors } from '@/theme/colors';

// Reset anstoßen (ADR-0016): Email eintragen → Recovery-Code kommt per Mail →
// weiter zum gemeinsamen Code-Screen (mode=recovery). Ob die Adresse existiert,
// verraten wir NICHT — der Weg zum Code-Screen ist derselbe, und Supabase
// antwortet aus Enumeration-Schutz ohnehin immer mit Erfolg.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthForgot() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = EMAIL_RE.test(email.trim()) && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const addr = email.trim();
    try {
      await requestPasswordReset(addr);
      router.push({ pathname: '/auth/verify', params: { mode: 'recovery', email: addr } });
    } catch (e) {
      setError(mapAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScaffold
      title="Reset your password"
      subtitle="Enter your email and we’ll send you a 6-digit code to set a new password.">
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

      {error ? <Text className="mt-3 font-sans text-sm text-danger">{error}</Text> : null}

      <Button
        onPress={submit}
        variant="primary"
        size="lg"
        fullWidth
        loading={busy}
        disabled={!canSubmit}
        className="mt-6">
        Send code
      </Button>
    </AuthScaffold>
  );
}
