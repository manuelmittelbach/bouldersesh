import { Camera } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/AuthScaffold';
import { SkillLevelPicker } from '@/components/SkillLevelPicker';
import { Avatar, Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { publicImageUrl } from '@/lib/images';
import { avatarTone } from '@/lib/utils';
import { useSetAvatar, useUpdateProfile } from '@/queries/profiles';
import type { SkillLevel } from '@/types/database';
import { colors } from '@/theme/colors';

// Identitäts-Gate (ADR-0016): der erste Schritt nach Session, VOR der Stadt.
// Pflicht ist NUR der Anzeigename (CONTEXT.md „Anzeigename") — Niveau und Avatar
// sind bewusst optional und überspringbar (Glossar: Niveau bleibt „optional").
//
// Gehalten wird das Screen über das display_name-Gate in `_layout.tsx`: sobald
// der Name gespeichert ist, greift das Stadt-Gate und leitet automatisch weiter.
//
// HINWEIS ZUR REIHENFOLGE: ADR-0016 skizziert Name → Stadt → Skill → Avatar.
// Umgesetzt sind Name (Pflicht) + Skill + Avatar (optional) in EINEM Schritt vor
// der Stadt — das hält den optionalen Teil an die Identität gekoppelt und kommt
// ohne ein extra „schon gesehen?"-Flag aus. Skill/Avatar bleiben nachträglich
// jederzeit im Profil-Tab editierbar.

function Eyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

export default function Onboarding() {
  const { user, profile, signOut } = useAuth();
  const update = useUpdateProfile();
  const setAvatar = useSetAvatar();

  const [name, setName] = useState('');
  const [skill, setSkill] = useState<SkillLevel | null>(null);

  // Namen EINMAL pro Identität seeden — bei Social kommt er evtl. schon aus dem
  // Provider (user_metadata), bei Email ist er leer. Kein Neu-Seed bei Refetch,
  // sonst würde eine laufende Eingabe überschrieben.
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!user || seededFor.current === user.id) return;
    seededFor.current = user.id;
    const meta = user.user_metadata ?? {};
    const provided =
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      '';
    setName(provided);
  }, [user]);

  const canContinue = name.trim().length > 0 && !update.isPending;

  const avatarBusy = setAvatar.isPending;
  const avatarError = setAvatar.error as Error | null;
  const displayName = name.trim() || user?.email || 'You';

  async function save() {
    if (!user || !canContinue) return;
    // Name ist Pflicht, Skill optional (null = kein Pill). Nach dem Speichern
    // flippt das Gate → Stadt-Screen.
    await update.mutateAsync({
      id: user.id,
      display_name: name.trim(),
      skill_level: skill,
    });
  }

  return (
    <AuthScaffold
      back={false}
      title="Set up your profile"
      subtitle="This is how other climbers will see you. You can change it anytime.">
      {/* Avatar — optional, speichert wie im Profil-Tab SOFORT beim Auswählen. */}
      <View className="items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a profile picture"
          disabled={!profile || avatarBusy}
          onPress={() => profile && !avatarBusy && setAvatar.mutate(profile)}
          className="active:scale-[0.98]">
          <Avatar
            name={displayName}
            tone={avatarTone(user?.id ?? displayName)}
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
        <Text className="mt-2 font-sans text-[13px] text-rock-400">Add a photo (optional)</Text>
        {avatarError ? (
          <Text className="mt-1 text-center font-sans text-sm text-danger">
            {avatarError.message}
          </Text>
        ) : null}
      </View>

      <View className="mt-8 gap-6">
        <View>
          <Eyebrow>Display name</Eyebrow>
          {/* autoFocus: das einzige Pflichtfeld führt — Tastatur ist sofort offen,
              „Done" speichert direkt (Skill/Avatar bleiben überspringbar). */}
          <Input
            value={name}
            onChangeText={setName}
            placeholder="What should we call you?"
            autoCapitalize="words"
            maxLength={40}
            returnKeyType="done"
            autoFocus
            onSubmitEditing={save}
          />
        </View>

        <View>
          <Eyebrow>Skill level (optional)</Eyebrow>
          <SkillLevelPicker value={skill} onChange={setSkill} allowDeselect />
        </View>

        {update.isError ? (
          <Text className="font-sans text-sm text-danger">{(update.error as Error).message}</Text>
        ) : null}

        <Button
          onPress={save}
          variant="primary"
          size="lg"
          fullWidth
          loading={update.isPending}
          disabled={!canContinue}>
          Continue
        </Button>

        {/* Ausweg aus dem Identitäts-Gate: ohne das säße man hier fest, falls die
            Session zu keinem (existierenden) Profil passt — etwa eine verwaiste
            Session nach einem Account-Löschen. Abmelden flippt den Session-Guard
            und führt zurück auf Login. */}
        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          className="items-center py-2 active:opacity-60">
          <Text className="font-sans-medium text-[15px] text-rock-500">
            Not you? Log out
          </Text>
        </Pressable>
      </View>
    </AuthScaffold>
  );
}
