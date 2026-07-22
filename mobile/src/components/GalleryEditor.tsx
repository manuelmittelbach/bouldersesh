import { Image } from 'expo-image';
import { Plus, X } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { IconButton } from '@/components/ui';
import { publicImageUrl } from '@/lib/images';
import {
  MAX_GALLERY_PHOTOS,
  useAddGalleryPhoto,
  useRemoveGalleryPhoto,
} from '@/queries/profiles';
import { colors } from '@/theme/colors';
import type { Profile } from '@/types/database';

// Hinzufügen und einzeln Löschen — kein Umsortieren (ADR-0003). Neues hängt
// hinten an; die Array-Reihenfolge in der DB ist die Anzeigereihenfolge.
type Props = {
  profile: Profile;
};

export function GalleryEditor({ profile }: Props) {
  const add = useAddGalleryPhoto();
  const remove = useRemoveGalleryPhoto();
  const paths = profile.gallery_paths;
  const full = paths.length >= MAX_GALLERY_PHOTOS;
  const error = (add.error ?? remove.error) as Error | null;

  function confirmRemove(path: string) {
    Alert.alert('Remove photo?', 'This deletes it from your profile for good.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => remove.mutate({ profile, path }),
      },
    ]);
  }

  return (
    <View>
      <View className="flex-row flex-wrap gap-2">
        {paths.map((path) => (
          <View key={path} className="h-[104px] w-[104px]">
            <View className="h-full w-full overflow-hidden rounded-md bg-rock-100">
              <Image
                source={{ uri: publicImageUrl(path) ?? undefined }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={120}
              />
            </View>
            <IconButton
              variant="ink"
              size="sm"
              label="Remove photo"
              disabled={remove.isPending}
              onPress={() => confirmRemove(path)}
              className="absolute -right-2 -top-2 h-7 w-7 border-2 border-rock-25">
              <X size={14} color={colors.rock[0]} strokeWidth={2.5} />
            </IconButton>
          </View>
        ))}

        {full ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add photo"
            disabled={add.isPending}
            onPress={() => add.mutate(profile)}
            className="h-[104px] w-[104px] items-center justify-center rounded-md border border-dashed border-rock-300 bg-rock-0 active:scale-[0.98]">
            {add.isPending ? (
              <ActivityIndicator color={colors.rock[500]} />
            ) : (
              <>
                <Plus size={20} color={colors.rock[500]} strokeWidth={2} />
                <Text className="mt-1 font-sans-medium text-[13px] text-rock-500">Add</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      <Text className="mt-2 font-sans text-[13px] text-rock-400">
        {full
          ? `That's the maximum of ${MAX_GALLERY_PHOTOS} photos.`
          : `Up to ${MAX_GALLERY_PHOTOS} photos. Only people who open your profile see these.`}
      </Text>

      {error ? (
        <Text className="mt-1 font-sans text-sm text-danger">{error.message}</Text>
      ) : null}
    </View>
  );
}
