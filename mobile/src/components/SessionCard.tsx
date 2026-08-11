import { Check, Clock, Crown, MapPin, Plus, Users } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Card, GradePill, type AvatarStackMember } from '@/components/ui';
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
// fehlt es, wird keins gezeigt. Die Zeit steht oben rechts (Timestamp); die Meta-Zeile
// mit Pin-Icon (Halle) rendert die Karte selbst.
function MetaRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    // mt-2.5 = exakt derselbe Abstand wie Ort→Kader darunter (beide 10px, symmetrisch um den Ort).
    <View className="mt-2.5 flex-row items-center gap-1.5">
      {icon}
      <Text numberOfLines={1} className="flex-1 font-sans text-[13px] text-rock-500">
        {children}
      </Text>
    </View>
  );
}

// Erstes Wort des Namens — unter dem Avatar reicht der Vorname, hält die Slots schmal.
function firstName(name?: string | null): string {
  return (name ?? 'Climber').trim().split(/\s+/)[0] || 'Climber';
}

// Ein Platz in der Kader-Zeile: ein Rund (Avatar oder „+"-Kreis) mit Label darunter,
// als Spalte fixer Breite, damit die Labels sauber untereinander sitzen. Ist `onPress`
// gesetzt, ist der ganze Slot tippbar (Profil bzw. Beitritts-CTA).
function RosterSlot({
  children,
  label,
  labelClass,
  onPress,
  a11yLabel,
}: {
  children: ReactNode;
  label: string;
  labelClass: string;
  onPress?: () => void;
  a11yLabel: string;
}) {
  const col = (
    <View className="items-center gap-1" style={{ width: 52 }}>
      {children}
      <Text numberOfLines={1} className={cn('font-sans text-[11px]', labelClass)}>
        {label}
      </Text>
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      hitSlop={4}
      onPress={onPress}
      className="active:opacity-70">
      {col}
    </Pressable>
  ) : (
    col
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
  /** Anzahl noch freier Plätze (ohne die Ersteller:in, ADR-0007). Jeder freie Platz wird
   *  als „+ Available"-Slot gerendert und wirkt als Beitritts-CTA. 0 → keine freien Slots. */
  spotsLeft?: number;
  /** Angenommene Mitkletternde (OHNE Ersteller:in) → je ein Avatar-Slot mit Vorname
   *  darunter. Leer/fehlend → nur die freien Slots. URLs sind fertig (nicht der Storage-Pfad). */
  climbers?: AvatarStackMember[];
  /** Tippen auf ein Kader-Gesicht öffnet dessen Profil. Fehlt es, ist der Stack stumm. */
  onPressClimber?: (id: string) => void;
  note?: string | null;
  /** Footer-Slot — z. B. ein Match-Badge. */
  footer?: ReactNode;
  /** Meine Beziehung zu dieser Session → getönter Streifen unter der Karte
   *  (Hosting/Joined/Requested). Fehlt sie, hat die Karte keinen Streifen. */
  label?: SessionLabel | null;
  /** Volle Session (`matched`) → Karte gedimmt. Ob sie tippbar ist, hängt allein an
   *  `onPress`: bei einer eigenen/beigetretenen vollen Session setzt der Feed ihn (Sheet
   *  mit Löschen/Verlassen), bei einer vollen Fremd-Session lässt er ihn weg — dann ist
   *  die Karte ein stummer „Full"-Beleg. Orthogonal zum Rollen-Streifen (ADR-0011). */
  full?: boolean;
  online?: boolean;
  onPress?: () => void;
  /** Tippen auf den Avatar öffnet das Profil der Ersteller:in. Fehlt es, ist nur
   *  die Karte als Ganzes tippbar (→ onPress, das Aktions-Sheet). */
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
  spotsLeft = 0,
  climbers,
  onPressClimber,
  note,
  footer,
  label,
  full = false,
  online = false,
  onPress,
  onPressAuthor,
}: SessionCardProps) {
  const stripe = label ? LABEL_STYLE[label] : null;
  const avatar = <Avatar name={name} tone={avatarTone} size="md" online={online} src={avatarSrc} />;
  return (
    <Card
      interactive={!!onPress}
      onPress={onPress}
      // Voll → grauer Kartengrund (statt rock-0-Weiß) + stärkeres Dimmen: hebt „nicht
      // beitretbar" auf einen Blick von den weißen, joinbaren Karten ab — unabhängig
      // davon, ob Host ein Foto/Grade hat (ADR-0011). twMerge überschreibt bg-rock-0.
      className={full ? 'bg-rock-50 opacity-50' : undefined}>
      <View className="flex-row items-start gap-3">
        {/* Nur der Avatar führt zum Profil; der Rest der Karte löst onPress aus (Aktions-Sheet). */}
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
            {/* Name + Grade-Pill als EINE Gruppe: das Niveau gehört zur Ersteller:in
                (ADR-0005), steht also direkt hinter ihr. Der Name schrumpft/trunkiert,
                damit Pill und Zeit immer sichtbar bleiben. */}
            <View className="min-w-0 flex-1 flex-row items-center gap-2">
              <Text numberOfLines={1} className="shrink font-display text-[17px] text-rock-900">
                {name}
              </Text>
              {grade ? <GradePill grade={grade} band={band} /> : null}
            </View>
            {/* „Wann" oben rechts als Timestamp (wo das Auge es sucht), statt als graue
                Meta-Zeile zwischen Notiz und Halle unterzugehen. Feste Breite. */}
            {time ? (
              <View className="shrink-0 flex-row items-center gap-1.5">
                <Clock size={13} color={colors.rock[400]} strokeWidth={2} />
                <Text numberOfLines={1} className="font-sans text-[13px] text-rock-500">
                  {time}
                </Text>
              </View>
            ) : null}
          </View>
          {/* Die Beschreibung („was ich klettern will", ADR-0005) steht direkt unter dem
              Namen — die Stimme der Ersteller:in bei der Person, nicht am Kartenende. Nicht
              geclampt: die Notiz soll vollständig lesbar sein; das Erstell-Limit (80 Zeichen)
              hält sie ohnehin knapp, sodass sie die Fakten (Halle/Kader) darunter kaum
              wegschiebt. */}
          {note ? (
            <Text className="mt-1 font-sans text-[13px] leading-5 text-rock-700">
              {note}
            </Text>
          ) : null}
          {gym ? (
            <MetaRow icon={<MapPin size={14} color={colors.rock[400]} strokeWidth={2} />}>{gym}</MetaRow>
          ) : null}
          {/* Kader als Slot-Reihe: jede beigetretene Person ein Avatar mit Vorname darunter,
              jeder freie Platz ein gestrichelter „+"-Kreis mit „Available" — der als
              Beitritts-CTA wirkt (Tap = dieselbe Karten-Aktion). Das Users-Icon führt links
              (bündig mit dem Pin darüber). Keine Beigetretenen + keine freien Plätze → nichts. */}
          {(climbers && climbers.length > 0) || spotsLeft > 0 ? (
            <View className="mt-2.5 flex-row items-start gap-2">
              <Users
                size={14}
                color={colors.rock[400]}
                strokeWidth={2}
                style={{ marginTop: 15 }}
              />
              <View className="flex-1 flex-row flex-wrap gap-x-3 gap-y-2">
                {climbers?.map((c) => (
                  <RosterSlot
                    key={c.id}
                    label={firstName(c.name)}
                    labelClass="text-rock-600"
                    a11yLabel={`View ${c.name ?? 'climber'}’s profile`}
                    onPress={onPressClimber ? () => onPressClimber(c.id) : undefined}>
                    <Avatar name={c.name} tone={c.tone} size="md" src={c.src} />
                  </RosterSlot>
                ))}
                {Array.from({ length: spotsLeft }).map((_, i) => (
                  <RosterSlot
                    key={`free-${i}`}
                    label="Available"
                    labelClass="font-sans-semibold text-brand-600"
                    a11yLabel="Join this session"
                    onPress={onPress}>
                    <View
                      style={{ width: 44, height: 44, borderRadius: 22 }}
                      className="items-center justify-center border border-dashed border-brand-300 bg-brand-50">
                      <Plus size={20} color={colors.brand[500]} strokeWidth={2.5} />
                    </View>
                  </RosterSlot>
                ))}
              </View>
            </View>
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
