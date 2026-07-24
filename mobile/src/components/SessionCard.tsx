import { Clock, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Card, GradePill } from '@/components/ui';
import type { AvatarTone, GradeBand } from '@/lib/utils';
import { colors } from '@/theme/colors';

// Die Signatur-Feed-Einheit: wer klettert, wann, wo, auf welchem Niveau. Komponiert
// Avatar + GradePill + Card. Das Pill zeigt das Niveau der Ersteller:in (ADR-0005) —
// fehlt es, wird keins gezeigt. Die Meta-Zeilen-Icons (Uhr/Pin) rendert die Karte selbst.
function MetaRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <View className="mt-1 flex-row items-center gap-1.5">
      {icon}
      <Text numberOfLines={1} className="flex-1 font-sans text-[13px] text-rock-500">
        {children}
      </Text>
    </View>
  );
}

export type SessionCardProps = {
  name: string;
  avatarTone?: AvatarTone;
  /** Fertige Bild-URL, nicht der Storage-Pfad — siehe `publicImageUrl`. */
  avatarSrc?: string | null;
  grade?: string | null;
  band?: GradeBand;
  time?: string;
  gym?: string;
  note?: string | null;
  /** Footer-Slot — z. B. ein Match-Badge. */
  footer?: ReactNode;
  online?: boolean;
  onPress?: () => void;
  /** Tippen auf den Avatar öffnet das Profil der Ersteller:in. Fehlt es, ist nur
   *  die Karte als Ganzes tippbar (→ Session). */
  onPressAuthor?: () => void;
};

export function SessionCard({
  name,
  avatarTone = 'rock',
  avatarSrc,
  grade,
  band = 'neutral',
  time,
  gym,
  note,
  footer,
  online = false,
  onPress,
  onPressAuthor,
}: SessionCardProps) {
  const avatar = <Avatar name={name} tone={avatarTone} size="md" online={online} src={avatarSrc} />;
  return (
    <Card interactive={!!onPress} onPress={onPress}>
      <View className="flex-row items-start gap-3">
        {/* Nur der Avatar führt zum Profil; der Rest der Karte bleibt → Session. */}
        {onPressAuthor ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${name}’s profile`}
            hitSlop={6}
            onPress={onPressAuthor}
            className="active:opacity-70">
            {avatar}
          </Pressable>
        ) : (
          avatar
        )}
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text numberOfLines={1} className="flex-1 font-display text-[17px] text-rock-900">
              {name}
            </Text>
            {grade ? <GradePill grade={grade} band={band} /> : null}
          </View>
          {time ? (
            <MetaRow icon={<Clock size={14} color={colors.rock[400]} strokeWidth={2} />}>{time}</MetaRow>
          ) : null}
          {gym ? (
            <MetaRow icon={<MapPin size={14} color={colors.rock[400]} strokeWidth={2} />}>{gym}</MetaRow>
          ) : null}
          {note ? (
            <Text numberOfLines={3} className="mt-2 font-sans text-[13px] leading-5 text-rock-700">
              {note}
            </Text>
          ) : null}
          {footer ? <View className="mt-3">{footer}</View> : null}
        </View>
      </View>
    </Card>
  );
}
