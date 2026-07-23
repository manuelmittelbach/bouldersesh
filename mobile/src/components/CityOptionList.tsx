import { Check, MapPin } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import type { City } from '@/types/database';

// Die eine Städte-Liste, die sich das Onboarding-Gate (/city) und der Header-Dropdown
// teilen — sonst driften zwei Kopien derselben Karten auseinander. Rein präsentational:
// Daten und „was passiert beim Tippen" kommen von außen.
export function CityOptionList({
  cities,
  counts,
  activeId,
  onPick,
}: {
  cities: City[];
  counts: Record<string, number> | undefined;
  activeId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <View className="gap-2">
      {cities.map((city) => {
        const active = activeId === city.id;
        const count = counts?.[city.id] ?? 0;
        return (
          <Pressable
            key={city.id}
            onPress={() => onPick(city.id)}
            className={
              'flex-row items-center gap-3 rounded-md border px-4 py-3.5 active:scale-[0.99] ' +
              (active ? 'border-brand-500 bg-brand-50' : 'border-rock-200 bg-rock-0')
            }>
            <MapPin
              size={18}
              color={active ? colors.brand[600] : colors.rock[400]}
              strokeWidth={2}
            />
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className={
                  'font-sans-semibold text-[15px] ' + (active ? 'text-brand-700' : 'text-rock-900')
                }>
                {city.name}
              </Text>
              {/* Solange `counts` lädt, gar keine Zeile — lieber nichts sagen als
                  „0 open sessions" behaupten. */}
              {counts ? (
                <Text className="mt-0.5 font-sans text-[13px] text-rock-500">
                  {count === 1 ? '1 open session' : `${count} open sessions`}
                </Text>
              ) : null}
            </View>
            {active ? <Check size={18} color={colors.brand[600]} strokeWidth={2.5} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
