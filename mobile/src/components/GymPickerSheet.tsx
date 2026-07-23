import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui';
import { GYM_ACCESS_LABEL, type GymWithCity } from '@/queries/gyms';
import { colors } from '@/theme/colors';

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
            {/* Bei vielen Hallen scrollt die Liste im Sheet, statt das Sheet zu sprengen. */}
            <ScrollView
              className="max-h-[60vh]"
              contentContainerClassName="px-5 pb-4 pt-2 gap-2"
              showsVerticalScrollIndicator={false}>
              {gyms.map((gym) => {
                const active = activeId === gym.id;
                return (
                  <Pressable
                    key={gym.id}
                    onPress={() => {
                      onSelect(gym.id);
                      onClose();
                    }}
                    className={
                      'min-h-12 flex-row items-center justify-between rounded-md border px-4 py-3 active:scale-[0.99] ' +
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
