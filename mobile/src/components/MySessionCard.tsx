import { Clock, MapPin, Users } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import { colors } from '@/theme/colors';

// Die eigene Session am Profil-Tab. Anders als SessionCard führt sie NICHT mit
// dem Namen der Ersteller:in (das bin ich — redundant), sondern mit Halle + Zeit.
// Rechts oben ein „Matched"-Badge, sobald jemand angenommen hat; unten ein
// Brand-Streifen „N requests", solange offene Anfragen warten (Handlungsaufruf →
// tippen öffnet die Session mit ihrer Anfragen-Liste).
export type MySessionCardProps = {
  gym?: string | null;
  /** Fertig formatiert, MIT Tag — die Liste spannt über mehrere Tage. */
  time: string;
  note?: string | null;
  /** status === 'matched' → jemand hat angenommen, die Session ist aus dem Feed. */
  matched?: boolean;
  /** Offene (pending) Anfragen an dieser Session. 0 → kein Streifen. */
  pendingCount?: number;
  onPress?: () => void;
};

export function MySessionCard({
  gym,
  time,
  note,
  matched = false,
  pendingCount = 0,
  onPress,
}: MySessionCardProps) {
  // Matched hat Vorrang: ist die Session vergeben, ist die Anfragen-Zahl nicht mehr
  // die relevante Information.
  const showRequests = !matched && pendingCount > 0;
  return (
    <Card interactive={!!onPress} onPress={onPress}>
      <View className="flex-row items-start justify-between gap-2">
        <Text
          numberOfLines={1}
          className="flex-1 font-display text-[17px] text-rock-900">
          {gym ?? 'Session'}
        </Text>
        {matched ? <Badge tone="success">Matched</Badge> : null}
      </View>

      <View className="mt-1 flex-row items-center gap-1.5">
        <Clock size={14} color={colors.rock[400]} strokeWidth={2} />
        <Text numberOfLines={1} className="font-sans text-[13px] text-rock-500">
          {time}
        </Text>
      </View>

      {gym ? (
        <View className="mt-1 flex-row items-center gap-1.5">
          <MapPin size={14} color={colors.rock[400]} strokeWidth={2} />
          <Text numberOfLines={1} className="font-sans text-[13px] text-rock-500">
            {gym}
          </Text>
        </View>
      ) : null}

      {note ? (
        <Text
          numberOfLines={2}
          className="mt-2 font-sans text-[13px] leading-5 text-rock-700">
          {note}
        </Text>
      ) : null}

      {/* „N requests"-Streifen — volle Kartenbreite unten (negative Ränder heben das
          Card-Padding auf). Brand statt ruhigem Grau: hier ist etwas für DICH zu tun. */}
      {showRequests ? (
        <View className="-mx-4 -mb-4 mt-3 flex-row items-center justify-center gap-1.5 rounded-b-lg border-t border-brand-100 bg-brand-50 px-4 py-2">
          <Users size={13} color={colors.brand[600]} strokeWidth={2.5} />
          <Text className="font-sans-semibold text-[12px] text-brand-700">
            {pendingCount === 1 ? '1 request' : `${pendingCount} requests`}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}
