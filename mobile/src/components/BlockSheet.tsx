import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/ui';
import { colors } from '@/theme/colors';

// Die Block-Bestätigung. Teilt bewusst denselben Bottom-Sheet-Ablauf wie ReportSheet, damit
// die beiden Profil-Schutzaktionen sich gleich anfühlen (Kopf, Backdrop-Tap, danger-Button,
// Fehlerzeile) — vorher war Block ein nativer Alert und Report ein Sheet. Anders als Report
// hat Block KEINE Kategorie/Auswahl: es ist reasonless, still und sofort. Der Button ist
// darum von Anfang an aktiv, ein Tap genügt. Aufbau/Rahmen spiegeln ReportSheet.
export function BlockSheet({
  visible,
  name,
  submitting,
  error,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  name: string;
  submitting: boolean;
  error: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-rock-950/40" onPress={onClose}>
        {/* Inneres Pressable fängt Taps ab, damit ein Klick ins Sheet es nicht schließt. */}
        <Pressable className="overflow-hidden rounded-t-2xl bg-rock-25" onPress={() => {}}>
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
              <Text className="font-display-bold text-[20px] text-rock-900">Block {name}?</Text>
              <IconButton variant="ghost" label="Close" onPress={onClose}>
                <X size={22} color={colors.rock[700]} strokeWidth={2} />
              </IconButton>
            </View>

            <View className="px-5 pb-4 pt-2">
              <Text className="mb-6 font-sans text-[13px] leading-5 text-rock-500">
                You won’t see each other in the feed or chats, and you won’t be able to join the
                same sessions. They won’t be told. You can undo this in Account → Blocked
                climbers.
              </Text>

              <Button
                variant="danger"
                size="lg"
                fullWidth
                loading={submitting}
                onPress={onConfirm}>
                Block
              </Button>
              {error ? (
                <Text className="mt-2 text-center font-sans text-sm text-danger">
                  Something went wrong. Please try again.
                </Text>
              ) : null}
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
