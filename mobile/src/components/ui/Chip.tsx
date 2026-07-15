import type { ReactNode } from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';

import { cn } from '@/lib/utils';

// Pill-Filter-/Auswahl-Chip — Feed-Filterleiste, Level-Picker. `active` füllt mit Ink
// (rock-900). Icons als Nodes (Farbe passend setzt die aufrufende Seite).
export type ChipProps = Omit<PressableProps, 'children'> & {
  active?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function Chip({ active = false, icon, trailingIcon, className, children, ...rest }: ChipProps) {
  return (
    <Pressable
      className={cn(
        'h-9 flex-row items-center gap-1.5 rounded-full border px-3.5 active:scale-[0.97]',
        active ? 'border-rock-900 bg-rock-900' : 'border-rock-200 bg-rock-0',
        className,
      )}
      {...rest}>
      {icon}
      <Text className={cn('font-sans-semibold text-[13px]', active ? 'text-rock-0' : 'text-rock-700')}>
        {children}
      </Text>
      {trailingIcon}
    </Pressable>
  );
}
