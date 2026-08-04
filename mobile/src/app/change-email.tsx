import { router } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Input, ScreenHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { mapAuthError } from "@/lib/authErrors";
import { ReauthFailedError, useChangeEmail } from "@/queries/account";
import { colors } from "@/theme/colors";

// Single-Purpose-Screen fürs E-Mail-Ändern (aus der Account-Zeilenliste). Zwei
// Felder: neue Adresse + aktuelles Passwort (Re-Auth, Industrie-Standard). Weil das
// hier der einzige Screen-Inhalt ist, entfällt der frühere oneTimeCode-AutoFill-Hack
// — AutoFill/Keychain dürfen normal arbeiten.
//
// useChangeEmail schickt nur den Code an die NEUE Adresse; der Wechsel greift erst
// nach dem Code auf verify-email-change. Falsches Passwort (ReauthFailedError) zeigt
// die UI am Passwortfeld, alles andere als Zeile über dem Button.

export default function ChangeEmail() {
  const { user } = useAuth();
  const changeEmail = useChangeEmail();

  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");

  const wrongPassword = changeEmail.error instanceof ReauthFailedError;
  const otherError =
    changeEmail.error && !wrongPassword ? (changeEmail.error as Error) : null;

  function submit() {
    if (!user?.email || !newEmail.trim() || !password || changeEmail.isPending)
      return;
    const target = newEmail.trim();
    changeEmail.mutate(
      { email: user.email, currentPassword: password, newEmail: target },
      {
        onSuccess: () => {
          // Der Wechsel ist noch nicht durch — updateUser hat nur den Code an die
          // neue Adresse geschickt. Weiter zum Code-Screen; user.email bleibt bis
          // zur Bestätigung die alte.
          router.push({
            pathname: "/verify-email-change",
            params: { email: target },
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
            Change email
          </Text>
          <Text className="mt-3 font-sans text-base leading-6 text-rock-500">
            {`Currently ${user?.email ?? ""}. We’ll send a code to your new address to confirm the switch.`}
          </Text>

          <View className="mt-8 gap-3">
            <Input
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="New email address"
              icon={<Mail size={18} color={colors.rock[400]} strokeWidth={2} />}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              textContentType="emailAddress"
              autoFocus
            />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Current password"
              icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              error={
                wrongPassword ? (changeEmail.error as Error).message : undefined
              }
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!newEmail.trim() || !password}
              loading={changeEmail.isPending}
              onPress={submit}
            >
              Send code
            </Button>
            {otherError ? (
              <Text className="text-center font-sans text-sm text-danger">
                {mapAuthError(otherError)}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
