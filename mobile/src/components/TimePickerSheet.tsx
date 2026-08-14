import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { X } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, IconButton } from "@/components/ui";
import { colors } from "@/theme/colors";

// Zeit-Wähler beim Anlegen: gleiches Bottom-Sheet-Muster wie GymPickerSheet/CitySwitcherSheet.
// Das Scroll-Rad (spinner) lebt IM Sheet mit „Set time"-Button — genau wie Meetup, Google
// Calendar und Airbnb es machen: nie ein nacktes Inline-Rad, sondern immer im Sheet mit
// Kopfzeile und Bestätigung. Spinner auf iOS UND Android → ein Look für beide Plattformen.
//
// Die Auswahl wird als Entwurf (draft) gehalten und erst beim „Set time" nach oben
// committet: Scrollen am Rad ändert das Formular noch nicht, Schließen ohne Bestätigen
// verwirft. Rein präsentational — Wert und „was beim Bestätigen passiert" kommen von außen.
// Deckt sich mit dem MinuteInterval-Literal-Union der Picker-Lib (die es nicht exportiert).
// Als `number` würde es auf keinen Props-Member passen und den ganzen Picker-Typ sprengen.
type MinuteInterval = 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;

export function TimePickerSheet({
  visible,
  value,
  minuteInterval = 15,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  value: Date;
  minuteInterval?: MinuteInterval;
  onConfirm: (next: Date) => void;
  onClose: () => void;
}) {
  // Beim Öffnen den Entwurf auf den aktuellen Wert setzen (React-Muster „State beim
  // Prop-Wechsel anpassen", in der Render-Phase statt per Effect): das Sheet merkt sich den
  // letzten visible-Zustand und seedet das Rad neu, sobald es aufgeht. So bleibt ein zuvor
  // abgebrochenes Scrollen nicht hängen — das Rad startet immer bei der echten Uhrzeit.
  const [draft, setDraft] = useState(value);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(value);
  }

  function onChange(_event: DateTimePickerEvent, picked?: Date) {
    if (picked) setDraft(picked);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-rock-950/40" onPress={onClose}>
        {/* Inneres Pressable fängt Taps ab, damit ein Klick ins Sheet es nicht schließt. */}
        <Pressable className="overflow-hidden rounded-t-2xl bg-rock-25" onPress={() => {}}>
          <SafeAreaView edges={["bottom"]}>
            <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
              <Text className="font-display-bold text-[20px] text-rock-900">Pick a time</Text>
              <IconButton variant="ghost" label="Close" onPress={onClose}>
                <X size={22} color={colors.rock[700]} strokeWidth={2} />
              </IconButton>
            </View>

            <View className="items-center px-5 pt-1">
              {/* Sheet ist hart hell (bg-rock-25), aber der native Picker folgt dem
                  System-Dark-Mode → weiße Ziffern auf hellem Grund. Deshalb festnageln. */}
              <DateTimePicker
                value={draft}
                mode="time"
                is24Hour
                display="spinner"
                minuteInterval={minuteInterval}
                themeVariant="light"
                onChange={onChange}
              />
            </View>

            <View className="px-5 pb-2 pt-1">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  onConfirm(draft);
                  onClose();
                }}
              >
                Set time
              </Button>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
