import { Text, View } from 'react-native';

import { cn, type GradeBand } from '@/lib/utils';

// Kletter-Grade-Chip — Mono-Ziffern auf gedämpfter, level-gefärbter Fläche. Das Signatur-
// Datenelement des Feeds. `grade` ist der Fb-Text („6a", „6a – 6c"), `band` färbt.
const bandBg: Record<GradeBand, string> = {
  beginner: 'bg-grade-beginner',
  intermediate: 'bg-grade-intermediate',
  advanced: 'bg-grade-advanced',
  pro: 'bg-grade-pro',
  neutral: 'bg-rock-50',
};

const bandText: Record<GradeBand, string> = {
  beginner: 'text-grade-beginner-ink',
  intermediate: 'text-grade-intermediate-ink',
  advanced: 'text-grade-advanced-ink',
  pro: 'text-grade-pro-ink',
  neutral: 'text-rock-700',
};

export type GradePillProps = {
  grade: string;
  band?: GradeBand;
  size?: 'sm' | 'md';
  className?: string;
};

export function GradePill({ grade, band = 'neutral', size = 'md', className }: GradePillProps) {
  return (
    <View
      className={cn(
        'shrink-0 self-start rounded-xs',
        size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1',
        bandBg[band],
        className,
      )}>
      <Text className={cn('font-mono-bold', size === 'sm' ? 'text-[11px]' : 'text-xs', bandText[band])}>
        {grade}
      </Text>
    </View>
  );
}
