import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Vollbild-Betrachter für ein einzelnes Bild. Bewusst simpel: dunkler
// Hintergrund, tippen irgendwo oder auf das X schließt. Sichtbar, solange `uri`
// gesetzt ist — der Aufrufer hält den Zustand und setzt beim Schließen `null`.
//
// `shape` spiegelt die spätere Form: 'circle' zeigt das Profilbild rund (wie der
// Avatar), 'contain' zeigt das ganze Bild (z. B. ein Galeriefoto).
type Props = {
  uri: string | null;
  onClose: () => void;
  shape?: 'circle' | 'contain';
};

export function FullImageViewer({ uri, onClose, shape = 'contain' }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const diameter = Math.min(width, height) - 48;

  return (
    <Modal
      visible={!!uri}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/95"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close image">
        {uri ? (
          shape === 'circle' ? (
            // Quadratisch geladenes Avatar-Bild rund beschneiden: „cover" zeigt
            // exakt denselben Ausschnitt wie der Avatar, nur groß.
            <View
              style={{
                width: diameter,
                height: diameter,
                borderRadius: diameter / 2,
                overflow: 'hidden',
              }}>
              <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            </View>
          ) : (
            <Image
              source={{ uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
            />
          )
        ) : null}
      </Pressable>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={{ position: 'absolute', top: insets.top + 12, right: 20 }}>
        <X size={28} color="#ffffff" strokeWidth={2} />
      </Pressable>
    </Modal>
  );
}
