import { router } from "expo-router";
import { Camera, Check, ChevronRight, UserCog } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { GalleryEditor } from "@/components/GalleryEditor";
import { Avatar, Button, Chip, Input } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardAwareField } from "@/hooks/useKeyboardAwareField";
import { publicImageUrl } from "@/lib/images";
import { avatarTone, gradeBand, SKILL_LABEL, SKILL_LEVELS } from "@/lib/utils";
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
  const insets = useSafeAreaInsets();

  const [skill, setSkill] = useState<SkillLevel | null>(null);
  const [bio, setBio] = useState("");

  const dirty =
    !!profile && (skill !== profile.skill_level || bio !== (profile.bio ?? ""));

  // Die einblendende Save-Leiste unten überlagert bei offener Tastatur das Bio-Feld.
  // Ihre gemessene Höhe (barHeight) als clearance weiterreichen — aber nur, wenn sie
  // sichtbar ist (dirty) —, damit das fokussierte Feld über Leiste UND Tastatur bleibt.
  const [barHeight, setBarHeight] = useState(0);
  const { bottomOffset, onFieldLayout } = useKeyboardAwareField({
    clearance: dirty ? barHeight : 0,
  });

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
      {/* Titel klebt fest oben. Gespeichert wird über die einblendende Leiste unten
          (erscheint nur bei Änderungen, direkt bei den Feldern) — der frühere,
          im Ruhezustand ausgegraute Save oben rechts wurde zu leicht übersehen. */}
      <View className="px-5 pb-3 pt-2">
        <Text className="font-display-bold text-[30px] leading-none text-rock-900">
          Profile
        </Text>
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
                  band={gradeBand(lvl)}
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

      {/* Save-Leiste — ersetzt den leicht zu übersehenden Save oben rechts: eine volle
          Leiste, die nur bei ungespeicherten Änderungen (dirty) erscheint, direkt bei
          den Feldern und per KeyboardStickyView über der Tastatur (wie in sessions/new).
          Weiterhin explizites Speichern von Skill/Bio (ADR-0003), nur an sichtbarerer
          Stelle; Avatar und Galerie speichern unverändert sofort. */}
      {/* Bei offener Tastatur reitet die Leiste direkt auf der Tastatur, die den
          Home-Indicator-Bereich schon abdeckt — den insets.bottom-Anteil der
          paddingBottom deshalb per offset.opened hinter die Tastatur schieben,
          sonst bleibt ein toter weißer Streifen unter dem Button. */}
      {dirty ? (
        <KeyboardStickyView offset={{ opened: insets.bottom }}>
          <View
            onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
            className="border-t border-rock-100 bg-rock-0 px-5 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={update.isPending}
              icon={<Check size={18} color={colors.rock[0]} strokeWidth={2} />}
              onPress={save}
            >
              Save changes
            </Button>
          </View>
        </KeyboardStickyView>
      ) : null}
    </SafeAreaView>
  );
}
