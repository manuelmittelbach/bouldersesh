import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { cn } from '@/lib/utils';
import { colors } from '@/theme/colors';

// DS-Button (RN-Port). Primär = EIN kräftiger Orange-Hit pro View; alles andere
// secondary/outline/ghost. Icons kommen als Nodes rein — die aufrufende Seite setzt die
// Icon-Farbe passend zur Variante (Lucide nimmt kein className). `loading` blendet einen
// ActivityIndicator ein (pragmatische Ergänzung für Submit-Buttons, nicht im Web-DS).
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variantContainer: Record<Variant, string> = {
  primary: 'bg-brand-500',
  secondary: 'bg-rock-900',
  outline: 'border border-rock-200 bg-transparent',
  ghost: 'bg-transparent',
};

const variantText: Record<Variant, string> = {
  primary: 'text-rock-0',
  secondary: 'text-rock-0',
  outline: 'text-rock-900',
  ghost: 'text-rock-700',
};

// Höhen 36/44/52 wie im DS (sm/md/lg), enge Radien.
const sizeContainer: Record<Size, string> = {
  sm: 'h-9 gap-1.5 rounded-sm px-3.5',
  md: 'h-11 gap-2 rounded-md px-[18px]',
  lg: 'h-[52px] gap-2 rounded-md px-[22px]',
};

const sizeText: Record<Size, string> = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
  lg: 'text-[17px]',
};

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  fullWidth = false,
  loading = false,
  disabled = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  // Spinner-Farbe: weiß auf gefüllten Varianten, sonst Ink.
  const spinnerColor =
    variant === 'primary' || variant === 'secondary' ? colors.rock[0] : colors.rock[700];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center active:scale-[0.97]',
        sizeContainer[size],
        variantContainer[variant],
        fullWidth && 'w-full',
        isDisabled && 'opacity-45',
        className,
      )}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {icon}
          {typeof children === 'string' ? (
            <Text className={cn('font-sans-semibold', sizeText[size], variantText[variant])}>
              {children}
            </Text>
          ) : (
            children
          )}
          {trailingIcon}
        </>
      )}
    </Pressable>
  );
}
