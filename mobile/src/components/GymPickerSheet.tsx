import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui';
import { GYM_ACCESS_LABEL, type GymWithCity } from '@/queries/gyms';
import { colors } from '@/theme/colors';

// Feste Zeilenhöhe (44 = Apples Mindest-Tapziel) + Abstand — Grundlage für die Peek-Rechnung
// unten. Kompakt gehalten, damit möglichst viele Hallen auf einmal sichtbar sind.
const ROW_H = 44;
const GAP = 6;
const PITCH = ROW_H + GAP;
const LIST_TOP = 8; // pt-2 der Liste

// Der Hallen-Wähler beim Anlegen: dasselbe Bottom-Sheet-Muster wie der CitySwitcherSheet,
// nur für Hallen. Die Auswahl öffnet sich erst per Tap — im Formular steht bloß die
// gewählte Halle (oder ein Platzhalter), nicht die ganze Liste. Rein präsentational:
// Daten und „was beim Tippen passiert" kommen von außen.
export function GymPickerSheet({
  visible,
  gyms,
  activeId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  gyms: GymWithCity[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  // Manche Städte haben mehr Hallen (Berlin: 16), als je auf einen Screen passen — „alle
  // sichtbar" ist dort physisch unmöglich. Also so viele VOLLE Zeilen zeigen, wie ins Budget
  // (~72% der Gerätehöhe) passen, PLUS eine halbe Zeile, die unten sichtbar rausragt: dieser
  // Peek (mit Scrollindikator) macht auf jeder Gerätegröße sofort klar, dass es weitergeht,
  // statt dass die letzte sichtbare Zeile wie das Ende aussieht. Passt die ganze Liste (z. B.
  // München mit 12) unter die Grenze, greift maxHeight nicht — dann steht alles ohne Scroll.
  const { height } = useWindowDimensions();
  const fullRows = Math.max(3, Math.floor((height * 0.72) / PITCH));
  const maxListHeight = LIST_TOP + fullRows * PITCH + ROW_H / 2;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-rock-950/40" onPress={onClose}>
        {/* Inneres Pressable fängt Taps ab, damit ein Klick ins Sheet es nicht schließt. */}
        <Pressable className="overflow-hidden rounded-t-2xl bg-rock-25" onPress={() => {}}>
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
              <Text className="font-display-bold text-[20px] text-rock-900">Pick a gym</Text>
              <IconButton variant="ghost" label="Close" onPress={onClose}>
                <X size={22} color={colors.rock[700]} strokeWidth={2} />
              </IconButton>
            </View>
            {/* maxHeight lässt die Liste bei wenigen Hallen zum Inhalt schrumpfen (kein Scroll)
                und kappt sie sonst mitten in einer Zeile → Peek. */}
            <ScrollView
              style={{ maxHeight: maxListHeight }}
              contentContainerClassName="px-5 pb-4 pt-2 gap-1.5"
              showsVerticalScrollIndicator>
              {gyms.map((gym) => {
                const active = activeId === gym.id;
                return (
                  <Pressable
                    key={gym.id}
                    onPress={() => {
                      onSelect(gym.id);
                      onClose();
                    }}
                    style={{ height: ROW_H }}
                    className={
                      'flex-row items-center justify-between rounded-md border px-4 active:scale-[0.99] ' +
                      (active ? 'border-brand-500 bg-brand-50' : 'border-rock-200 bg-rock-0')
                    }>
                    <Text
                      numberOfLines={1}
                      className={
                        'flex-1 font-sans-medium text-[15px] ' +
                        (active ? 'text-brand-700' : 'text-rock-900')
                      }>
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
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
