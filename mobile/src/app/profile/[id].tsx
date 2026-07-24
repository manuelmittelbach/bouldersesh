import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileGallery } from '@/components/ProfileGallery';
import { Avatar, GradePill, IconButton } from '@/components/ui';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, gradeBand, skillLabel } from '@/lib/utils';
import { useProfile } from '@/queries/profiles';
import { colors } from '@/theme/colors';

// Read-only-Ansicht eines beliebigen Kletterers. Kehrt die frühere Entscheidung um,
// dass es „bewusst keinen eigenen Profil-Screen“ gibt (siehe sessions/[id].tsx): der
// Creator-Block, der Chat-Titel und der Feed-Avatar verlinken jetzt hierher. Rein
// lesend — auch die eigene id landet hier, ohne Sonderfall. Bearbeiten bleibt im
// Profil-Tab.
function Eyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

function BackHeader() {
  return (
    <View className="px-4 py-2">
      <IconButton variant="ghost" label="Back" onPress={() => router.back()}>
        <ArrowLeft size={24} color={colors.rock[700]} strokeWidth={2} />
      </IconButton>
    </View>
  );
}

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile, isLoading } = useProfile(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-rock-25">
        <ActivityIndicator color={colors.brand[500]} />
      </SafeAreaView>
    );
  }

  // Kein Profil: gelöschter Nutzer oder ungültige id (maybeSingle → null).
  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
        <BackHeader />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-sans text-rock-500">
            This climber doesn’t exist (anymore).
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = profile.display_name ?? 'Anonymous';
  const skill = skillLabel(profile.skill_level);

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <BackHeader />

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8">
        {/* Kopf */}
        <View className="mt-2 items-center">
          <Avatar
            name={name}
            tone={avatarTone(profile.id)}
            size="xl"
            src={publicImageUrl(profile.avatar_path)}
          />
          <Text className="mt-3 font-display-bold text-[22px] text-rock-900">{name}</Text>
          {/* Pill = Kletter-Niveau (ADR-0005). Kein Niveau gesetzt → kein Pill. */}
          {skill ? (
            <View className="mt-3">
              <GradePill grade={skill} band={gradeBand(profile.skill_level)} />
            </View>
          ) : null}
        </View>

        {/* Bio — der Freitext, den es auf der Session-Detail nicht gibt. */}
        {profile.bio?.trim() ? (
          <View className="mt-8">
            <Eyebrow>About</Eyebrow>
            <Text className="font-sans text-[15px] leading-6 text-rock-700">
              {profile.bio.trim()}
            </Text>
          </View>
        ) : null}

        {/* Galerie — verschwindet ganz, wenn keine Fotos da sind. */}
        {profile.gallery_paths?.length ? (
          <View className="mt-8">
            <Eyebrow>Photos</Eyebrow>
            <ProfileGallery paths={profile.gallery_paths} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
