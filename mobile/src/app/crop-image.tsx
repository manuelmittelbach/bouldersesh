// Eigener Zuschnitt-Screen. Warum nicht der eingebaute Picker-Editor? Der zeigt
// auf iOS/Android seine eigene, eckige Crop-UI — nie rund, nie mit abgerundeten
// Ecken. Hier ist die sichtbare Maske exakt die spätere Form. Was in der Maske
// hell steht, ist genau das, was am Ende erscheint; der Ausschnitt ist immer
// quadratisch, nur die Maske unterscheidet die Fälle (Kreis oder abgerundetes
// Quadrat). Derzeit fragt nur der Avatar zu (Kreis) — die 'rounded'-Maske bleibt
// für eine spätere Galerie erhalten.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';

import { settleCrop, takeCropRequest } from '@/lib/cropStore';

const MARGIN = 20; // Rand links/rechts um das quadratische Sichtfenster
const MIN_SCALE = 1; // 1 = Bild deckt das Sichtfenster gerade eben (cover)
const MAX_SCALE = 6;
const SCRIM = 'rgba(10,10,12,0.72)';

function clampW(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export default function CropImageScreen() {
  const { width: SW, height: SH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Auftrag genau einmal übernehmen (stabil über Re-Renders).
  const [req] = useState(() => takeCropRequest());

  // Falls per Swipe/Back geschlossen: das wartende Promise nicht hängen lassen.
  // Nach „Übernehmen" ist der Auftrag bereits aufgelöst → dieser Aufruf ist No-op.
  useEffect(() => () => settleCrop(null), []);

  // Ohne Auftrag geöffnet (z. B. Hot-Reload) → einfach zurück.
  useEffect(() => {
    if (!req) router.back();
  }, [req]);

  const V = SW - MARGIN * 2; // Seitenlänge des Sichtfensters
  const cx = SW / 2;
  const cy = SH / 2;

  // Das Bild auf das Sichtfenster „cover"-skalieren: die kürzere Kante = V,
  // die längere ragt über den Rand hinaus. baseW/baseH behalten das Seitenverhältnis.
  const aspect = req ? req.width / req.height : 1;
  const baseW = aspect >= 1 ? V * aspect : V;
  const baseH = aspect >= 1 ? V : V / aspect;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Nach jeder Geste zurückschieben, sodass das Sichtfenster immer voll bedeckt
  // bleibt (keine Lücke am Rand).
  const clampTranslation = () => {
    'worklet';
    const s = scale.value;
    const maxTx = Math.max(0, (baseW * s - V) / 2);
    const maxTy = Math.max(0, (baseH * s - V) / 2);
    tx.value = clampW(tx.value, -maxTx, maxTx);
    ty.value = clampW(ty.value, -maxTy, maxTy);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      clampTranslation();
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  // Zoom um die Mitte (kein Fokuspunkt) — robust und für einen quadratischen
  // Ausschnitt völlig ausreichend.
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clampW(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      clampTranslation();
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  if (!req) return <View style={styles.root} />;

  // Sichtfenster (Bildschirm-Pixel) → Quell-Pixel. Da das Seitenverhältnis
  // erhalten bleibt, ist der Umrechnungsfaktor auf beiden Achsen gleich.
  function onUse() {
    const s = scale.value;
    const k = req!.width / (baseW * s); // Quell-Pixel pro Bildschirm-Pixel
    const size = V * k;
    const rawX = (baseW * s) / 2 - V / 2 - tx.value;
    const rawY = (baseH * s) / 2 - V / 2 - ty.value;
    const originX = Math.min(Math.max(rawX * k, 0), req!.width - size);
    const originY = Math.min(Math.max(rawY * k, 0), req!.height - size);
    settleCrop({
      originX: Math.round(originX),
      originY: Math.round(originY),
      size: Math.round(size),
    });
    router.back();
  }

  function onCancel() {
    settleCrop(null);
    router.back();
  }

  const isCircle = req.mask === 'circle';
  const holeX = cx - V / 2;
  const holeY = cy - V / 2;

  return (
    <View style={styles.root}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: cx - baseW / 2,
                top: cy - baseH / 2,
                width: baseW,
                height: baseH,
              },
              imageStyle,
            ]}>
            <Image
              source={{ uri: req.uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Abdunkeln außerhalb der Maske + heller Umriss der Endform. */}
      <Svg
        width={SW}
        height={SH}
        style={StyleSheet.absoluteFill}
        pointerEvents="none">
        <Defs>
          <Mask id="hole">
            <Rect x={0} y={0} width={SW} height={SH} fill="white" />
            {isCircle ? (
              <Circle cx={cx} cy={cy} r={V / 2} fill="black" />
            ) : (
              <Rect x={holeX} y={holeY} width={V} height={V} rx={18} ry={18} fill="black" />
            )}
          </Mask>
        </Defs>
        <Rect x={0} y={0} width={SW} height={SH} fill={SCRIM} mask="url(#hole)" />
        {isCircle ? (
          <Circle
            cx={cx}
            cy={cy}
            r={V / 2}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={2}
          />
        ) : (
          <Rect
            x={holeX}
            y={holeY}
            width={V}
            height={V}
            rx={18}
            ry={18}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={2}
          />
        )}
      </Svg>

      {/* Kopfzeile: Abbrechen / Titel / Übernehmen */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onCancel} hitSlop={12}>
          <Text style={styles.action}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>
          {isCircle ? 'Profile picture' : 'Photo'}
        </Text>
        <Pressable onPress={onUse} hitSlop={12}>
          <Text style={[styles.action, styles.actionBold]}>Use</Text>
        </Pressable>
      </View>

      <Text style={[styles.hint, { bottom: insets.bottom + 24 }]}>
        Drag to reposition · pinch to zoom
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0c' },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  action: { color: '#fff', fontFamily: 'Inter_500Medium', fontSize: 16 },
  actionBold: { fontFamily: 'Inter_700Bold' },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
});
