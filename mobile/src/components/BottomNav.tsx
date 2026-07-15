import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import { forwardRef } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

// DS-BottomNav für Expo Routers custom Tabs (expo-router/ui). Die Bar selbst ist die
// gestylte `TabList` (siehe navBarStyle); jeder Tab ist ein `NavItem`, das via
// `TabTrigger asChild` den `isFocused`-Status bekommt. Send-Orange = aktiv, Rock-400 = ruhig.
// Icon-/Text-Farbe imperativ (Lucide nimmt `color`, kein className) aus theme/colors.

/**
 * Container-Style der Tab-Bar. Als RN-Style-Objekt (nicht className), weil es direkt an
 * `TabList` (ViewProps) geht und den Safe-Area-Bottom-Inset einrechnen muss.
 */
export function navBarStyle(bottomInset: number): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.rock[0],
    borderTopWidth: 1,
    borderTopColor: colors.rock[100],
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 8 + bottomInset,
    // Niedriger, kühler Schatten nach oben (iOS) / Elevation (Android).
    shadowColor: colors.rock[900],
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  };
}

type NavItemProps = TabTriggerSlotProps & {
  icon: LucideIcon;
  label: string;
};

export const NavItem = forwardRef<View, NavItemProps>(function NavItem(
  { icon: Icon, label, isFocused, ...props },
  ref,
) {
  const tint = isFocused ? colors.brand[500] : colors.rock[400];
  return (
    <Pressable ref={ref} {...props} className="min-w-16 items-center gap-1 py-1">
      <Icon size={24} color={tint} strokeWidth={2} />
      <Text className="font-sans-semibold text-[11px]" style={{ color: tint, letterSpacing: -0.1 }}>
        {label}
      </Text>
    </Pressable>
  );
});
