import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { cn } from '@/lib/utils';

// Runder Ein-Icon-Tap-Target — Header-Back/Close, Nav-Aktionen, Chat-Senden.
// Icon kommt als Kind-Node rein; die Icon-Farbe setzt die aufrufende Seite (weiß auf
// brand/ink). `label` ist Pflicht für a11y.
type Variant = 'ghost' | 'soft' | 'brand' | 'ink';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  ghost: 'bg-transparent',
  soft: 'bg-rock-100',
  brand: 'bg-brand-500',
  ink: 'bg-rock-900',
};

// 36 / 40 / 44 wie im DS.
const sizeClass: Record<Size, string> = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
};

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  variant?: Variant;
  size?: Size;
  label: string;
  className?: string;
  children?: ReactNode;
};

export function IconButton({
  variant = 'ghost',
  size = 'md',
  label,
  disabled = false,
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      className={cn(
        'items-center justify-center rounded-full active:scale-95',
        sizeClass[size],
        variantClass[variant],
        disabled && 'opacity-45',
        className,
      )}
      {...rest}>
      {children}
    </Pressable>
  );
}
