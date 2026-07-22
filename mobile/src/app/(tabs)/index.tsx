import { router } from 'expo-router';
import { Mountain, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/SessionCard';
import { Button, Chip, IconButton } from '@/components/ui';
import { useActiveCity } from '@/hooks/useActiveCity';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, formatDateShort, formatSessionTime, gradeBand } from '@/lib/utils';
import { useCities } from '@/queries/cities';
import { useGyms, type GymWithCity } from '@/queries/gyms';
import { useOpenSessions, type SessionWithMeta } from '@/queries/sessions';
import { colors } from '@/theme/colors';

// Der Feed: offene Sessions der aktiven Stadt als SessionCard-Liste, über alle Hallen
// der Stadt gemischt. Die Halle ist ein OPTIONALER Filter-Chip, keine zweite Pflichtstufe
// — Entdeckung über Hallengrenzen hinweg ist gewollt (CONTEXT.md, „Entdecken-Feed").
// FAB unten rechts (der EINE Brand-Glow der View) führt ins Anlegen-Formular.
function Header({
  cityName,
  gyms,
  gymId,
  onSelectGym,
}: {
  cityName: string | null;
  gyms: GymWithCity[] | undefined;
  gymId: string | null;
  onSelectGym: (id: string | null) => void;
}) {
  return (
    <View className="pb-3 pt-2">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
          {formatDateShort(new Date())}
        </Text>
        <Pressable onPress={() => router.push('/city')} hitSlop={8}>
          <Text className="font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-brand-600">
            Change city
          </Text>
        </Pressable>
      </View>
      <Text className="mt-1 font-display-bold text-[30px] leading-none text-rock-900">
        {cityName ? `Who's climbing in ${cityName}?` : "Who's climbing?"}
      </Text>

      {/* Hallen-Filter — nur zeigen, wenn es in der Stadt überhaupt etwas zu filtern gibt. */}
      {gyms && gyms.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pr-4"
          className="mt-4">
          <Chip active={gymId === null} onPress={() => onSelectGym(null)}>
            All gyms
          </Chip>
          {gyms.map((gym) => (
            <Chip key={gym.id} active={gymId === gym.id} onPress={() => onSelectGym(gym.id)}>
              {gym.name}
            </Chip>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

// Zwei Leer-Zustände, weil sie zwei verschiedene Dinge bedeuten: „in dieser Stadt ist
// nichts los" (dann ist Anlegen die richtige Antwort) vs. „nur dieser Hallen-Filter ist
// leer" — da wäre „Session anlegen" als Primäraktion irreführend, obwohl die Stadt voll
// ist. Dann zurück auf alle Hallen.
function EmptyState({
  cityName,
  gymName,
  onClearGym,
}: {
  cityName: string | null;
  gymName: string | null;
  onClearGym: () => void;
}) {
  return (
    <View className="items-center px-6 py-16">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <Mountain size={28} color={colors.brand[600]} strokeWidth={2} />
      </View>
      <Text className="font-display text-base text-rock-900">
        {gymName
          ? `No sessions at ${gymName}`
          : cityName
            ? `No sessions in ${cityName} yet`
            : 'No sessions yet'}
      </Text>
      <Text className="mb-4 mt-1 text-center font-sans text-sm text-rock-500">
        {gymName
          ? `Other gyms${cityName ? ` in ${cityName}` : ''} might be busier.`
          : 'Be the first to head to the wall today.'}
      </Text>
      {gymName ? (
        <Button variant="primary" onPress={onClearGym}>
          Show all gyms
        </Button>
      ) : (
        <Button
          variant="primary"
          icon={<Plus size={16} color={colors.rock[0]} strokeWidth={2.5} />}
          onPress={() => router.push('/sessions/new')}>
          Create session
        </Button>
      )}
      {/* Bewusst KEIN Anteasern von Sessions aus anderen Städten — nur das Angebot,
          den Kontext selbst zu wechseln. */}
      <Button variant="ghost" className="mt-2" onPress={() => router.push('/city')}>
        Change city
      </Button>
    </View>
  );
}

export default function Dashboard() {
  const { cityId, setActiveCity } = useActiveCity();
  const { data: cities } = useCities();
  const city = cities?.find((c) => c.id === cityId) ?? null;
  const cityName = city?.name ?? null;

  // Die gespeicherte Stadt-ID kann ins Leere zeigen (Stadt entfernt, anderes Backend).
  // Das Gate im RootNavigator sieht nur „irgendeine ID gesetzt" und würde durchwinken —
  // der Feed bliebe dann für immer stumm leer. Also zurücksetzen, was das Gate erneut
  // greifen lässt. Nur wenn die Städte wirklich geladen sind: solange `cities`
  // undefined ist (Ladefehler, offline), ist Nichtstun richtig.
  useEffect(() => {
    if (cityId && cities && !city) setActiveCity(null);
  }, [cityId, cities, city, setActiveCity]);

  const { data: gyms } = useGyms(cityId);
  const [gymId, setGymId] = useState<string | null>(null);
  const gymName = gyms?.find((g) => g.id === gymId)?.name ?? null;

  // Stadtwechsel setzt den Hallen-Filter zurück — die alte Halle liegt nicht in der
  // neuen Stadt und würde den Feed sonst stumm leer machen.
  useEffect(() => {
    setGymId(null);
  }, [cityId]);

  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useOpenSessions({
    city_id: cityId ?? undefined,
    gym_id: gymId ?? undefined,
  });

  // Eigener Pull-Zustand: der RefreshControl-Spinner soll NUR bei echtem Runterziehen
  // laufen, nicht bei jedem Hintergrund-Refetch (refetchOnMount).
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[500]} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-sans text-sm text-danger">
            Couldn’t load: {(error as Error).message}
          </Text>
        </View>
      ) : (
        <FlatList<SessionWithMeta>
          data={sessions ?? []}
          keyExtractor={(s) => s.id}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerClassName="px-5 pb-8 gap-3"
          ListHeaderComponent={
            <Header
              cityName={cityName}
              gyms={gyms}
              gymId={gymId}
              onSelectGym={setGymId}
            />
          }
          ListEmptyComponent={
            <EmptyState
              cityName={cityName}
              gymName={gymName}
              onClearGym={() => setGymId(null)}
            />
          }
          renderItem={({ item }) => {
            const name = item.creator?.display_name ?? 'Anonymous';
            return (
              <SessionCard
                name={name}
                avatarTone={avatarTone(item.creator?.id ?? name)}
                avatarSrc={publicImageUrl(item.creator?.avatar_path)}
                grade={item.level}
                band={gradeBand(item.creator?.skill_level)}
                time={formatSessionTime(item.starts_at)}
                // Nur der Hallenname: die Stadt steht bereits im Titel des Feeds.
                gym={item.gym?.name}
                note={item.note}
                onPress={() => router.push(`/sessions/${item.id}`)}
              />
            );
          }}
        />
      )}

      {/* FAB — der eine Brand-Glow pro View. */}
      <View className="absolute bottom-6 right-5">
        <IconButton
          variant="brand"
          size="lg"
          label="Create session"
          className="h-14 w-14 shadow-brand"
          onPress={() => router.push('/sessions/new')}>
          <Plus size={26} color={colors.rock[0]} strokeWidth={2.5} />
        </IconButton>
      </View>
    </SafeAreaView>
  );
}
