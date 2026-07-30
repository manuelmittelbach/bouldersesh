import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';

import { publicImageUrl } from '@/lib/images';

// Galeriefotos sind für andere da: sie tauchen nirgends beiläufig auf, sondern
// nur dort, wo jemand ein Profil bewusst ansieht (CONTEXT.md). Deshalb ein
// Streifen ohne Titelzeile und ohne Platzhalter — hat jemand keine Fotos,
// verschwindet der Streifen ganz.
type Props = {
  paths: string[] | null | undefined;
};

export function ProfileGallery({ paths }: Props) {
  if (!paths?.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2">
      {paths.map((path) => (
        <View key={path} className="h-[130px] w-[104px] overflow-hidden rounded-md bg-rock-100">
          <Image
            source={{ uri: publicImageUrl(path) ?? undefined }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={120}
          />
        </View>
      ))}
    </ScrollView>
  );
}
