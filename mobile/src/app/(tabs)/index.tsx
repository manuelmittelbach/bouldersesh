import { router } from 'expo-router';
import { ChevronDown, Mountain, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CitySwitcherSheet } from '@/components/CitySwitcherSheet';
import { DateFilter } from '@/components/DateFilter';
import { SessionCard } from '@/components/SessionCard';
import { Button, Chip } from '@/components/ui';
import { useActiveCity } from '@/hooks/useActiveCity';
import { publicImageUrl } from '@/lib/images';
import {
  avatarTone,
  dayRange,
  formatDayChip,
  formatSessionTime,
  gradeBand,
  skillLabel,
  startOfDay,
  toDateKey,
} from '@/lib/utils';
import { useCities } from '@/queries/cities';
import { useGyms, type GymWithCity } from '@/queries/gyms';
import { useOpenSessions, type SessionWithMeta } from '@/queries/sessions';
import { colors } from '@/theme/colors';

// Der Feed zeigt offene Sessions der aktiven Stadt für GENAU EINEN Tag (Default: heute).
// Zwei Chip-Reihen filtern: der Tag ([Today] [Tomorrow] [📅]) und optional die Halle.
// Beide kombinieren (Tag UND Halle). Die Halle ist ein OPTIONALER Filter, keine zweite
// Pflichtstufe — Entdeckung über Hallengrenzen hinweg ist gewollt (CONTEXT.md).

function Header({
  cityName,
  onOpenCityMenu,
  selectedDate,
  onSelectDate,
  gyms,
  gymId,
  onSelectGym,
}: {
  cityName: string | null;
  onOpenCityMenu: () => void;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  gyms: GymWithCity[] | undefined;
  gymId: string | null;
  onSelectGym: (id: string | null) => void;
}) {
  return (
    <View className="pb-3 pt-2">
      {/* Titel „Who's climbing in [Munich]?" — FESTE Schriftgröße (auf „Munich" getrimmt,
          bewusst NICHT dynamisch skaliert), Stadt + „?" inline auf einer Zeile; der
          Dropdown-Caret sitzt zentriert UNTER der Stadt. Stadt + Caret bilden den tappbaren
          Bereich → Bottom-Sheet (CitySwitcherSheet) auf Dashboard-Ebene. */}
      <View className="flex-row items-start">
        <Text className="font-display-bold text-[24px] text-rock-900">
          {"Who's climbing in "}
        </Text>
        <Pressable
          onPress={onOpenCityMenu}
          hitSlop={8}
          className="items-center active:opacity-70">
          <Text className="font-display-bold text-[24px] text-brand-600">
            {cityName ?? 'your city'}
          </Text>
          <View className="-mt-1">
            <ChevronDown size={18} color={colors.brand[600]} strokeWidth={2.5} />
          </View>
        </Pressable>
        <Text className="font-display-bold text-[24px] text-rock-900">?</Text>
      </View>

      {/* Tag-Filter — immer sichtbar. */}
      <View className="mt-4">
        <DateFilter selected={selectedDate} onSelect={onSelectDate} />
      </View>

      {/* Hallen-Filter — nur zeigen, wenn es in der Stadt überhaupt etwas zu filtern gibt. */}
      {gyms && gyms.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pr-4"
          className="mt-2">
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

/** Tages-Phrase für den Leerzustand: "today" / "tomorrow" / "on Sat 25". */
function dayPhrase(selected: Date): string {
  const today = startOfDay(new Date());
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(today.getDate() + 1);
  if (selected.toDateString() === today.toDateString()) return 'today';
  if (selected.toDateString() === tomorrow.toDateString()) return 'tomorrow';
  return `on ${formatDayChip(selected)}`;
}

// Drei Leer-Zustände, weil sie Verschiedenes bedeuten: „nur dieser Hallen-Filter ist
// leer" (dann zurück auf alle Hallen, nicht Anlegen), sonst „an diesem Tag ist in der
// Stadt nichts los" — dann ist eine erste Session anlegen die richtige Einladung, mit
// dem gewählten Tag vorausgewählt.
function EmptyState({
  cityName,
  gymName,
  gymId,
  selectedDate,
}: {
  cityName: string | null;
  gymName: string | null;
  gymId: string | null;
  selectedDate: Date;
}) {
  const phrase = dayPhrase(selectedDate);
  return (
    <View className="items-center px-6 py-16">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <Mountain size={28} color={colors.brand[600]} strokeWidth={2} />
      </View>
      <Text className="text-center font-display text-base text-rock-900">
        {gymName
          ? `No sessions at ${gymName} ${phrase}`
          : `No sessions ${phrase}${cityName ? ` in ${cityName}` : ''} yet`}
      </Text>
      <View className="mt-4" />
      <Button
        variant="primary"
        icon={<Plus size={16} color={colors.rock[0]} strokeWidth={2.5} />}
        onPress={() =>
          router.push(
            `/sessions/new?date=${toDateKey(selectedDate)}${gymId ? `&gym=${gymId}` : ''}`,
          )
        }>
        Create the first session
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
  // neuen Stadt und würde den Feed sonst stumm leer machen. Der Tag-Filter bleibt
  // dagegen bewusst stehen: ein Tag ist stadt-unabhängig.
  useEffect(() => {
    setGymId(null);
  }, [cityId]);

  // Der gewählte Tag lebt nur als Component-State (Default: heute). App-Neustart → wieder
  // heute; „heute" ist zeitrelativ und darf nicht persistiert werden.
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  // dayRange fixiert bei „today" das `from` auf JETZT. Ohne Memo liefe das bei jedem
  // Render mit neuem Zeitstempel → neuer QueryKey → Refetch-Sturm. Dep = selectedDate
  // (stabile Referenz bis zur nächsten Auswahl), also einmal pro gewähltem Tag berechnet.
  // Trade-off: `from` ist auf den Auswahl-/Mount-Zeitpunkt eingefroren — sitzt der Feed
  // stundenlang offen auf „today", fällt eine erst danach vergangene Session auch bei
  // Pull-to-Refresh nicht raus, bis der Tag neu gewählt wird. Für die Beta vertretbar.
  const range = useMemo(() => dayRange(selectedDate), [selectedDate]);

  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useOpenSessions({
    city_id: cityId ?? undefined,
    gym_id: gymId ?? undefined,
    from: range.from,
    to: range.to,
  });

  // Eigener Pull-Zustand: der RefreshControl-Spinner soll NUR bei echtem Runterziehen
  // laufen, nicht bei jedem Hintergrund-Refetch (refetchOnMount).
  const [refreshing, setRefreshing] = useState(false);
  // Der Stadt-Wechsler ist jetzt ein Bottom-Sheet auf Screen-Ebene, kein Route-Push mehr.
  // State hier oben, damit ihn sowohl der Header-Dropdown als auch der Empty-State öffnen.
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
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
              onOpenCityMenu={() => setCityMenuOpen(true)}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              gyms={gyms}
              gymId={gymId}
              onSelectGym={setGymId}
            />
          }
          ListEmptyComponent={
            <EmptyState
              cityName={cityName}
              gymName={gymName}
              gymId={gymId}
              selectedDate={selectedDate}
            />
          }
          renderItem={({ item }) => {
            const name = item.creator?.display_name ?? 'Anonymous';
            return (
              <SessionCard
                name={name}
                avatarTone={avatarTone(item.creator?.id ?? name)}
                avatarSrc={publicImageUrl(item.creator?.avatar_path)}
                // Pill = Niveau der Ersteller:in (Merkmal der Person, nicht der Session).
                // Kein Niveau gesetzt → skillLabel ist null → SessionCard zeigt kein Pill.
                grade={skillLabel(item.creator?.skill_level)}
                band={gradeBand(item.creator?.skill_level)}
                // Kein Tages-Präfix: der Feed ist bereits auf einen Tag gefiltert, der
                // im Header steht — die Karte zeigt nur die Uhrzeit.
                time={formatSessionTime(item.starts_at, { withDay: false })}
                // Nur der Hallenname: die Stadt steht bereits im Titel des Feeds.
                gym={item.gym?.name}
                note={item.note}
                onPress={() => router.push(`/sessions/${item.id}`)}
              />
            );
          }}
        />
      )}

      {/* FAB — der eine Brand-Glow pro View. Erweitert: Plus-Icon + Label „Create session"
          als Pille (rounded-full). Der sichtbare Text ist zugleich der Accessibility-Name. */}
      <View className="absolute bottom-6 right-5">
        <Button
          variant="primary"
          size="lg"
          className="rounded-full shadow-brand"
          icon={<Plus size={22} color={colors.rock[0]} strokeWidth={2.5} />}
          onPress={() => router.push(`/sessions/new${gymId ? `?gym=${gymId}` : ''}`)}>
          Create session
        </Button>
      </View>

      <CitySwitcherSheet
        visible={cityMenuOpen}
        activeId={cityId}
        onSelect={setActiveCity}
        onClose={() => setCityMenuOpen(false)}
      />
    </SafeAreaView>
  );
}
