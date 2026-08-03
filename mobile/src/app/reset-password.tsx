import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthScaffold } from '@/components/AuthScaffold';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { Button, Input } from '@/components/ui';
import { mapAuthError } from '@/lib/authErrors';
import { updatePassword } from '@/lib/auth';
import { MIN_PASSWORD } from '@/lib/password';
import { useRecovery } from '@/hooks/useRecovery';
import { colors } from '@/theme/colors';

// Neues Passwort nach einem Recovery-Code (ADR-0016). Erreichbar NUR über das
// recoveryPending-Gate: an dieser Stelle gibt es schon eine (Recovery-)Session,
// aber noch keinen App-Zugang. Erst updateUser + Flag zurücksetzen gibt die
// normalen Gates frei. Kein Zurück — der Weg führt vorwärts durch den Reset.

export default function ResetPassword() {
  const { setRecoveryPending } = useRecovery();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= MIN_PASSWORD && confirm === password && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      // Fertig → Flag weg → die normalen Gates (Onboarding/Stadt/App) übernehmen.
      setRecoveryPending(false);
    } catch (e) {
      setError(mapAuthError(e));
      setBusy(false);
    }
    // Kein finally: bei Erfolg unmountet dieser Screen (Gate), setBusy liefe ins Leere.
  }

  return (
    <AuthScaffold
      back={false}
      title="Set a new password"
      subtitle="Choose a new password for your account. You’re signed in — this is the last step.">
      <View className="gap-3">
        <View className="gap-1.5">
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder={`New password (min. ${MIN_PASSWORD} characters)`}
            icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={password} />
        </View>
        <Input
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm new password"
          icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          error={mismatch ? 'Passwords don’t match.' : undefined}
        />

        {error ? <Text className="font-sans text-sm text-danger">{error}</Text> : null}

        <Button
          onPress={submit}
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          disabled={!canSubmit}
          className="mt-1">
          Set password and continue
        </Button>
      </View>
    </AuthScaffold>
  );
}
