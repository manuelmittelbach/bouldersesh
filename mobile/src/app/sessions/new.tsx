import { router, useLocalSearchParams } from 'expo-router';
import { Check, Send, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, IconButton, Input } from '@/components/ui';
import { useActiveCity } from '@/hooks/useActiveCity';
import { formatDateShort, startOfDay, toDateKey } from '@/lib/utils';
import { useCities } from '@/queries/cities';
import { useCreateSession } from '@/queries/sessions';
import { GYM_ACCESS_LABEL, useGyms } from '@/queries/gyms';
import { colors } from '@/theme/colors';

// Zeitfenster als Chips statt nativem Date/Time-Picker (kein community/datetimepicker →
// kein native Rebuild, siehe Handoff §6). Halbe-Stunden-Auflösung wäre zu viel; volle
// Stunden von 7–22 decken Hallenöffnungszeiten ab.
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 … 22

function Eyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

export default function SessionCreate() {
  const insets = useSafeAreaInsets();
  // Optionaler Tag-Vorauswahl-Param (z. B. aus dem „Erste Session anlegen"-CTA eines
  // leeren Feed-Tags). "YYYY-MM-DD", passend zum Chip-Fenster unten. Fehlt/passt er
  // nicht ins 7-Tage-Fenster, bleibt es bei Today.
  const params = useLocalSearchParams<{ date?: string }>();
  const { cityId: activeCityId, setActiveCity } = useActiveCity();
  const { data: cities } = useCities();
  const createSession = useCreateSession();

  // Stadt und Halle stehen im SELBEN Formular, kein Wizard: Stadt oben, vorausgefüllt mit
  // der aktiven Stadt und änderbar, Hallenliste darunter auf die Stadt gefiltert.
  // Der Screen ist nur erreichbar, wenn eine aktive Stadt steht (Gate im RootNavigator) —
  // der Initialwert ist also nie null.
  const [cityId, setCityId] = useState<string | null>(activeCityId);
  const [gymId, setGymId] = useState<string | null>(null);

  const { data: gyms, isLoading: gymsLoading, error: gymsError } = useGyms(cityId);

  function selectCity(id: string) {
    if (id === cityId) return;
    setCityId(id);
    // Die bisherige Halle liegt in der alten Stadt — Auswahl zurücksetzen.
    setGymId(null);
  }
  const [dayIdx, setDayIdx] = useState(() => {
    const raw = typeof params.date === 'string' ? params.date : null;
    if (!raw) return 0;
    const base = startOfDay(new Date());
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      if (toDateKey(d) === raw) return i;
    }
    return 0;
  });
  const [hour, setHour] = useState(18);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Die nächsten 7 Tage als Chip-Auswahl (Mitternacht-Anker, Uhrzeit kommt aus HOURS).
  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, []);

  function dayLabel(i: number): string {
    if (i === 0) return 'Today';
    if (i === 1) return 'Tomorrow';
    return formatDateShort(days[i]);
  }

  /**
   * Eine Session in einer anderen als der aktiven Stadt wechselt den Kontext NICHT
   * automatisch — sie weist nur darauf hin und bietet den Wechsel an. Sonst würde das
   * einmalige Anlegen einer Auswärts-Session stillschweigend den ganzen Feed umstellen.
   */
  function leaveAfterCreate() {
    const target = cities?.find((c) => c.id === cityId);
    const active = cities?.find((c) => c.id === activeCityId);
    if (!cityId || cityId === activeCityId || !target) {
      router.replace('/');
      return;
    }
    Alert.alert(
      'Session created',
      `Your session in ${target.name} is live. Your feed still shows ${active?.name ?? 'your current city'}.`,
      [
        {
          text: active ? `Stay in ${active.name}` : 'Stay here',
          style: 'cancel',
          onPress: () => router.replace('/'),
        },
        {
          text: `Switch to ${target.name}`,
          onPress: async () => {
            await setActiveCity(cityId);
            router.replace('/');
          },
        },
      ],
    );
  }

  async function submit() {
    if (createSession.isPending) return;
    if (!cityId) {
      setError('Please pick a city.');
      return;
    }
    if (!gymId) {
      setError('Please pick a gym.');
      return;
    }
    const dt = new Date(days[dayIdx]);
    dt.setHours(hour, 0, 0, 0);
    if (dt.getTime() < Date.now()) {
      setError('That time is in the past — pick a later one.');
      return;
    }
    if (!note.trim()) {
      setError('Say what you’re climbing.');
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
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2">
        <IconButton variant="ghost" label="Close" onPress={() => router.back()}>
          <X size={24} color={colors.rock[700]} strokeWidth={2} />
        </IconButton>
        <Text className="font-display text-base text-rock-900">New session</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-2"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled">
          {/* Stadt — erstes Feld, filtert die Hallenliste darunter */}
          <View className="mb-6">
            <Eyebrow>City</Eyebrow>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pr-4">
              {cities?.map((city) => (
                <Chip key={city.id} active={cityId === city.id} onPress={() => selectCity(city.id)}>
                  {city.name}
                </Chip>
              ))}
            </ScrollView>
          </View>

          {/* Halle */}
          <View className="mb-6">
            <Eyebrow>Gym</Eyebrow>
            {gymsLoading ? (
              <Text className="py-2 font-sans text-sm text-rock-400">Loading…</Text>
            ) : gymsError ? (
              <Text className="py-2 font-sans text-sm text-danger">
                Couldn’t load gyms.
              </Text>
            ) : !gyms || gyms.length === 0 ? (
              <Text className="py-2 font-sans text-sm text-rock-500">
                No gyms in this city yet.
              </Text>
            ) : null}
            <View className="gap-2">
              {gyms?.map((gym) => {
                const active = gymId === gym.id;
                return (
                  <Pressable
                    key={gym.id}
                    onPress={() => setGymId(gym.id)}
                    className={
                      'h-12 flex-row items-center justify-between rounded-md border px-4 active:scale-[0.99] ' +
                      (active ? 'border-brand-500 bg-brand-50' : 'border-rock-200 bg-rock-0')
                    }>
                    <Text
                      numberOfLines={1}
                      className={
                        'flex-1 font-sans-medium text-[15px] ' +
                        (active ? 'text-brand-700' : 'text-rock-900')
                      }>
                      {/* Kein Stadt-Suffix mehr: die Liste ist bereits auf die
                          oben gewählte Stadt gefiltert. */}
                      {gym.name}
                      {gym.access ? (
                        <Text className="text-rock-400">{`  ·  ${GYM_ACCESS_LABEL[gym.access]}`}</Text>
                      ) : null}
                    </Text>
                    {active ? (
                      <Check size={18} color={colors.brand[600]} strokeWidth={2.5} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Wann — Tag */}
          <View className="mb-5">
            <Eyebrow>When</Eyebrow>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pr-4">
              {days.map((_, i) => (
                <Chip key={i} active={dayIdx === i} onPress={() => setDayIdx(i)}>
                  {dayLabel(i)}
                </Chip>
              ))}
            </ScrollView>
          </View>

          {/* Wann — Uhrzeit */}
          <View className="mb-6">
            <Eyebrow>Time</Eyebrow>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pr-4">
              {HOURS.map((h) => (
                <Chip key={h} active={hour === h} onPress={() => setHour(h)}>
                  {`${h.toString().padStart(2, '0')}:00`}
                </Chip>
              ))}
            </ScrollView>
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

          {error ? <Text className="mt-3 font-sans text-sm text-danger">{error}</Text> : null}
        </ScrollView>

        {/* Submit-Leiste */}
        <View
          className="border-t border-rock-100 bg-rock-0 px-5 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!note.trim()}
            loading={createSession.isPending}
            icon={<Send size={18} color={colors.rock[0]} strokeWidth={2} />}
            onPress={submit}>
            Publish session
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
