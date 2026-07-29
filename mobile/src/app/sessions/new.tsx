import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, Clock, Send, X } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
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
import { Button, Chip, IconButton, Input } from "@/components/ui";
import { useActiveCity } from "@/hooks/useActiveCity";
import { useKeyboardAwareField } from "@/hooks/useKeyboardAwareField";
import { SESSION_DAY_WINDOW, startOfDay, toDateKey } from "@/lib/utils";
import { useCities } from "@/queries/cities";
import { useCreateSession } from "@/queries/sessions";
import { GYM_ACCESS_LABEL, useGyms } from "@/queries/gyms";
import { colors } from "@/theme/colors";

// Uhrzeit über den nativen Time-Picker (@react-native-community/datetimepicker): iOS zeigt
// das native Spinner-Rad inline, Android den nativen Uhr-Dialog. 15-Minuten-Raster deckt
// Hallen-Startzeiten ab, ohne minutengenaue Übergenauigkeit.
const TIME_MINUTE_INTERVAL = 15;

// Plätze für Mitkletternde (ADR-0007) — die Ersteller:in ist Gastgeber:in, kein Platz.
// 1–3 Plätze (Party 2–4 inkl. Gastgeber:in). Reihenfolge hoch→runter (3 links, vorgewählt).
const SPOT_OPTIONS = [3, 2, 1] as const;

function Eyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

export default function SessionCreate() {
  const insets = useSafeAreaInsets();
  // Das Notizfeld ist mehrzeilig UND darunter reitet die Submit-Leiste über der
  // Tastatur. Beide Höhen werden gemessen (barHeight per onLayout an der Leiste), damit
  // der Scroll-Offset das ganze Feld über Leiste + Tastatur hebt — ohne feste Zahl.
  const [barHeight, setBarHeight] = useState(0);
  const { bottomOffset, onFieldLayout } = useKeyboardAwareField({
    clearance: barHeight,
  });
  // Optionale Vorauswahl-Params aus dem Feed:
  //  - `date` ("YYYY-MM-DD", passend zum Chip-Fenster unten). Fehlt/passt er nicht ins
  //    Tagfenster (heute..heute+(SESSION_DAY_WINDOW-1)), bleibt es bei Today.
  //  - `gym` (Hallen-ID). Kommt aus dem aktiven Hallen-Filter des Feeds — die Halle liegt
  //    darum in der aktiven Stadt, die hier auch als cityId vorbelegt ist, also stimmig.
  //    Wird die Stadt im Formular gewechselt, setzt selectCity die Halle zurück.
  const params = useLocalSearchParams<{ date?: string; gym?: string }>();
  const { cityId: activeCityId, setActiveCity } = useActiveCity();
  const { data: cities } = useCities();
  const createSession = useCreateSession();

  // Stadt und Halle stehen im SELBEN Formular, kein Wizard: Stadt oben, vorausgefüllt mit
  // der aktiven Stadt und änderbar, Hallenliste darunter auf die Stadt gefiltert.
  // Der Screen ist nur erreichbar, wenn eine aktive Stadt steht (Gate im RootNavigator) —
  // der Initialwert ist also nie null.
  const [cityId, setCityId] = useState<string | null>(activeCityId);
  const [gymId, setGymId] = useState<string | null>(
    typeof params.gym === "string" ? params.gym : null,
  );

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
  // Gewählter Tag als Date (Mitternacht-Anker). Optional aus params.date vorbelegt, sofern
  // er ins Tagfenster (heute..heute+(SESSION_DAY_WINDOW-1)) fällt — sonst Today. Auswahl-UI
  // ist dieselbe geteilte DateFilter wie im Home-Feed.
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const raw = typeof params.date === "string" ? params.date : null;
    const base = startOfDay(new Date());
    if (raw) {
      for (let i = 0; i < SESSION_DAY_WINDOW; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        if (toDateKey(d) === raw) return d;
      }
    }
    return base;
  });
  // Uhrzeit als Date (nur H/M relevant), Default 18:00. Wird beim Submit mit selectedDate
  // (Tag) zu einem vollen Zeitstempel zusammengesetzt.
  const [time, setTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  });
  // Die Uhrzeit wählt jetzt ein Bottom-Sheet mit Scroll-Rad (TimePickerSheet) — wie bei
  // Meetup/Google Calendar. Hier steht nur, ob es offen ist; die Bestätigung setzt `time`.
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [note, setNote] = useState("");
  // Gewählt werden Plätze für andere; die DB speichert die Party-Größe (Plätze + Gastgeber:in).
  const [spots, setSpots] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  const clockLabel = `${time.getHours().toString().padStart(2, "0")}:${time
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  /**
   * Eine Session in einer anderen als der aktiven Stadt wechselt den Kontext NICHT
   * automatisch — sie weist nur darauf hin und bietet den Wechsel an. Sonst würde das
   * einmalige Anlegen einer Auswärts-Session stillschweigend den ganzen Feed umstellen.
   */
  function leaveAfterCreate() {
    const target = cities?.find((c) => c.id === cityId);
    const active = cities?.find((c) => c.id === activeCityId);
    if (!cityId || cityId === activeCityId || !target) {
      router.replace("/");
      return;
    }
    Alert.alert(
      "Session created",
      `Your session in ${target.name} is live. Your feed still shows ${active?.name ?? "your current city"}.`,
      [
        {
          text: active ? `Stay in ${active.name}` : "Stay here",
          style: "cancel",
          onPress: () => router.replace("/"),
        },
        {
          text: `Switch to ${target.name}`,
          onPress: async () => {
            await setActiveCity(cityId);
            router.replace("/");
          },
        },
      ],
    );
  }

  async function submit() {
    if (createSession.isPending) return;
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
    if (dt.getTime() < Date.now()) {
      setError("That time is in the past — pick a later one.");
      return;
    }
    if (!note.trim()) {
      setError("Say what you’re climbing.");
      return;
    }
    setError(null);
    try {
      await createSession.mutateAsync({
        gym_id: gymId,
        starts_at: dt.toISOString(),
        note: note.trim(),
        // DB-Kapazität = Plätze für andere + Gastgeber:in (ADR-0007).
        capacity: spots + 1,
      });
      leaveAfterCreate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2">
        <IconButton variant="ghost" label="Close" onPress={() => router.back()}>
          <X size={24} color={colors.rock[700]} strokeWidth={2} />
        </IconButton>
        <Text className="font-display text-base text-rock-900">
          New session
        </Text>
        <View className="w-10" />
      </View>

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
              wie bei der Stadt; 3/2/1, Default 3. Der Zusatz stellt klar: du bist nicht dabei
              mitgezählt. */}
        <View className="mb-6">
          <Eyebrow>Spots</Eyebrow>
          <View className="flex-row gap-2">
            {SPOT_OPTIONS.map((count) => (
              <Chip
                key={count}
                active={spots === count}
                onPress={() => setSpots(count)}
              >
                {String(count)}
              </Chip>
            ))}
          </View>
          <Text className="mt-2 font-sans text-xs text-rock-400">
            Open spots for others to join.
          </Text>
        </View>

        {/* Notiz — trägt jetzt „was ich klettern will" und ist Pflicht: hallen-relativ
              formuliert (die Session hat eine Halle), statt eines strukturierten Grades.
              Siehe ADR-0005. */}
        <Input
          label="What are you climbing?"
          value={note}
          onChangeText={setNote}
          onFieldLayout={onFieldLayout}
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
            disabled={!note.trim()}
            loading={createSession.isPending}
            icon={<Send size={18} color={colors.rock[0]} strokeWidth={2} />}
            onPress={submit}
          >
            Publish session
          </Button>
          {/* Kurzer Hinweis unter dem Publish-Button: erklärt vorab, was Veröffentlichen
              auslöst — es entsteht ein Gruppenchat, und Beitritts-Anfragen (0017) landen
              dort, nicht hier. Bewusst knapp und dezent (rock-400). */}
          <Text className="mt-2.5 text-center font-sans text-xs leading-5 text-rock-400">
            Publishing creates a group chat where requests reach you.
          </Text>
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
