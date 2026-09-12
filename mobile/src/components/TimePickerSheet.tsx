import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, IconButton } from "@/components/ui";
import { colors } from "@/theme/colors";

// Zeit-Wähler beim Anlegen. Achtung: der native Picker verhält sich pro Plattform
// grundverschieden, deshalb splitten wir hier bewusst.
//
// iOS: `<DateTimePicker display="spinner">` rendert wirklich als Inline-View. Wir betten
//   es in ein Bottom-Sheet mit Kopfzeile + „Set time"-Button (gleiches Muster wie
//   GymPickerSheet/CitySwitcherSheet, wie Meetup/Google Calendar/Airbnb).
//
// Android: dieselbe Komponente ist KEIN Inline-View — sie öffnet einen imperativen
//   nativen Dialog mit eigenem OK/Cancel. In ein Custom-Sheet gepackt hieß das: der native
//   Dialog ploppt über dem Sheet auf, OK setzt nur den Entwurf, und man musste ZUSÄTZLICH
//   auf „Set time" tippen (Doppel-Bestätigung) — plus flaky Re-Open. Darum auf Android kein
//   Sheet: wir öffnen den nativen Dialog direkt und committen aus dessen OK.
//
// Deckt sich mit dem MinuteInterval-Literal-Union der Picker-Lib (die es nicht exportiert).
// Als `number` würde es auf keinen Props-Member passen und den ganzen Picker-Typ sprengen.
type MinuteInterval = 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;

type Props = {
  visible: boolean;
  value: Date;
  minuteInterval?: MinuteInterval;
  onConfirm: (next: Date) => void;
  onClose: () => void;
};

export function TimePickerSheet(props: Props) {
  // Reiner Weichensteller (ruft selbst keine Hooks auf, damit die Plattform-Verzweigung die
  // Hook-Regeln nicht verletzt). Jede Variante hält ihre eigenen Hooks.
  return Platform.OS === "android" ? (
    <AndroidTimePicker {...props} />
  ) : (
    <IOSTimePickerSheet {...props} />
  );
}

function AndroidTimePicker({ visible, value, minuteInterval = 15, onConfirm, onClose }: Props) {
  // Nur auf der steigenden Flanke von `visible` den nativen Dialog aufmachen. Sein OK
  // committet direkt (kein zweiter Button), Cancel/Back verwirft. Danach immer onClose,
  // damit das Eltern-Flag zurückgesetzt wird und der nächste Tap wieder öffnet.
  const [wasVisible, setWasVisible] = useState(false);
  useEffect(() => {
    if (visible && !wasVisible) {
      setWasVisible(true);
      DateTimePickerAndroid.open({
        value,
        mode: "time",
        is24Hour: true,
        display: "spinner",
        minuteInterval,
        onChange: (event: DateTimePickerEvent, picked?: Date) => {
          if (event.type === "set" && picked) onConfirm(picked);
          onClose();
        },
      });
    } else if (!visible && wasVisible) {
      setWasVisible(false);
    }
  }, [visible, wasVisible, value, minuteInterval, onConfirm, onClose]);

  return null;
}

function IOSTimePickerSheet({ visible, value, minuteInterval = 15, onConfirm, onClose }: Props) {
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
