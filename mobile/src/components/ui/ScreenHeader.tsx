import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';
import { colors } from '@/theme/colors';

import { IconButton } from './IconButton';

// Einheitliche Kopfzeile mit führendem Zurück-/Schließen-Button. Die fixe Höhe (h-14)
// und das px-4 sorgen dafür, dass der Nav-Button auf JEDER Seite gleich groß ist und an
// exakt derselben Stelle sitzt — vorher hatte jeder Screen sein eigenes Header-Padding
// (px-3 vs px-4, py-2 vs py-3 vs h-12), sodass der Button leicht wanderte.
//
// Button selbst bleibt der DS-`IconButton` (ghost, 40x40, Icon 24). `title`/`children`
// sind optionale Slots: `title` für eine Überschrift (links oder mittig), `children` für
// Zusatzinhalt in der Zeile (z. B. die Mitglieder-Leiste im Chat).
type ScreenHeaderProps = {
  icon?: 'back' | 'close';
  onPress?: () => void;
  label?: string;
  title?: string;
  titleAlign?: 'left' | 'center';
  border?: boolean;
  children?: ReactNode;
};

export function ScreenHeader({
  icon = 'back',
  onPress,
  label,
  title,
  titleAlign = 'left',
  border = false,
  children,
}: ScreenHeaderProps) {
  const Glyph = icon === 'close' ? X : ArrowLeft;

  return (
    <View
      className={cn(
        'h-14 flex-row items-center px-4',
        border && 'border-b border-rock-100',
      )}>
      <IconButton
        variant="ghost"
        label={label ?? (icon === 'close' ? 'Close' : 'Back')}
        onPress={onPress ?? (() => router.back())}>
        <Glyph size={24} color={colors.rock[700]} strokeWidth={2} />
      </IconButton>

      {/* Mittiger Titel liegt absolut über der Zeile, damit er unabhängig vom Button
          zentriert bleibt (Modal-Konvention). pointer-events aus, der Button darunter
          bleibt tippbar. */}
      {title && titleAlign === 'center' ? (
        <View pointerEvents="none" className="absolute left-0 right-0 items-center">
          <Text numberOfLines={1} className="font-display text-base text-rock-900">
            {title}
          </Text>
        </View>
      ) : null}

      {title && titleAlign === 'left' ? (
        <Text numberOfLines={1} className="ml-1 font-display text-base text-rock-900">
          {title}
        </Text>
      ) : null}

      {children ? (
        <View className="ml-1 flex-1 flex-row items-center">{children}</View>
      ) : null}
    </View>
  );
}
