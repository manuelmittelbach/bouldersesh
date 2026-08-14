import { ChevronDown, Clock } from "lucide-react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { DateFilter } from "@/components/DateFilter";
import { GymPickerSheet } from "@/components/GymPickerSheet";
import { TimePickerSheet } from "@/components/TimePickerSheet";
import { Button, Chip, Input, ScreenHeader } from "@/components/ui";
import { useKeyboardAwareField } from "@/hooks/useKeyboardAwareField";
import { useCities } from "@/queries/cities";
import { GYM_ACCESS_LABEL, useGyms } from "@/queries/gyms";
import { colors } from "@/theme/colors";

// Uhrzeit über den nativen Time-Picker (@react-native-community/datetimepicker): iOS zeigt
// das native Spinner-Rad inline, Android den nativen Uhr-Dialog. 15-Minuten-Raster deckt
// Hallen-Startzeiten ab, ohne minutengenaue Übergenauigkeit.
const TIME_MINUTE_INTERVAL = 15;

// Plätze für Mitkletternde (ADR-0007) — die Ersteller:in ist Gastgeber:in, kein Platz.
// 1–3 Plätze (Party 2–4 inkl. Gastgeber:in). Reihenfolge hoch→runter (3 links).
const SPOT_OPTIONS = [3, 2, 1] as const;

function Eyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

/** Was das Formular beim Submit liefert — validiert (Stadt/Halle gesetzt, Zeit ok). */
export type SessionFormValues = {
  cityId: string;
  gymId: string;
  /** Tag + Uhrzeit zu EINEM Zeitstempel zusammengesetzt. */
  startsAt: Date;
  /** Plätze für andere (1–3); DB-Kapazität = spots + 1 (ADR-0007). */
  spots: number;
  /** Getrimmt; leer = "" (der Aufrufer mappt auf null, Spalte ist seit 0026 nullable). */
  note: string;
};

/** Startwerte — beide Screens (Create/Edit) füllen alle Felder explizit. */
export type SessionFormInitial = {
  cityId: string | null;
  gymId: string | null;
  /** Mitternacht-Anker des gewählten Tags. */
  date: Date;
  /** Nur H/M relevant. */
  time: Date;
  spots: number;
  note: string;
};

// Das EINE Session-Formular für Create (sessions/new) und Edit (sessions/edit/[id],
// ADR-0017) — vorher lag es inline im Create-Screen. Stadt und Halle stehen im SELBEN
// Formular, kein Wizard: Stadt oben (Chips), Hallenliste darunter auf die Stadt
// gefiltert. Screen-Spezifisches (Params-Prefill, Stadt-Wechsel-Dialog nach dem
// Anlegen, Push-Permission) bleibt in den Screens.
export function SessionForm({
  title,
  initial,
  minSpots = 1,
  allowPastStartsAtMs,
  submitLabel,
  submitIcon,
  submitHint,
  pending,
  onSubmit,
}: {
  title: string;
  initial: SessionFormInitial;
  /** Untergrenze der Spots-Chips (Edit: besetzte Plätze, minSpotsForOthers). */
  minSpots?: number;
  /**
   * Genau DIESER Zeitstempel (ms) darf in der Vergangenheit liegen: beim Edit einer
   * schon gestarteten (aber noch nicht off-feed) Session soll eine unveränderte Zeit
   * nicht am Vergangenheits-Check scheitern — nur ein NEUER Zeitpunkt muss vorn liegen.
   */
  allowPastStartsAtMs?: number;
  submitLabel: string;
  submitIcon?: ReactNode;
  /** Dezente Zeile unter dem Submit-Button (Create: Gruppenchat-Hinweis). */
  submitHint?: string;
  pending: boolean;
  onSubmit: (values: SessionFormValues) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  // Unter dem mehrzeiligen Notizfeld reitet die Submit-Leiste über der Tastatur. Ihre
  // Höhe wird gemessen (onLayout) und als clearance in den Scroll-Offset gereicht, damit
  // das Feld über Leiste + Tastatur steht — ohne feste Zahl.
  const [barHeight, setBarHeight] = useState(0);
  const { bottomOffset } = useKeyboardAwareField({
    clearance: barHeight,
  });

  const { data: cities } = useCities();
  const [cityId, setCityId] = useState<string | null>(initial.cityId);
  const [gymId, setGymId] = useState<string | null>(initial.gymId);

  const {
    data: gyms,
    isLoading: gymsLoading,
    error: gymsError,
  } = useGyms(cityId);
  const selectedGym = gyms?.find((g) => g.id === gymId) ?? null;
  const [gymSheetOpen, setGymSheetOpen] = useState(false);

  function selectCity(id: string) {
    if (id === cityId) return;
    setCityId(id);
    // Die bisherige Halle liegt in der alten Stadt — Auswahl zurücksetzen.
    setGymId(null);
  }

  const [selectedDate, setSelectedDate] = useState<Date>(initial.date);
  const [time, setTime] = useState<Date>(initial.time);
  // Die Uhrzeit wählt ein Bottom-Sheet mit Scroll-Rad (TimePickerSheet) — wie bei
  // Meetup/Google Calendar. Hier steht nur, ob es offen ist; die Bestätigung setzt `time`.
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [note, setNote] = useState(initial.note);
  const [spots, setSpots] = useState<number>(initial.spots);
  const [error, setError] = useState<string | null>(null);

  const clockLabel = `${time.getHours().toString().padStart(2, "0")}:${time
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  async function submit() {
    if (pending) return;
    if (!cityId) {
      setError("Please pick a city.");
      return;
    }
    if (!gymId) {
      setError("Please pick a gym.");
      return;
    }
    const dt = new Date(selectedDate);
    dt.setHours(time.getHours(), time.getMinutes(), 0, 0);
    if (dt.getTime() < Date.now() && dt.getTime() !== allowPastStartsAtMs) {
      setError("That time is in the past — pick a later one.");
      return;
    }
    setError(null);
    try {
      await onSubmit({
        cityId,
        gymId,
        startsAt: dt,
        spots,
        note: note.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
      {/* Header */}
      <ScreenHeader icon="close" title={title} titleAlign="center" />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-2"
        contentContainerStyle={{ paddingBottom: 32 }}
        // Nur so viel Puffer wie die sticky Submit-Leiste hoch ist — genug, damit die
        // Notiz über die Leiste scrollen kann, ohne unnötigen Leerraum darunter.
        bottomOffset={bottomOffset}
        extraKeyboardSpace={barHeight}
        keyboardShouldPersistTaps="handled"
      >
        {/* Stadt — erstes Feld, filtert die Hallenliste darunter */}
        <View className="mb-6">
          <Eyebrow>City</Eyebrow>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pr-4"
          >
            {cities?.map((city) => (
              <Chip
                key={city.id}
                active={cityId === city.id}
                onPress={() => selectCity(city.id)}
              >
                {city.name}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Halle — Dropdown statt Liste: eine Trigger-Zeile zeigt die gewählte Halle
              (oder einen Platzhalter) und öffnet das Bottom-Sheet mit der Auswahl. So
              steht im Formular nicht die ganze Hallenliste auf einmal. */}
        <View className="mb-6">
          <Eyebrow>Gym</Eyebrow>
          {gymsError ? (
            <Text className="py-2 font-sans text-sm text-danger">
              Couldn’t load gyms.
            </Text>
          ) : !gymsLoading && (!gyms || gyms.length === 0) ? (
            <Text className="py-2 font-sans text-sm text-rock-500">
              No gyms in this city yet.
            </Text>
          ) : (
            <Pressable
              disabled={gymsLoading || !gyms || gyms.length === 0}
              onPress={() => setGymSheetOpen(true)}
              className={
                "h-12 flex-row items-center justify-between rounded-md border px-4 active:scale-[0.99] " +
                (gymSheetOpen
                  ? "border-brand-500 bg-brand-50"
                  : "border-rock-200 bg-rock-0")
              }
            >
              <Text
                numberOfLines={1}
                className={
                  "flex-1 font-sans-medium text-[15px] " +
                  (selectedGym ? "text-rock-900" : "text-rock-400")
                }
              >
                {gymsLoading
                  ? "Loading…"
                  : selectedGym
                    ? selectedGym.name
                    : "Choose a gym"}
                {selectedGym?.access ? (
                  <Text className="text-rock-400">{`  ·  ${GYM_ACCESS_LABEL[selectedGym.access]}`}</Text>
                ) : null}
              </Text>
              <ChevronDown
                size={18}
                color={gymSheetOpen ? colors.brand[600] : colors.rock[400]}
                strokeWidth={2}
              />
            </Pressable>
          )}
        </View>

        {/* Wann — Tag. Gleiche DateFilter wie im Home-Feed (Today/Tomorrow + Kalender). */}
        <View className="mb-5">
          <Eyebrow>When</Eyebrow>
          <DateFilter selected={selectedDate} onSelect={setSelectedDate} />
        </View>

        {/* Wann — Uhrzeit. Eine Trigger-Zeile (wie das Hallen-Dropdown) zeigt die gewählte
              Zeit; Tap öffnet das TimePickerSheet mit dem Scroll-Rad. Gleicher Look auf iOS
              und Android. */}
        <View className="mb-6">
          <Eyebrow>Time</Eyebrow>
          <Pressable
            onPress={() => setTimeSheetOpen(true)}
            className={
              "h-12 flex-row items-center justify-between rounded-md border px-4 active:scale-[0.99] " +
              (timeSheetOpen
                ? "border-brand-500 bg-brand-50"
                : "border-rock-200 bg-rock-0")
            }
          >
            <Text
              className={
                "font-sans-medium text-[15px] " +
                (timeSheetOpen ? "text-brand-700" : "text-rock-900")
              }
            >
              {clockLabel}
            </Text>
            <Clock
              size={18}
              color={timeSheetOpen ? colors.brand[600] : colors.rock[400]}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {/* Plätze — Sitze für Mitkletternde, ohne die Ersteller:in (ADR-0007). Chip-Reihe
              wie bei der Stadt; 3/2/1. Beim Edit sind Chips unter den schon besetzten
              Plätzen gesperrt (ADR-0017): angenommene Anfragen sind verbindlich. */}
        <View className="mb-6">
          <Eyebrow>Spots for others</Eyebrow>
          <View className="flex-row gap-2">
            {SPOT_OPTIONS.map((count) => (
              <Chip
                key={count}
                active={spots === count}
                disabled={count < minSpots}
                className={count < minSpots ? "opacity-40" : undefined}
                onPress={() => setSpots(count)}
              >
                {String(count)}
              </Chip>
            ))}
          </View>
        </View>

        {/* Notiz — trägt „was ich klettern will", hallen-relativ formuliert (die Session
              hat eine Halle) statt eines strukturierten Grades (ADR-0005). Optional steht
              direkt im Label; kein separater Hint. */}
        <Input
          label="What are you climbing? (optional)"
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={80}
          showCount
          placeholder="e.g. “trying to crack some reds”"
        />

        {error ? (
          <Text className="mt-3 font-sans text-sm text-danger">{error}</Text>
        ) : null}
      </KeyboardAwareScrollView>

      {/* Submit-Leiste — reitet per KeyboardStickyView über der Tastatur, damit sie
          beim Tippen im Notizfeld sichtbar bleibt und nicht verdeckt wird. */}
      <KeyboardStickyView>
        <View
          onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
          className="border-t border-rock-100 bg-rock-0 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={pending}
            icon={submitIcon}
            onPress={submit}
          >
            {submitLabel}
          </Button>
          {submitHint ? (
            <Text className="mt-2.5 text-center font-sans text-xs leading-5 text-rock-400">
              {submitHint}
            </Text>
          ) : null}
        </View>
      </KeyboardStickyView>

      <GymPickerSheet
        visible={gymSheetOpen}
        gyms={gyms ?? []}
        activeId={gymId}
        onSelect={setGymId}
        onClose={() => setGymSheetOpen(false)}
      />

      <TimePickerSheet
        visible={timeSheetOpen}
        value={time}
        minuteInterval={TIME_MINUTE_INTERVAL}
        onConfirm={setTime}
        onClose={() => setTimeSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
