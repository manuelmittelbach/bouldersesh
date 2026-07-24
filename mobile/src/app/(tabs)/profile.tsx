import { router } from "expo-router";
import { Camera, ChevronRight, UserCog } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { GalleryEditor } from "@/components/GalleryEditor";
import { Avatar, Chip, Input } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardAwareField } from "@/hooks/useKeyboardAwareField";
import { publicImageUrl } from "@/lib/images";
import { avatarTone, cn, SKILL_LABEL, SKILL_LEVELS } from "@/lib/utils";
import {
  useRemoveAvatar,
  useSetAvatar,
  useUpdateProfile,
} from "@/queries/profiles";
import type { SkillLevel } from "@/types/database";
import { colors } from "@/theme/colors";

function Eyebrow({ children }: { children: string }) {
  return (
    <Text className="mb-2 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

export default function Profile() {
  const { user, profile } = useAuth();
  const update = useUpdateProfile();
  const setAvatar = useSetAvatar();
  const removeAvatar = useRemoveAvatar();

  const [skill, setSkill] = useState<SkillLevel | null>(null);
  const [bio, setBio] = useState("");

  // bottomOffset aus der gemessenen Bio-Höhe (mehrzeilig, wächst mit dem Text).
  const { bottomOffset, onFieldLayout } = useKeyboardAwareField();

  // Formularfelder EINMAL pro Profil-Identität aus dem geladenen Profil seeden. Nicht bei
  // jeder Daten-Änderung neu setzen — sonst würde ein Hintergrund-Refetch laufende (noch
  // nicht gespeicherte) Eingaben überschreiben. Nach Logout/Userwechsel (neue id) neu seeden.
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || seededFor.current === profile.id) return;
    seededFor.current = profile.id;
    setSkill(profile.skill_level);
    setBio(profile.bio ?? "");
  }, [profile]);

  const dirty =
    !!profile && (skill !== profile.skill_level || bio !== (profile.bio ?? ""));

  async function save() {
    if (!user || !dirty || update.isPending) return;
    // Name und E-Mail leben jetzt auf dem Account-Screen — hier bewusst nur die
    // Kletter-Felder patchen, damit nichts anderes überschrieben wird.
    await update.mutateAsync({
      id: user.id,
      skill_level: skill,
      bio: bio.trim() || null,
    });
  }

  // Avatar-Initialen brauchen einen Namen, obwohl der Name hier nicht mehr
  // editierbar ist — aus dem geladenen Profil ableiten.
  const name = profile?.display_name?.trim() || user?.email || "Profile";

  // Der Avatar wird sofort gespeichert, das Formular erst per Save-Button
  // (ADR-0003). Die Kamera-Overlay-Geste am Avatar macht das „sofort" sichtbar
  // genug — ein eigener Hinweistext dafür ist raus.
  const avatarBusy = setAvatar.isPending || removeAvatar.isPending;
  const avatarError = (setAvatar.error ?? removeAvatar.error) as Error | null;

  function editAvatar() {
    if (!profile || avatarBusy) return;
    if (!profile.avatar_path) {
      setAvatar.mutate(profile);
      return;
    }
    Alert.alert("Profile picture", undefined, [
      { text: "Choose a new one", onPress: () => setAvatar.mutate(profile) },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeAvatar.mutate(profile),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
      {/* Titel + Save kleben fest oben — scrollen nicht mit dem Formular weg.
          Save sitzt oben rechts (Industriestandard für Edit-Profil: immer
          sichtbar, kanonischer Ort), Brand-farben wenn dirty, sonst ausgegraut. */}
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <Text className="font-display-bold text-[30px] leading-none text-rock-900">
          Profile
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          accessibilityState={{ disabled: !dirty || update.isPending }}
          disabled={!dirty || update.isPending}
          onPress={save}
          hitSlop={10}
          className="min-w-[56px] items-end justify-center py-1 active:opacity-60"
        >
          {update.isPending ? (
            <ActivityIndicator size="small" color={colors.brand[500]} />
          ) : (
            <Text
              className={cn(
                "font-sans-semibold text-[17px]",
                dirty ? "text-brand-500" : "text-rock-300",
              )}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps="handled"
      >
        {/* Kopf — nur noch der Avatar als visuelle Identität. Name, E-Mail und
              Skill-Badge sind raus; Name/E-Mail wohnen auf dem Account-Screen. */}
        <View className="mt-4 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
            disabled={!profile || avatarBusy}
            onPress={editAvatar}
            className="active:scale-[0.98]"
          >
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
          {/* Name nur anzeigen (read-only) — editiert wird er auf dem Account-Screen. */}
          <Text className="mt-3 font-display-bold text-[22px] text-rock-900">
            {name}
          </Text>
          {avatarError ? (
            <Text className="mt-1 text-center font-sans text-sm text-danger">
              {avatarError.message}
            </Text>
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
          <View>
            <Eyebrow>Skill level</Eyebrow>
            <View className="flex-row flex-wrap gap-2">
              {SKILL_LEVELS.map((lvl) => (
                <Chip
                  key={lvl}
                  active={skill === lvl}
                  onPress={() => setSkill(lvl)}
                >
                  {SKILL_LABEL[lvl]}
                </Chip>
              ))}
            </View>
          </View>

          <Input
            label="Bio (optional)"
            value={bio}
            onChangeText={setBio}
            onFieldLayout={onFieldLayout}
            multiline
            maxLength={280}
            placeholder="A line or two about you and your climbing."
          />

          {update.isError ? (
            <Text className="text-center font-sans text-sm text-danger">
              {(update.error as Error).message}
            </Text>
          ) : null}
        </View>

        {/* Persönliche Daten — Name, E-Mail, Passwort, Abmelden, Löschen. Ein
              eigener Screen, damit der Tab bei der Kletter-Identität bleibt. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/account")}
          className="mt-8 flex-row items-center gap-3 rounded-lg border border-rock-100 bg-rock-0 px-4 py-4 active:opacity-70"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-rock-100">
            <UserCog size={18} color={colors.rock[700]} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-[15px] text-rock-900">
              Account
            </Text>
            <Text className="font-sans text-[13px] text-rock-400">
              Name, email, password
            </Text>
          </View>
          <ChevronRight size={20} color={colors.rock[400]} strokeWidth={2} />
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
