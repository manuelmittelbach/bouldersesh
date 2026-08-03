import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';
import { MIN_PASSWORD, passwordStrength } from '@/lib/password';

// Vier-Segment-Stärkeleiste + Label unter dem Passwortfeld. Rein informativ
// (ADR-0016: kein Komplexitäts-Zwang) — die harte Grenze ist allein MIN_PASSWORD,
// die Färbung nur ein Hinweis. Unter der Mindestlänge steht „Too short".

const BAR_COLOR = ['bg-danger', 'bg-warning', 'bg-warning', 'bg-success', 'bg-success'] as const;
const TEXT_COLOR = ['text-danger', 'text-warning', 'text-warning', 'text-success', 'text-success'] as const;

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (password.length === 0) return null;
  const { score, label, tooShort } = passwordStrength(password);
  // „Too short" färbt wie score 0 (danger), sonst nach score.
  const tone = tooShort ? 0 : score;

  return (
    <View className="mt-0.5 flex-row items-center gap-3">
      <View className="flex-1 flex-row gap-1">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full',
              !tooShort && i < score ? BAR_COLOR[tone] : 'bg-rock-200',
            )}
          />
        ))}
      </View>
      <Text className={cn('font-sans-medium text-xs', tooShort ? 'text-rock-400' : TEXT_COLOR[tone])}>
        {tooShort ? `Min. ${MIN_PASSWORD} characters` : label}
      </Text>
    </View>
  );
}
