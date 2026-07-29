import { Check, Clock, Crown, MapPin, Users } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Card, GradePill } from '@/components/ui';
import { cn, type AvatarTone, type GradeBand } from '@/lib/utils';
import { colors } from '@/theme/colors';

// Meine Beziehung zu einer Session im Feed — höchstens eine je Karte (Ersteller:in ≠
// Anfragende:r, und eine Anfrage ist pending ODER accepted, nie beides). Rendert als
// ruhiger Streifen unter der Karte; dieselben drei Wörter gruppieren den Chats-Tab
// (ADR-0010, verallgemeinert den `pending`-only-Streifen aus ADR-0006).
export type SessionLabel = 'hosting' | 'joined' | 'requested';

// Tönung + Icon + Text je Zustand. Der Trenn-Hairline bleibt für alle drei neutral
// (rock-100) — die Unterscheidung trägt die Fläche, das Icon und die Textfarbe, das
// hält den Diff frei von fehlenden Border-Tokens. Requested nutzt Clock (statt eines
// zweiten Häkchens neben Joined) — „wartet" ist ohnehin die App-Sprache dafür (Chats).
const LABEL_STYLE: Record<
  SessionLabel,
  { bg: string; text: string; label: string; icon: ReactNode }
> = {
  hosting: {
    bg: 'bg-brand-50',
    text: 'text-brand-700',
    label: 'Hosting',
    icon: <Crown size={13} color={colors.brand[600]} strokeWidth={2.5} />,
  },
  joined: {
    bg: 'bg-success-surface',
    text: 'text-success',
    label: 'Joined',
    icon: <Check size={13} color={colors.success} strokeWidth={2.5} />,
  },
  requested: {
    bg: 'bg-rock-25',
    text: 'text-rock-500',
    label: 'Requested',
    icon: <Clock size={13} color={colors.rock[400]} strokeWidth={2.5} />,
  },
};

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
  /** „N of M spots left" — freie Plätze für Mitkletternde, ohne die Ersteller:in (ADR-0007). */
  spots?: string | null;
  note?: string | null;
  /** Footer-Slot — z. B. ein Match-Badge. */
  footer?: ReactNode;
  /** Meine Beziehung zu dieser Session → getönter Streifen unter der Karte
   *  (Hosting/Joined/Requested). Fehlt sie, hat die Karte keinen Streifen. */
  label?: SessionLabel | null;
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
  spots,
  note,
  footer,
  label,
  online = false,
  onPress,
  onPressAuthor,
}: SessionCardProps) {
  const stripe = label ? LABEL_STYLE[label] : null;
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
          {spots ? (
            <MetaRow icon={<Users size={14} color={colors.rock[400]} strokeWidth={2} />}>{spots}</MetaRow>
          ) : null}
          {note ? (
            <Text numberOfLines={3} className="mt-2 font-sans text-[13px] leading-5 text-rock-700">
              {note}
            </Text>
          ) : null}
          {footer ? <View className="mt-3">{footer}</View> : null}
        </View>
      </View>

      {/* Rollen-Streifen: volle Kartenbreite unten (negative Ränder heben das
          Card-Padding auf), getönt je Zustand. Position UNTER dem Inhalt = eindeutig
          zu dieser Karte. Hosting (brand) hebt „deine Session" hervor, Joined (success)
          bestätigt, Requested (rock) bleibt ruhig — Erinnerung, kein Alarm. */}
      {stripe ? (
        <View
          className={cn(
            '-mx-4 -mb-4 mt-3 flex-row items-center justify-center gap-1.5 rounded-b-lg border-t border-rock-100 px-4 py-2',
            stripe.bg,
          )}>
          {stripe.icon}
          <Text className={cn('font-sans-semibold text-[12px]', stripe.text)}>{stripe.label}</Text>
        </View>
      ) : null}
    </Card>
  );
}
