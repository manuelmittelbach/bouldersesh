import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

// Kleiner Status-Marker — „Verifiziert", „Wartet", „Passt zu deinem Level". Copy 1–3 Wörter.
// Optionales Leading-Icon als Node (Icon-Farbe passend zum Ton setzt die aufrufende Seite).
type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-rock-100',
  success: 'bg-success-surface',
  warning: 'bg-warning-surface',
  danger: 'bg-danger-surface',
  brand: 'bg-brand-100',
};

const toneText: Record<Tone, string> = {
  neutral: 'text-rock-500',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  brand: 'text-brand-700',
};

export type BadgeProps = {
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function Badge({ tone = 'neutral', icon, className, children }: BadgeProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-1 self-start rounded-full px-2.5 py-1',
        toneClass[tone],
        className,
      )}>
      {icon}
      <Text className={cn('font-sans-semibold text-[11px]', toneText[tone])}>{children}</Text>
    </View>
  );
}
