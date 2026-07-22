import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

// Chat-Blase — Orange + rechts für `mine`, Rock-100 + links für die andere Person.
// Die asymmetrisch gekappte Ecke (auf der Sender-Seite) gibt die Gesprächsrichtung.
// Mono-Timestamp darunter; bei Gruppen nur an der letzten Blase zeigen.
//
// Der Avatar-Platz links wird für JEDE fremde Blase freigehalten, gefüllt aber nur
// an der letzten Blase einer Gruppe — sonst stünde dieselbe Person untereinander
// mehrfach da, und ohne den Platzhalter würden die Blasen einer Gruppe springen.
const AVATAR_GUTTER = 28;

export type MessageBubbleProps = {
  mine?: boolean;
  time?: string;
  /** Nur für fremde Blasen; erwartet einen `<Avatar size="xs" />`. */
  avatar?: ReactNode;
  children?: ReactNode;
};

export function MessageBubble({ mine = false, time, avatar, children }: MessageBubbleProps) {
  const bubble = (
    <View className={cn('gap-0.5', mine ? 'items-end' : 'items-start')}>
      <View
        className={cn('px-3.5 py-2.5', mine ? 'bg-brand-500' : 'bg-rock-100')}
        style={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: mine ? 16 : 4,
          borderBottomRightRadius: mine ? 4 : 16,
        }}>
        <Text className={cn('font-sans text-[15px] leading-5', mine ? 'text-rock-0' : 'text-rock-900')}>
          {children}
        </Text>
      </View>
      {time ? <Text className="px-0.5 font-mono text-[11px] text-rock-400">{time}</Text> : null}
    </View>
  );

  if (mine) {
    return <View className="max-w-[78%] self-end">{bubble}</View>;
  }

  return (
    <View className="max-w-[86%] flex-row items-end gap-2 self-start">
      <View style={{ width: AVATAR_GUTTER }} className="shrink-0">
        {avatar}
      </View>
      <View className="min-w-0 shrink">{bubble}</View>
    </View>
  );
}
