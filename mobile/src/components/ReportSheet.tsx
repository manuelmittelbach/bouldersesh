import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, IconButton } from '@/components/ui';
import { colors } from '@/theme/colors';

// Der Grund-Picker zum Melden: Industrie-Standard ist die Kategorie-Auswahl (kein freies
// Textfeld als Primär-Eingabe), damit die Moderation triagieren kann, ohne dass Melden zur
// Hürde wird. Ein Tap auf eine Kategorie, ein Tap auf „Report" — mehr nicht. Die Kategorie
// landet in profile_reports.reason (nullable, existiert seit 0009). Bewusst KEINE Undo-/
// Review-Sprache hier — das ist das leise Sofort-Gegenstück „Block" (getrennte Aktion).
// Aufbau spiegelt die Sheet-Familie: Rahmen/Kopf wie CitySwitcherSheet, der danger-
// Submit + die Fehlerzeile wie SessionActionSheet.

// Label = gespeicherter reason-Wert: der Moderator liest genau diesen Text. „Other" ist der
// Auffangfall, damit niemand am fehlenden Passenden hängen bleibt.
const REASONS = [
  'Harassment',
  'Fake profile',
  'Inappropriate photos',
  'Spam',
  'Underage',
  'Other',
] as const;

export function ReportSheet({
  visible,
  name,
  submitting,
  error,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  name: string;
  submitting: boolean;
  error: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}) {
  // Einfach-Auswahl. Jedes Öffnen startet ohne Vorauswahl — sonst hinge die Kategorie der
  // letzten Meldung am nächsten geöffneten Sheet. Rücksetzung passiert beim visible-Wechsel
  // in der Render-Phase (React-Muster „State aus Props ableiten", wie SessionActionSheet) —
  // ein Effect mit synchronem setState ist hier per Lint-Regel verboten.
  const [selected, setSelected] = useState<string | null>(null);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setSelected(null);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-rock-950/40" onPress={onClose}>
        {/* Inneres Pressable fängt Taps ab, damit ein Klick ins Sheet es nicht schließt. */}
        <Pressable className="overflow-hidden rounded-t-2xl bg-rock-25" onPress={() => {}}>
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
              <Text className="font-display-bold text-[20px] text-rock-900">Report {name}</Text>
              <IconButton variant="ghost" label="Close" onPress={onClose}>
                <X size={22} color={colors.rock[700]} strokeWidth={2} />
              </IconButton>
            </View>

            <View className="px-5 pb-4 pt-2">
              <Text className="mb-4 font-sans text-[13px] leading-5 text-rock-500">
                What’s going on? This helps us take a look. They won’t be told who reported
                them.
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {REASONS.map((reason) => (
                  <Chip
                    key={reason}
                    active={selected === reason}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selected === reason }}
                    onPress={() => setSelected(reason)}>
                    {reason}
                  </Chip>
                ))}
              </View>

              <View className="mt-6">
                <Button
                  variant="danger"
                  size="lg"
                  fullWidth
                  disabled={!selected}
                  loading={submitting}
                  onPress={() => selected && onSubmit(selected)}>
                  Report
                </Button>
                {error ? (
                  <Text className="mt-2 text-center font-sans text-sm text-danger">
                    Something went wrong. Please try again.
                  </Text>
                ) : null}
              </View>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
