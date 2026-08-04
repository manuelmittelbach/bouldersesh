import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Input, ScreenHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/queries/profiles";

// Single-Purpose-Screen fürs Umbenennen (aus der Account-Zeilenliste). Ein Feld,
// ein Button — bei Erfolg sofort zurück zur Liste, die dann kurz „Name updated."
// zeigt (updated-Param). Kein Verweilen, kein Timer (Feedback-Variante 1).

export default function EditName() {
  const { user, profile } = useAuth();
  const updateProfile = useUpdateProfile();

  // Einmal pro Identität seeden, damit ein Hintergrund-Refetch keine laufende
  // Eingabe überschreibt.
  const [displayName, setDisplayName] = useState("");
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || seededFor.current === profile.id) return;
    seededFor.current = profile.id;
    setDisplayName(profile.display_name ?? "");
  }, [profile]);

  const dirty = !!profile && displayName.trim() !== (profile.display_name ?? "");

  function save() {
    if (!user || !dirty || updateProfile.isPending) return;
    updateProfile.mutate(
      { id: user.id, display_name: displayName.trim() || null },
      {
        onSuccess: () => {
          router.dismissTo({
            pathname: "/account",
            params: { updated: "name" },
          });
        },
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScreenHeader />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mt-2 font-display-bold text-[28px] leading-8 text-rock-900">
            Name
          </Text>
          <Text className="mt-3 font-sans text-base leading-6 text-rock-500">
            This is how other climbers see you.
          </Text>

          <View className="mt-8 gap-3">
            <Input
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="What should we call you?"
              autoCapitalize="words"
              autoFocus
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!dirty}
              loading={updateProfile.isPending}
              onPress={save}
            >
              Save
            </Button>
            {updateProfile.isError ? (
              <Text className="text-center font-sans text-sm text-danger">
                {(updateProfile.error as Error).message}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
