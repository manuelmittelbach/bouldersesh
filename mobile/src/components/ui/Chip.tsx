import type { ReactNode } from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';

import { cn, type GradeBand } from '@/lib/utils';

// Pill-Filter-/Auswahl-Chip — Feed-Filterleiste, Level-Picker. `active` füllt mit Ink
// (rock-900). Mit `band` färbt der aktive Chip stattdessen in seiner Grade-Band-Farbe
// (Level-Picker → gleiche Farben wie das GradePill in Feed/Profil), inaktiv bleibt
// neutral-outline. Icons als Nodes (Farbe passend setzt die aufrufende Seite).
const activeBandChip: Record<GradeBand, string> = {
  beginner: 'border-grade-beginner-ink bg-grade-beginner',
  intermediate: 'border-grade-intermediate-ink bg-grade-intermediate',
  advanced: 'border-grade-advanced-ink bg-grade-advanced',
  pro: 'border-grade-pro-ink bg-grade-pro',
  neutral: 'border-rock-900 bg-rock-900',
};
const activeBandText: Record<GradeBand, string> = {
  beginner: 'text-grade-beginner-ink',
  intermediate: 'text-grade-intermediate-ink',
  advanced: 'text-grade-advanced-ink',
  pro: 'text-grade-pro-ink',
  neutral: 'text-rock-0',
};

export type ChipProps = Omit<PressableProps, 'children'> & {
  active?: boolean;
  /** Aktiv-Füllung in Grade-Band-Farbe statt Ink. Fehlt es, füllt `active` mit rock-900. */
  band?: GradeBand;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function Chip({ active = false, band, icon, trailingIcon, className, children, ...rest }: ChipProps) {
  const activeChip = band ? activeBandChip[band] : 'border-rock-900 bg-rock-900';
  const activeText = band ? activeBandText[band] : 'text-rock-0';
  return (
    <Pressable
      className={cn(
        'h-9 flex-row items-center gap-1.5 rounded-full border px-3.5 active:scale-[0.97]',
        active ? activeChip : 'border-rock-200 bg-rock-0',
        className,
      )}
      {...rest}>
      {icon}
      <Text className={cn('font-sans-semibold text-[13px]', active ? activeText : 'text-rock-700')}>
        {children}
      </Text>
      {trailingIcon}
    </Pressable>
  );
}
