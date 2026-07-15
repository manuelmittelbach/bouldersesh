import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';

// Basis-Fläche: weiß, Haarlinien-Rahmen, 14px-Radius (rounded-lg), niedriger kühler Schatten.
// `interactive`/`onPress` macht die Karte tappbar (Press-Scale-Down). Feed-Karten, Info-
// Panels und Sheets werden daraus komponiert.
const BASE = 'rounded-lg border border-rock-100 bg-rock-0 p-4 shadow-sm';

export type CardProps = ViewProps & {
  interactive?: boolean;
  onPress?: PressableProps['onPress'];
  className?: string;
  children?: ReactNode;
};

export function Card({ interactive, onPress, className, children, ...rest }: CardProps) {
  if (interactive || onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn(BASE, 'active:scale-[0.985]', className)}
        {...(rest as PressableProps)}>
        {children}
      </Pressable>
    );
  }
  return (
    <View className={cn(BASE, className)} {...rest}>
      {children}
    </View>
  );
}
