import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

// Chat-Blase — Orange + rechts für `mine`, Rock-100 + links für die andere Person.
// Die asymmetrisch gekappte Ecke (auf der Sender-Seite) gibt die Gesprächsrichtung.
// Mono-Timestamp darunter; bei Gruppen nur an der letzten Blase zeigen.
export type MessageBubbleProps = {
  mine?: boolean;
  time?: string;
  children?: ReactNode;
};

export function MessageBubble({ mine = false, time, children }: MessageBubbleProps) {
  return (
    <View className={cn('gap-0.5', mine ? 'items-end' : 'items-start')}>
      <View
        className={cn('max-w-[78%] px-3.5 py-2.5', mine ? 'bg-brand-500' : 'bg-rock-100')}
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
}
