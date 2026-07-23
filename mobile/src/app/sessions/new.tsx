import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, Clock, Send, X } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
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
import { Button, Chip, IconButton, Input } from "@/components/ui";
import { useActiveCity } from "@/hooks/useActiveCity";
import { startOfDay, toDateKey } from "@/lib/utils";
import { useCities } from "@/queries/cities";
import { useCreateSession } from "@/queries/sessions";
import { GYM_ACCESS_LABEL, useGyms } from "@/queries/gyms";
import { colors } from "@/theme/colors";

// Uhrzeit über den nativen Time-Picker (@react-native-community/datetimepicker): iOS zeigt
// das native Spinner-Rad inline, Android den nativen Uhr-Dialog. 15-Minuten-Raster deckt
// Hallen-Startzeiten ab, ohne minutengenaue Übergenauigkeit.
const TIME_MINUTE_INTERVAL = 15;

function Eyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

export default function SessionCreate() {
  const insets = useSafeAreaInsets();
  // Optionale Vorauswahl-Params aus dem Feed:
  //  - `date` ("YYYY-MM-DD", passend zum Chip-Fenster unten). Fehlt/passt er nicht ins
  //    7-Tage-Fenster, bleibt es bei Today.
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
  // er ins 7-Tage-Fenster (heute..heute+6) fällt — sonst Today. Auswahl-UI ist dieselbe
  // geteilte DateFilter wie im Home-Feed.
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const raw = typeof params.date === "string" ? params.date : null;
    const base = startOfDay(new Date());
    if (raw) {
      for (let i = 0; i < 7; i++) {
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
  // Auf iOS ist der Spinner ein Inline-Element, das wir per Tap ein-/ausklappen; auf Android
  // ist es ein Dialog, der nur bei true kurz erscheint und sich selbst wieder schließt.
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onChangeTime(event: DateTimePickerEvent, picked?: Date) {
    // Android-Dialog schließt sich nach der Wahl selbst; iOS-Spinner bleibt offen.
    if (Platform.OS !== "ios") setShowTimePicker(false);
    if (event.type === "dismissed") return;
    if (picked) setTime(picked);
  }

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
        // Notizfeld ist das letzte Feld und hätte sonst die Submit-Leiste (~76 px)
        // plus einen Rand vor sich — genug Abstand, damit es voll über beidem steht.
        bottomOffset={90}
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

        {/* Wann — Uhrzeit (nativer Time-Picker). Zeile zeigt die gewählte Zeit und klappt
              den nativen Picker auf: iOS-Spinner inline, Android-Uhr-Dialog. */}
        <View className="mb-6">
          <Eyebrow>Time</Eyebrow>
          <Pressable
            onPress={() => setShowTimePicker((v) => !v)}
            className={
              "h-12 flex-row items-center justify-between rounded-md border px-4 active:scale-[0.99] " +
              (showTimePicker
                ? "border-brand-500 bg-brand-50"
                : "border-rock-200 bg-rock-0")
            }
          >
            <Text
              className={
                "font-sans-medium text-[15px] " +
                (showTimePicker ? "text-brand-700" : "text-rock-900")
              }
            >
              {clockLabel}
            </Text>
            <Clock
              size={18}
              color={showTimePicker ? colors.brand[600] : colors.rock[400]}
              strokeWidth={2}
            />
          </Pressable>
          {showTimePicker ? (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minuteInterval={TIME_MINUTE_INTERVAL}
              onChange={onChangeTime}
            />
          ) : null}
        </View>

        {/* Notiz — trägt jetzt „was ich klettern will" und ist Pflicht: hallen-relativ
              formuliert (die Session hat eine Halle), statt eines strukturierten Grades.
              Siehe ADR-0005. */}
        <Input
          label="What are you climbing?"
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={280}
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
        </View>
      </KeyboardStickyView>

      <GymPickerSheet
        visible={gymSheetOpen}
        gyms={gyms ?? []}
        activeId={gymId}
        onSelect={setGymId}
        onClose={() => setGymSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
