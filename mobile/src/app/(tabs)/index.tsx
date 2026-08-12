import { router, useFocusEffect } from 'expo-router';
import { ChevronDown, Mountain, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CitySwitcherSheet } from '@/components/CitySwitcherSheet';
import { DateFilter } from '@/components/DateFilter';
import { GymPickerSheet } from '@/components/GymPickerSheet';
import { SessionActionSheet, type SessionActionTarget } from '@/components/SessionActionSheet';
import { SessionCard, type SessionLabel } from '@/components/SessionCard';
import { Button, Chip } from '@/components/ui';
import { hasClimber, isFull, roleFor, spotsLeft } from '@/domain/session';
import { useActiveCity } from '@/hooks/useActiveCity';
import { useAuth } from '@/hooks/useAuth';
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
import {
  useMyDeclinedRequests,
  useMyPendingRequests,
} from '@/queries/matches';
import { useFeedSessions, type SessionWithMeta } from '@/queries/sessions';
import { colors } from '@/theme/colors';

// Der Feed zeigt die Sessions der aktiven Stadt für GENAU EINEN Tag (Default: heute):
// offene (joinbare) UND volle — letztere gedimmt als „Full"-Beleg, statt herauszufallen
// (ADR-0011). Zwei Chip-Reihen filtern: der Tag ([Today] [Tomorrow] [📅]) und optional
// die Halle. Beide kombinieren (Tag UND Halle). Die Halle ist ein OPTIONALER Filter,
// keine zweite Pflichtstufe — Entdeckung über Hallengrenzen hinweg ist gewollt (CONTEXT.md).

function Header({
  cityName,
  onOpenCityMenu,
  selectedDate,
  onSelectDate,
  gyms,
  gymId,
  gymName,
  onSelectGym,
  onOpenGymPicker,
}: {
  cityName: string | null;
  onOpenCityMenu: () => void;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  gyms: GymWithCity[] | undefined;
  gymId: string | null;
  gymName: string | null;
  onSelectGym: (id: string | null) => void;
  onOpenGymPicker: () => void;
}) {
  return (
    <View className="pb-3 pt-2">
      {/* Titel „Sessions in [Munich]" — FESTE Schriftgröße (auf „Munich" getrimmt,
          bewusst NICHT dynamisch skaliert), Stadt inline auf einer Zeile; der
          Dropdown-Caret sitzt zentriert UNTER der Stadt. Stadt + Caret bilden den tappbaren
          Bereich → Bottom-Sheet (CitySwitcherSheet) auf Dashboard-Ebene. */}
      <View className="flex-row items-start">
        <Text className="font-display-bold text-[30px] leading-none text-rock-900">
          {'Sessions in '}
        </Text>
        <Pressable
          onPress={onOpenCityMenu}
          hitSlop={8}
          className="items-center active:opacity-70">
          <Text className="font-display-bold text-[30px] leading-none text-brand-600">
            {cityName ?? 'your city'}
          </Text>
          <View className="mt-0.5">
            <ChevronDown size={20} color={colors.brand[600]} strokeWidth={2.5} />
          </View>
        </Pressable>
      </View>

      {/* Tag-Filter — immer sichtbar. */}
      <View className="mt-4">
        <DateFilter selected={selectedDate} onSelect={onSelectDate} />
      </View>

      {/* Hallen-Filter — nur zeigen, wenn es in der Stadt überhaupt etwas zu filtern gibt.
          Statt einer horizontal scrollenden Chip-Reihe (zu umständlich bei vielen Hallen)
          nur zwei Chips: „All gyms" und ein Picker, der das Bottom-Sheet (GymPickerSheet)
          öffnet und die gewählte Halle als Label trägt. */}
      {gyms && gyms.length > 1 ? (
        <View className="mt-2.5 flex-row gap-2">
          <Chip active={gymId === null} onPress={() => onSelectGym(null)}>
            All gyms
          </Chip>
          <Chip
            active={gymId !== null}
            onPress={onOpenGymPicker}
            trailingIcon={
              <ChevronDown
                size={16}
                color={gymId !== null ? colors.rock[0] : colors.rock[700]}
                strokeWidth={2.5}
              />
            }>
            {gymName ?? 'Pick a gym'}
          </Chip>
        </View>
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

// Leer-Zustand: „an diesem Tag ist in der Stadt (bzw. der gewählten Halle) nichts los".
// Nur eine Aussage, kein CTA — wenn keine Session läuft, laden wir nicht zum Anlegen ein.
function EmptyState({
  cityName,
  gymName,
  selectedDate,
}: {
  cityName: string | null;
  gymName: string | null;
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
    </View>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const userId = user?.id;
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
  } = useFeedSessions({
    city_id: cityId ?? undefined,
    gym_id: gymId ?? undefined,
    from: range.from,
    to: range.to,
  });

  // Session-IDs mit eigener offener Anfrage → „Requested"-Streifen an der Karte (ADR-0006).
  // Bewusst kein Realtime (ADR-0006), aber Fetch-on-Focus: kehrt man vom Detail-Screen
  // zum Feed zurück, wird neu geladen — so verschwindet der Streifen an einer Session,
  // von der man zurückgetreten oder abgelehnt wurde (der Tab bleibt sonst gemountet).
  const { data: requestedIds, refetch: refetchRequested } = useMyPendingRequests();
  // Kein eigenes „accepted"-Set mehr: der „Joined"-Streifen liest den eingebetteten
  // Kader der Zeile (hasClimber unten) — dieselbe Quelle wie die Avatare, kann also
  // nie hinter ihnen herhinken.
  // Sessions, aus denen mich die Ersteller:in abgelehnt hat — die blende ich unten aus,
  // damit eine Absage nicht als freier Platz zurück in den Feed rutscht. Gleicher
  // Focus-Refetch wie „requested": kehrt man vom Detail zurück (wo man die Absage sieht),
  // fällt die Session raus, ohne dass der noch gemountete Tab hängen bliebe.
  const { data: declinedIds, refetch: refetchDeclined } = useMyDeclinedRequests();
  // Auch den Feed selbst bei jeder Tab-Rückkehr neu laden — dasselbe „nur Fetch-on-Focus,
  // kein Realtime" wie bei den drei Streifen oben (ADR-0006). Der Tab bleibt gemountet,
  // also greift refetchOnMount nie — ohne diesen Focus-Refetch würden fremde neue
  // Sessions (oder gefüllte Plätze) erst per Pull-to-Refresh sichtbar. Da bereits
  // Daten im Cache liegen, bleibt `isLoading` false (kein Voll-Screen-Spinner) und der
  // eigene `refreshing`-State unberührt (kein Pull-Spinner) — es lädt still nach.
  // Caveat: der Refetch nutzt denselben QueryKey, `range.from` bleibt also eingefroren
  // (siehe oben) — eine erst nach Mount vergangene Session fällt hier NICHT raus.
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchRequested();
      refetchDeclined();
    }, [refetch, refetchRequested, refetchDeclined]),
  );

  // Abgelehnte Sessions raus, bevor die Liste sie rendert (ADR-0006).
  const visibleSessions = useMemo(
    () => (sessions ?? []).filter((s) => !declinedIds?.has(s.id)),
    [sessions, declinedIds],
  );

  // Eigener Pull-Zustand: der RefreshControl-Spinner soll NUR bei echtem Runterziehen
  // laufen, nicht bei jedem Hintergrund-Refetch (refetchOnMount).
  const [refreshing, setRefreshing] = useState(false);
  // Der Stadt-Wechsler ist jetzt ein Bottom-Sheet auf Screen-Ebene, kein Route-Push mehr.
  // State hier oben, damit ihn sowohl der Header-Dropdown als auch der Empty-State öffnen.
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  // Der Hallen-Filter öffnet — wie der Stadt-Wechsler — ein Bottom-Sheet auf Screen-Ebene,
  // statt die Hallen als lange horizontal scrollende Chip-Reihe auszubreiten.
  const [gymPickerOpen, setGymPickerOpen] = useState(false);
  // Ein Tap auf eine Feed-Karte springt nicht mehr in den Detail-Screen (der lebt nur
  // noch hinter dem „i" im Chat), sondern öffnet dieses Aktions-Sheet mit der einen
  // Handlung, die zu meiner Rolle passt (Join/Leave/Withdraw/Delete).
  const [actionTarget, setActionTarget] = useState<SessionActionTarget | null>(null);
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
      {/* Kopf klebt fest: Titel „Sessions in [Stadt]", Tag-Filter und Hallen-Leiste
          bleiben oben stehen, während der Feed darunter scrollt (kein ListHeaderComponent
          mehr). Als eigener View über der Liste behält die horizontale Hallen-Leiste
          zudem immer ihre Scrollposition — sie hängt nie mit der Liste aus. */}
      <View className="px-5">
        <Header
          cityName={cityName}
          onOpenCityMenu={() => setCityMenuOpen(true)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          gyms={gyms}
          gymId={gymId}
          gymName={gymName}
          onSelectGym={setGymId}
          onOpenGymPicker={() => setGymPickerOpen(true)}
        />
      </View>

      {/* Die Liste bleibt IMMER gemountet — auch beim Laden/Fehler. Lade- und
          Fehlerzustand leben deshalb im Listen-Body (ListEmptyComponent), nicht als
          Voll-Screen-Ersatz. */}
      <FlatList<SessionWithMeta>
        data={visibleSessions}
        keyExtractor={(s) => s.id}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerClassName="px-5 pb-8 gap-3 pt-1"
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center justify-center py-24">
              <ActivityIndicator color={colors.brand[500]} />
            </View>
          ) : error ? (
            <View className="items-center justify-center px-6 py-24">
              <Text className="text-center font-sans text-sm text-danger">
                Couldn’t load: {(error as Error).message}
              </Text>
            </View>
          ) : (
            <EmptyState
              cityName={cityName}
              gymName={gymName}
              selectedDate={selectedDate}
            />
          )
        }
        renderItem={({ item }) => {
          const name = item.creator?.display_name ?? 'Anonymous';
          // Voll-Signal, Plätze und Rolle fragt jetzt das Session-Modul (domain/session)
          // — die Kapazitäts-Mathematik (ADR-0007) und die EINE „Full"-Regel (ADR-0011)
          // leben dort, statt in jedem Screen neu (und früher uneinig) gerechnet zu werden.
          const full = isFull(item);
          // Meine Rolle an dieser Session → höchstens ein Streifen (ADR-0010). Die
          // Ausschlussleiter (hosting > joined > requested) steckt in roleFor;
          // „accepted" liest den Kader der Zeile selbst (hasClimber), nur „pending"
          // liegt nicht auf ihr und kommt als eigenes Set rein.
          const role = roleFor(item, userId, {
            accepted: hasClimber(item, userId),
            requested: requestedIds?.has(item.id) ?? false,
          });
          const label: SessionLabel | null = role === 'none' ? null : role;
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
              // Freie Platzzahl → je ein „+ Available"-Slot in der Kader-Zeile (CTA).
              spotsLeft={spotsLeft(item)}
              // Kader-Stack: die schon Beigetretenen (ohne Host, der links groß steht) als
              // namenlose, zum Profil tippbare Avatare. Bild-URL + Ton hier fertig gerechnet,
              // die Karte bleibt dumm.
              climbers={item.climbers.map((c) => ({
                id: c.id,
                name: c.display_name,
                tone: avatarTone(c.id),
                src: publicImageUrl(c.avatar_path),
              }))}
              onPressClimber={(id) => router.push(`/profile/${id}`)}
              full={full}
              note={item.note}
              label={label}
              // Tap → Aktions-Sheet (nicht mehr Detail-Screen). Die Rolle bildet die eine
              // passende Handlung ab (availableAction im Sheet). AUSNAHME: eine volle
              // Fremd-Session (Rolle „none" + full) hat keine Handlung — sie bleibt gedimmt
              // und schlicht nicht tippbar (kein onPress = kein Sheet, kein Ripple), statt
              // ein Sheet nur für „No spots left" aufzuziehen (ADR-0013).
              onPress={
                role === 'none' && full
                  ? undefined
                  : () => setActionTarget({ id: item.id, role })
              }
              onPressAuthor={
                item.creator?.id
                  ? () => router.push(`/profile/${item.creator!.id}`)
                  : undefined
              }
            />
          );
        }}
      />

      {/* FAB — der eine Brand-Glow pro View. Erweitert: Plus-Icon + Label „Create session"
          als Pille (rounded-full). Der sichtbare Text ist zugleich der Accessibility-Name. */}
      <View className="absolute bottom-6 right-5">
        <Button
          variant="primary"
          size="lg"
          className="rounded-full shadow-brand"
          icon={<Plus size={22} color={colors.rock[0]} strokeWidth={2.5} />}
          // Der im Feed gewählte Tag (und ggf. der Hallen-Filter) reist als Vorauswahl
          // mit — die Create-Seite belegt „When" damit vor, sofern der Tag noch ins
          // Tagfenster fällt (sonst Today). So bleibt „Tag im Feed wählen → gleicher Tag
          // in der neuen Session" durchgängig.
          onPress={() =>
            router.push(
              `/sessions/new?date=${toDateKey(selectedDate)}${gymId ? `&gym=${gymId}` : ''}`,
            )
          }>
          Create session
        </Button>
      </View>

      <CitySwitcherSheet
        visible={cityMenuOpen}
        activeId={cityId}
        onSelect={setActiveCity}
        onClose={() => setCityMenuOpen(false)}
      />

      <GymPickerSheet
        visible={gymPickerOpen}
        gyms={gyms ?? []}
        activeId={gymId}
        onSelect={setGymId}
        onClose={() => setGymPickerOpen(false)}
      />

      <SessionActionSheet target={actionTarget} onClose={() => setActionTarget(null)} />
    </SafeAreaView>
  );
}
