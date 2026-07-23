import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityOptionList } from '@/components/CityOptionList';
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

  // Ob Gate oder Wechsler entscheidet die History beim Mount, NICHT `cityId`: als Gate
  // ist `city` die einzige Route, es gibt nichts, wohin zurück. Würde man `!!cityId`
  // nehmen, tauchte nach der Wahl im Gate ein Schließen-Button auf, dessen router.back()
  // ins Leere läuft („The action 'GO_BACK' was not handled by any navigator").
  const isSwitching = useRef(router.canGoBack()).current;

  // Stack.Protected leitet nur um, wenn die AKTUELLE Route unerreichbar wird. `city`
  // liegt bewusst außerhalb des Stadt-Guards und bleibt darum erreichbar — nach der Wahl
  // im Gate bliebe der Screen also einfach stehen. Der Sprung muss von Hand kommen, und
  // zwar aus einem Effect: erst danach hat Stack.Protected `(tabs)` registriert.
  useEffect(() => {
    if (!isSwitching && cityId) router.replace('/(tabs)');
  }, [isSwitching, cityId]);

  async function pick(id: string) {
    await setActiveCity(id);
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
          <CityOptionList cities={cities} counts={counts} activeId={cityId} onPick={pick} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
