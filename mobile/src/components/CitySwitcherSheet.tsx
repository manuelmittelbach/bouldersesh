import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityOptionList } from '@/components/CityOptionList';
import { IconButton } from '@/components/ui';
import { useCities, useOpenSessionCountsByCity } from '@/queries/cities';
import { colors } from '@/theme/colors';

// Der Stadt-Wechsler im Alltag: ein Bottom-Sheet, das der „Climbing in …"-Dropdown im
// Header öffnet. Bewusst KEIN Vollbild-Screen mehr — der /city-Screen bleibt allein das
// blockierende Onboarding-Gate beim ersten Start. Beide zeigen dieselbe CityOptionList.
export function CitySwitcherSheet({
  visible,
  activeId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { data: cities } = useCities();
  const { data: counts } = useOpenSessionCountsByCity();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-rock-950/40" onPress={onClose}>
        {/* Inneres Pressable fängt Taps ab, damit ein Klick ins Sheet es nicht schließt. */}
        <Pressable className="overflow-hidden rounded-t-2xl bg-rock-25" onPress={() => {}}>
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
              <Text className="font-display-bold text-[20px] text-rock-900">Pick your city</Text>
              <IconButton variant="ghost" label="Close" onPress={onClose}>
                <X size={22} color={colors.rock[700]} strokeWidth={2} />
              </IconButton>
            </View>
            <View className="px-5 pb-4 pt-2">
              <CityOptionList
                cities={cities ?? []}
                counts={counts}
                activeId={activeId}
                onPick={(id) => {
                  onSelect(id);
                  onClose();
                }}
              />
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
