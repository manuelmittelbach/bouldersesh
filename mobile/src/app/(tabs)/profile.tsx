import { Check, LogOut } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Chip, GradePill, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { avatarTone, gradeBand } from '@/lib/utils';
import { useGyms } from '@/queries/gyms';
import { useUpdateProfile } from '@/queries/profiles';
import type { SkillLevel } from '@/types/database';
import { colors } from '@/theme/colors';

const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Anfänger:in',
  intermediate: 'Fortgeschritten',
  advanced: 'Erfahren',
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

  const name = displayName.trim() || user?.email || 'Profil';

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
            <Text className="font-display-bold text-[30px] leading-none text-rock-900">Profil</Text>
          </View>

          {/* Kopf */}
          <View className="mt-4 items-center">
            <Avatar
              name={name}
              tone={avatarTone(user?.id ?? name)}
              size="xl"
              src={profile?.avatar_url}
            />
            <Text className="mt-3 font-display-bold text-xl text-rock-900">
              {displayName.trim() || 'Noch kein Name'}
            </Text>
            <Text className="font-sans text-sm text-rock-500">{user?.email}</Text>
            {skill ? (
              <View className="mt-3">
                <GradePill grade={SKILL_LABEL[skill]} band={gradeBand(skill)} />
              </View>
            ) : null}
          </View>

          {/* Editierbar */}
          <View className="mt-8 gap-6">
            <Input label="Anzeigename" value={displayName} onChangeText={setDisplayName} placeholder="Wie heißt du?" />

            <View>
              <Eyebrow>Skill-Level</Eyebrow>
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
              placeholder="Ein, zwei Sätze über dich und dein Klettern."
            />

            <View>
              <Eyebrow>Home-Gym (optional)</Eyebrow>
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
                        {gym.city ? <Text className="text-rock-400">{`  ·  ${gym.city}`}</Text> : null}
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
              Speichern
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
              Abmelden
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
