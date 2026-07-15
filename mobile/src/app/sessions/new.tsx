import { router } from 'expo-router';
import { Check, Send, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, IconButton, Input } from '@/components/ui';
import { formatDateDE } from '@/lib/utils';
import { useCreateSession } from '@/queries/sessions';
import { useGyms } from '@/queries/gyms';
import { colors } from '@/theme/colors';

const LEVELS = ['5+', '6a', '6b', '6c', '7a', '7b'];
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
  const { data: gyms } = useGyms();
  const createSession = useCreateSession();

  const [gymId, setGymId] = useState<string | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [hour, setHour] = useState(18);
  const [level, setLevel] = useState('6a');
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
    if (i === 0) return 'Heute';
    if (i === 1) return 'Morgen';
    return formatDateDE(days[i]);
  }

  async function submit() {
    if (createSession.isPending) return;
    if (!gymId) {
      setError('Bitte wähl eine Halle.');
      return;
    }
    setError(null);
    const dt = new Date(days[dayIdx]);
    dt.setHours(hour, 0, 0, 0);
    try {
      await createSession.mutateAsync({
        gym_id: gymId,
        starts_at: dt.toISOString(),
        level,
        note: note.trim() || null,
      });
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Etwas ist schiefgelaufen.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2">
        <IconButton variant="ghost" label="Schließen" onPress={() => router.back()}>
          <X size={24} color={colors.rock[700]} strokeWidth={2} />
        </IconButton>
        <Text className="font-display text-base text-rock-900">Neue Session</Text>
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
          {/* Halle */}
          <View className="mb-6">
            <Eyebrow>Halle</Eyebrow>
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
                      {gym.name}
                      {gym.city ? <Text className="text-rock-400">{`  ·  ${gym.city}`}</Text> : null}
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
            <Eyebrow>Wann</Eyebrow>
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
            <Eyebrow>Uhrzeit</Eyebrow>
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

          {/* Level */}
          <View className="mb-6">
            <Eyebrow>Wunsch-Level</Eyebrow>
            <View className="flex-row flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <Chip key={lvl} active={level === lvl} onPress={() => setLevel(lvl)}>
                  {lvl}
                </Chip>
              ))}
            </View>
          </View>

          {/* Notiz */}
          <Input
            label="Notiz (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={280}
            placeholder="z. B. „Suche jemand zum Projekt-Bouldern an einem 6c+“"
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
            loading={createSession.isPending}
            icon={<Send size={18} color={colors.rock[0]} strokeWidth={2} />}
            onPress={submit}>
            Session veröffentlichen
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
