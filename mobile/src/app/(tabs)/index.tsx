import { router } from 'expo-router';
import { Calendar as CalendarIcon, Mountain, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/SessionCard';
import { Button, Chip, IconButton } from '@/components/ui';
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

// Der Datum-Filter: feste Chips für heute/morgen, plus ein Kalender für die restlichen
// Tage des 7-Tage-Fensters (weiter kann keine Session liegen — der Create-Flow lässt nur
// heute+6 zu). Wird ein ferner Tag gewählt, erscheint ein dynamischer dritter Chip.
function DateFilter({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = startOfDay(new Date());
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(today.getDate() + 1);
  const maxDate = startOfDay(new Date());
  maxDate.setDate(today.getDate() + 6);

  const isToday = selected.toDateString() === today.toDateString();
  const isTomorrow = selected.toDateString() === tomorrow.toDateString();
  const isFar = !isToday && !isTomorrow;

  function pickFromCalendar(dateString: string) {
    // dateString ist lokales "YYYY-MM-DD" — als lokale Mitternacht parsen (nicht new
    // Date(str), das UTC annähme und die Zeitzone verschieben könnte).
    const [y, m, d] = dateString.split('-').map(Number);
    onSelect(new Date(y, m - 1, d));
    setCalendarOpen(false);
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-4"
        className="mt-4">
        <Chip active={isToday} onPress={() => onSelect(today)}>
          Today
        </Chip>
        <Chip active={isTomorrow} onPress={() => onSelect(tomorrow)}>
          Tomorrow
        </Chip>
        {isFar ? (
          <Chip active onPress={() => setCalendarOpen(true)}>
            {formatDayChip(selected)}
          </Chip>
        ) : null}
        <Chip
          active={false}
          className="w-11 justify-center px-0"
          onPress={() => setCalendarOpen(true)}
          icon={
            <CalendarIcon
              size={17}
              color={isFar ? colors.brand[600] : colors.rock[700]}
              strokeWidth={2}
            />
          }
        />
      </ScrollView>

      <Modal
        visible={calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-rock-950/40 px-6"
          onPress={() => setCalendarOpen(false)}>
          {/* Inneres Pressable fängt Taps ab, damit ein Klick auf den Kalender selbst
              das Modal nicht schließt. */}
          <Pressable className="w-full max-w-sm overflow-hidden rounded-2xl bg-rock-0 p-2">
            <Calendar
              minDate={toDateKey(today)}
              maxDate={toDateKey(maxDate)}
              current={toDateKey(selected)}
              markedDates={{ [toDateKey(selected)]: { selected: true } }}
              onDayPress={(day) => pickFromCalendar(day.dateString)}
              disableAllTouchEventsForDisabledDays
              hideExtraDays
              firstDay={1}
              theme={{
                calendarBackground: colors.rock[0],
                textSectionTitleColor: colors.rock[500],
                monthTextColor: colors.rock[900],
                dayTextColor: colors.rock[900],
                textDisabledColor: colors.rock[300],
                todayTextColor: colors.brand[600],
                selectedDayBackgroundColor: colors.brand[500],
                selectedDayTextColor: colors.rock[0],
                arrowColor: colors.brand[600],
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Header({
  cityName,
  selectedDate,
  onSelectDate,
  gyms,
  gymId,
  onSelectGym,
}: {
  cityName: string | null;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  gyms: GymWithCity[] | undefined;
  gymId: string | null;
  onSelectGym: (id: string | null) => void;
}) {
  return (
    <View className="pb-3 pt-2">
      <View className="flex-row items-center justify-end">
        <Pressable onPress={() => router.push('/city')} hitSlop={8}>
          <Text className="font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-brand-600">
            Change city
          </Text>
        </Pressable>
      </View>
      <Text className="mt-1 font-display-bold text-[30px] leading-none text-rock-900">
        {cityName ? `Who's climbing in ${cityName}?` : "Who's climbing?"}
      </Text>

      {/* Tag-Filter — immer sichtbar. */}
      <DateFilter selected={selectedDate} onSelect={onSelectDate} />

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
  selectedDate,
  onClearGym,
}: {
  cityName: string | null;
  gymName: string | null;
  selectedDate: Date;
  onClearGym: () => void;
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
          : `No one's climbing ${phrase}${cityName ? ` in ${cityName}` : ''} yet`}
      </Text>
      <Text className="mb-4 mt-1 text-center font-sans text-sm text-rock-500">
        {gymName
          ? `Other gyms${cityName ? ` in ${cityName}` : ''} might be busier.`
          : 'Be the first to head to the wall.'}
      </Text>
      {gymName ? (
        <Button variant="primary" onPress={onClearGym}>
          Show all gyms
        </Button>
      ) : (
        <Button
          variant="primary"
          icon={<Plus size={16} color={colors.rock[0]} strokeWidth={2.5} />}
          onPress={() => router.push(`/sessions/new?date=${toDateKey(selectedDate)}`)}>
          Create the first session
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
              selectedDate={selectedDate}
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
