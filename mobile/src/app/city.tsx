import { router } from 'expo-router';
import { Check, MapPin, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui';
import { useActiveCity } from '@/hooks/useActiveCity';
import { useCities, useOpenSessionCountsByCity } from '@/queries/cities';
import { colors } from '@/theme/colors';

// Der Stadt-Screen hat zwei Leben: beim ersten Start nach dem Login ist er das
// blockierende Gate (RootNavigator gibt die App-Routen erst frei, wenn eine Stadt
// steht), danach derselbe Screen als Wechsler. Unterschied nur im Chrome: als Gate
// ohne Schließen-Button, als Wechsler mit.
export default function CityPicker() {
  const { cityId, setActiveCity } = useActiveCity();
  const { data: cities, isLoading, error } = useCities();
  const { data: counts } = useOpenSessionCountsByCity();

  const isSwitching = !!cityId;

  async function pick(id: string) {
    await setActiveCity(id);
    // Als Gate braucht es keine Navigation: sobald die Stadt steht, gibt Stack.Protected
    // die App-Routen frei und expo-router leitet selbst um.
    if (isSwitching) router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <View className="h-12 flex-row items-center justify-between px-3">
        {isSwitching ? (
          <IconButton variant="ghost" label="Close" onPress={() => router.back()}>
            <X size={24} color={colors.rock[700]} strokeWidth={2} />
          </IconButton>
        ) : (
          <View className="w-10" />
        )}
        <View className="w-10" />
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10">
        <Text className="font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
          Where are you climbing?
        </Text>
        <Text className="mb-6 mt-1 font-display-bold text-[30px] leading-none text-rock-900">
          Pick your city
        </Text>

        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color={colors.brand[500]} />
          </View>
        ) : error ? (
          <Text className="py-2 font-sans text-sm text-danger">
            Couldn’t load cities: {(error as Error).message}
          </Text>
        ) : !cities || cities.length === 0 ? (
          <Text className="py-2 font-sans text-sm text-rock-500">No cities available yet.</Text>
        ) : (
          <View className="gap-2">
            {cities.map((city) => {
              const active = cityId === city.id;
              const count = counts?.[city.id] ?? 0;
              return (
                <Pressable
                  key={city.id}
                  onPress={() => pick(city.id)}
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
                        'font-sans-semibold text-[15px] ' +
                        (active ? 'text-brand-700' : 'text-rock-900')
                      }>
                      {city.name}
                    </Text>
                    {/* Solange `counts` lädt, gar keine Zeile — lieber nichts sagen
                        als „0 open sessions" behaupten. */}
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
