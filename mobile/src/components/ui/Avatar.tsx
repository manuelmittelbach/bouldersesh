import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { cn, initials as toInitials } from '@/lib/utils';

// Initialen-Avatar mit ruhiger, kühler Ton-Palette (keine Bonbon-Gradienten) + optionalem
// Online-Punkt. `src` ersetzt die Initialen durch ein Foto. slate/moss/clay leben nur hier
// als Roh-Hex (nicht in der Rock-Skala) — daher inline statt NativeWind-Klasse.
type Tone = 'rock' | 'orange' | 'slate' | 'moss' | 'clay';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const dims: Record<Size, number> = { xs: 28, sm: 36, md: 44, lg: 56, xl: 88 };

const toneBg: Record<Tone, string> = {
  rock: '#353b47', // rock-700
  orange: '#f25c16', // brand-500
  slate: '#3a4252',
  moss: '#2f5d4a',
  clay: '#7a4a36',
};

export type AvatarProps = {
  name?: string | null;
  initials?: string;
  tone?: Tone;
  size?: Size;
  online?: boolean;
  src?: string | null;
  className?: string;
};

export function Avatar({
  name,
  initials,
  tone = 'rock',
  size = 'md',
  online = false,
  src,
  className,
}: AvatarProps) {
  const dim = dims[size];
  const text = initials ?? toInitials(name);
  const fontSize = Math.round(dim * 0.4);
  const dot = Math.max(8, Math.round(dim * 0.24));

  return (
    <View style={{ width: dim, height: dim }} className={cn('shrink-0', className)}>
      <View
        style={{ width: dim, height: dim, borderRadius: dim / 2, backgroundColor: toneBg[tone] }}
        className="items-center justify-center overflow-hidden">
        {src ? (
          <Image source={{ uri: src }} style={{ width: dim, height: dim }} contentFit="cover" />
        ) : (
          <Text className="font-display text-rock-0" style={{ fontSize }}>
            {text}
          </Text>
        )}
      </View>
      {online ? (
        <View
          style={{ width: dot, height: dot, borderRadius: dot / 2 }}
          className="absolute bottom-0 right-0 border-2 border-rock-0 bg-success"
        />
      ) : null}
    </View>
  );
}

// Daten für einen einzelnen Avatar in einer Personen-Reihe (z. B. der Kader-Slot-Reihe
// auf Feed-Karten). Die `src`-URL ist fertig gerechnet, nicht der Storage-Pfad.
export type AvatarMember = {
  id: string;
  name?: string | null;
  tone?: Tone;
  src?: string | null;
};
