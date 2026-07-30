import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Flag } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileGallery } from '@/components/ProfileGallery';
import { Avatar, GradePill, IconButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, gradeBand, skillLabel } from '@/lib/utils';
import { useProfile } from '@/queries/profiles';
import { useHasReported, useReportProfile } from '@/queries/reports';
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

/** Melden eines fremden Profils. Bewusst ohne Grund-Eingabe: die Meldung soll
 *  keine Hürde haben, geprüft wird ohnehin von Hand. Lebt seit dem Verschieben
 *  hier im Profil-Screen (früher in der Session-Detail). */
function ReportButton({ profileId, name }: { profileId: string; name: string }) {
  const { data: alreadyReported } = useHasReported(profileId);
  const report = useReportProfile();
  const done = alreadyReported || report.isSuccess;

  function confirm() {
    Alert.alert(
      `Report ${name}?`,
      'We’ll take a look at this profile. Nothing happens to it right away, and they won’t be told who reported them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => report.mutate({ reportedId: profileId }),
        },
      ],
    );
  }

  if (done) {
    return (
      <Text className="font-sans text-[13px] text-rock-400">
        You reported this profile. We’re looking into it.
      </Text>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Report ${name}`}
      disabled={report.isPending}
      onPress={confirm}
      className="flex-row items-center gap-1.5 px-3 py-2 active:opacity-60">
      <Flag size={13} color={colors.rock[400]} strokeWidth={2} />
      <Text className="font-sans text-[13px] text-rock-400">Report profile</Text>
    </Pressable>
  );
}

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile, isLoading } = useProfile(id);
  const { user } = useAuth();

  // Das eigene Profil landet hier ohne Sonderfall (read-only) — dort ist Melden
  // sinnlos, also nur bei fremden Profilen anbieten.
  const isOwn = !!user && user.id === id;

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

        {/* Melden — nur bei fremden Profilen, und unauffällig am Fuß: die Meldung
            ist der Ausnahmefall, nicht die angebotene Handlung. Früher in der
            Session-Detail, seit dem Verschieben hier. */}
        {!isOwn ? (
          <View className="mt-10 items-center">
            <ReportButton profileId={profile.id} name={name} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
