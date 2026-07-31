import { router, useLocalSearchParams } from 'expo-router';
import { Ban, Flag } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlockSheet } from '@/components/BlockSheet';
import { FullImageViewer } from '@/components/FullImageViewer';
import { ReportSheet } from '@/components/ReportSheet';
import { Avatar, GradePill, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, gradeBand, skillLabel } from '@/lib/utils';
import { useBlockProfile } from '@/queries/blocks';
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

/** Melden eines fremden Profils. Der Tap öffnet einen Grund-Picker (ReportSheet) —
 *  eine Kategorie hilft der Moderation zu triagieren, bleibt aber ein einziger Tap,
 *  damit Melden keine Hürde wird. Lebt seit dem Verschieben hier im Profil-Screen
 *  (früher in der Session-Detail). */
function ReportButton({ profileId, name }: { profileId: string; name: string }) {
  const { data: alreadyReported } = useHasReported(profileId);
  const report = useReportProfile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const done = alreadyReported || report.isSuccess;

  if (done) {
    return (
      <Text className="font-sans text-[13px] text-rock-400">
        You reported this profile. We’re looking into it.
      </Text>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Report ${name}`}
        onPress={() => setSheetOpen(true)}
        className="flex-row items-center gap-1.5 px-3 py-2 active:opacity-60">
        <Flag size={13} color={colors.rock[400]} strokeWidth={2} />
        <Text className="font-sans text-[13px] text-rock-400">Report profile</Text>
      </Pressable>
      <ReportSheet
        visible={sheetOpen}
        name={name}
        submitting={report.isPending}
        error={report.isError}
        onSubmit={(reason) =>
          report.mutate(
            { reportedId: profileId, reason },
            { onSuccess: () => setSheetOpen(false) },
          )
        }
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

/** Blocken eines fremden Profils — der persönliche, sofort wirkende Schutz (getrennt
 *  von „Report", ADR-Entscheidung): ihr seht euch nicht mehr und könnt nicht mehr
 *  gemeinsam klettern. Kein Review, kein „wir sehen es uns an" — das ist Melden. Nach
 *  dem Blocken verschwindet das Profil (getProfile → null), darum gehen wir gleich
 *  zurück, statt in den „doesn't exist"-Zustand zu kippen. Zurücknehmen geht im
 *  Account unter „Blocked climbers". */
function BlockButton({ profileId, name }: { profileId: string; name: string }) {
  const block = useBlockProfile();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Block ${name}`}
        onPress={() => setSheetOpen(true)}
        className="flex-row items-center gap-1.5 px-3 py-2 active:opacity-60">
        <Ban size={13} color={colors.rock[400]} strokeWidth={2} />
        <Text className="font-sans text-[13px] text-rock-400">Block user</Text>
      </Pressable>
      <BlockSheet
        visible={sheetOpen}
        name={name}
        submitting={block.isPending}
        error={block.isError}
        onConfirm={() =>
          block.mutate(
            { blockedId: profileId },
            // Nach dem Blocken ist das Profil unerreichbar (getProfile → null) — zurück,
            // statt in den „doesn't exist"-Zustand zu kippen. Kein Sheet-Schließen nötig,
            // der Screen ist eh weg.
            { onSuccess: () => router.back() },
          )
        }
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

export default function ProfileDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile, isLoading } = useProfile(id);
  const { user } = useAuth();

  // Profilbild in groß: gesetzte URI = Betrachter offen.
  const [viewerUri, setViewerUri] = useState<string | null>(null);

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
        <ScreenHeader />
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
  const avatarSrc = publicImageUrl(profile.avatar_path);

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <ScreenHeader />

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8">
        {/* Kopf */}
        <View className="mt-2 items-center">
          {/* Mit Bild antippbar → Vollbild. Ohne Bild (Initialen) gibt es nichts
              zu vergrößern, dann kein Pressable. */}
          {avatarSrc ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View profile picture"
              onPress={() => setViewerUri(avatarSrc)}
              className="active:opacity-90">
              <Avatar name={name} tone={avatarTone(profile.id)} size="xl" src={avatarSrc} />
            </Pressable>
          ) : (
            <Avatar name={name} tone={avatarTone(profile.id)} size="xl" src={null} />
          )}
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

        {/* Blocken + Melden — nur bei fremden Profilen, unauffällig am Fuß: getrennte
            Aktionen (Block = persönlicher Sofortschutz, Report = Moderation). Beides ist
            der Ausnahmefall, nicht die angebotene Handlung. Früher in der Session-Detail,
            seit dem Verschieben hier. */}
        {!isOwn ? (
          // In die beiden unteren Ecken statt mittig gestapelt: so sind die Ausnahme-
          // Aktionen präsent, aber nicht prominent (Block links, Report rechts).
          <View className="mt-10 flex-row items-start justify-between">
            <BlockButton profileId={profile.id} name={name} />
            <ReportButton profileId={profile.id} name={name} />
          </View>
        ) : null}
      </ScrollView>

      <FullImageViewer uri={viewerUri} onClose={() => setViewerUri(null)} shape="circle" />
    </SafeAreaView>
  );
}
