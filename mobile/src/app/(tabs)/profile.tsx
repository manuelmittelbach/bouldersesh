import { router } from 'expo-router';
import { Camera, Check, LogOut } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GalleryEditor } from '@/components/GalleryEditor';
import { Avatar, Button, Chip, GradePill, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { publicImageUrl } from '@/lib/images';
import { avatarTone, gradeBand } from '@/lib/utils';
import { GYM_ACCESS_LABEL, useGyms } from '@/queries/gyms';
import { useRemoveAvatar, useSetAvatar, useUpdateProfile } from '@/queries/profiles';
import type { SkillLevel } from '@/types/database';
import { colors } from '@/theme/colors';

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};
const SKILL_LEVELS = Object.keys(SKILL_LABEL) as SkillLevel[];

function Eyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const { data: gyms } = useGyms();
  const update = useUpdateProfile();
  const setAvatar = useSetAvatar();
  const removeAvatar = useRemoveAvatar();

  const [displayName, setDisplayName] = useState('');
  const [skill, setSkill] = useState<SkillLevel | null>(null);
  const [bio, setBio] = useState('');
  const [homeGymId, setHomeGymId] = useState<string | null>(null);

  // Formularfelder EINMAL pro Profil-Identität aus dem geladenen Profil seeden. Nicht bei
  // jeder Daten-Änderung neu setzen — sonst würde ein Hintergrund-Refetch laufende (noch
  // nicht gespeicherte) Eingaben überschreiben. Nach Logout/Userwechsel (neue id) neu seeden.
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || seededFor.current === profile.id) return;
    seededFor.current = profile.id;
    setDisplayName(profile.display_name ?? '');
    setSkill(profile.skill_level);
    setBio(profile.bio ?? '');
    setHomeGymId(profile.home_gym_id);
  }, [profile]);

  const dirty =
    !!profile &&
    (displayName !== (profile.display_name ?? '') ||
      skill !== profile.skill_level ||
      bio !== (profile.bio ?? '') ||
      homeGymId !== profile.home_gym_id);

  async function save() {
    if (!user || !dirty || update.isPending) return;
    await update.mutateAsync({
      id: user.id,
      display_name: displayName.trim() || null,
      skill_level: skill,
      bio: bio.trim() || null,
      home_gym_id: homeGymId,
    });
  }

  const name = displayName.trim() || user?.email || 'Profile';

  // Der Avatar wird sofort gespeichert, das Formular erst per Save-Button
  // (ADR-0003). Damit das nicht wie ein Bug wirkt, sagt der Screen es an beiden
  // Bild-Blöcken ausdrücklich.
  const avatarBusy = setAvatar.isPending || removeAvatar.isPending;
  const avatarError = (setAvatar.error ?? removeAvatar.error) as Error | null;

  function editAvatar() {
    if (!profile || avatarBusy) return;
    if (!profile.avatar_path) {
      setAvatar.mutate(profile);
      return;
    }
    Alert.alert('Profile picture', undefined, [
      { text: 'Choose a new one', onPress: () => setAvatar.mutate(profile) },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeAvatar.mutate(profile),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled">
          <View className="pb-3 pt-2">
            <Text className="font-display-bold text-[30px] leading-none text-rock-900">Profile</Text>
          </View>

          {/* Kopf */}
          <View className="mt-4 items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              disabled={!profile || avatarBusy}
              onPress={editAvatar}
              className="active:scale-[0.98]">
              <Avatar
                name={name}
                tone={avatarTone(user?.id ?? name)}
                size="xl"
                src={publicImageUrl(profile?.avatar_path)}
              />
              <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-rock-25 bg-rock-900">
                {avatarBusy ? (
                  <ActivityIndicator size="small" color={colors.rock[0]} />
                ) : (
                  <Camera size={15} color={colors.rock[0]} strokeWidth={2} />
                )}
              </View>
            </Pressable>
            <Text className="mt-2 font-sans text-[13px] text-rock-400">
              Tap to change — saves right away
            </Text>
            {avatarError ? (
              <Text className="mt-1 text-center font-sans text-sm text-danger">
                {avatarError.message}
              </Text>
            ) : null}
            <Text className="mt-3 font-display-bold text-xl text-rock-900">
              {displayName.trim() || 'No name yet'}
            </Text>
            <Text className="font-sans text-sm text-rock-500">{user?.email}</Text>
            {skill ? (
              <View className="mt-3">
                <GradePill grade={SKILL_LABEL[skill]} band={gradeBand(skill)} />
              </View>
            ) : null}
          </View>

          {/* Galerie — wie der Avatar sofort gespeichert, deshalb oberhalb des
              Formulars und optisch von ihm getrennt. */}
          {profile ? (
            <View className="mt-8">
              <Eyebrow>Photos</Eyebrow>
              <GalleryEditor profile={profile} />
            </View>
          ) : null}

          {/* Editierbar — ab hier zählt der Save-Button. */}
          <View className="mt-8 border-t border-rock-100 pt-8 gap-6">
            <Input label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="What should we call you?" />

            <View>
              <Eyebrow>Skill level</Eyebrow>
              <View className="flex-row flex-wrap gap-2">
                {SKILL_LEVELS.map((lvl) => (
                  <Chip key={lvl} active={skill === lvl} onPress={() => setSkill(lvl)}>
                    {SKILL_LABEL[lvl]}
                  </Chip>
                ))}
              </View>
            </View>

            <Input
              label="Bio (optional)"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={280}
              placeholder="A line or two about you and your climbing."
            />

            <View>
              <Eyebrow>Home gym (optional)</Eyebrow>
              <View className="gap-2">
                {gyms?.map((gym) => {
                  const active = homeGymId === gym.id;
                  return (
                    <Pressable
                      key={gym.id}
                      onPress={() => setHomeGymId(active ? null : gym.id)}
                      className={
                        'h-12 flex-row items-center justify-between rounded-md border px-4 active:scale-[0.99] ' +
                        (active ? 'border-brand-500 bg-brand-50' : 'border-rock-200 bg-rock-0')
                      }>
                      <Text
                        numberOfLines={1}
                        className={
                          'flex-1 font-sans-medium text-[15px] ' +
                          (active ? 'text-brand-700' : 'text-rock-900')
                        }>
                        {gym.name}
                        {gym.city ? (
                          <Text className="text-rock-400">{`  ·  ${gym.city.name}`}</Text>
                        ) : null}
                        {gym.access ? (
                          <Text className="text-rock-400">{`  ·  ${GYM_ACCESS_LABEL[gym.access]}`}</Text>
                        ) : null}
                      </Text>
                      {active ? <Check size={18} color={colors.brand[600]} strokeWidth={2.5} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!dirty}
              loading={update.isPending}
              onPress={save}>
              Save
            </Button>

            {update.isError ? (
              <Text className="-mt-3 text-center font-sans text-sm text-danger">
                {(update.error as Error).message}
              </Text>
            ) : null}

            <Button
              variant="outline"
              size="lg"
              fullWidth
              icon={<LogOut size={18} color={colors.rock[700]} strokeWidth={2} />}
              onPress={signOut}>
              Sign out
            </Button>

            {/* Account löschen — endgültig, deshalb kein direkter Knopf, sondern
                der Weg auf einen eigenen Bestätigungs-Screen (ADR-0004). Rot und
                zurückhaltend: die seltene, gefährliche Handlung, nicht die
                angebotene. */}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/delete-account')}
              className="items-center py-2 active:opacity-60">
              <Text className="font-sans-medium text-[15px] text-danger">Delete account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
