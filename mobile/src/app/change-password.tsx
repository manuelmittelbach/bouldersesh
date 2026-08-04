import { router } from "expo-router";
import { Lock } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Input, ScreenHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { mapAuthError } from "@/lib/authErrors";
import { MIN_PASSWORD } from "@/lib/password";
import { ReauthFailedError, useChangePassword } from "@/queries/account";
import { colors } from "@/theme/colors";

// Single-Purpose-Screen fürs Passwort-Ändern (aus der Account-Zeilenliste). Drei
// Felder: current / new / confirm. Weil das hier der EINZIGE Screen-Inhalt ist, ist
// AutoFill erwünscht — das iOS-„Use Strong Password"-Sheet auf den neuen Feldern ist
// ein Feature (textContentType newPassword), kein Problem wie im alten Stapel-Layout.
//
// Wirkt sofort (Session bleibt gültig). Falsches aktuelles Passwort
// (ReauthFailedError) zeigt die UI am ersten Feld, alles andere über dem Button.

export default function ChangePassword() {
  const { user } = useAuth();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const pwTooShort =
    newPassword.length > 0 && newPassword.length < MIN_PASSWORD;
  const pwMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const wrongCurrent = changePassword.error instanceof ReauthFailedError;
  const otherError =
    changePassword.error && !wrongCurrent
      ? (changePassword.error as Error)
      : null;
  const valid =
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD &&
    newPassword === confirmPassword;

  function submit() {
    if (!user?.email || !valid || changePassword.isPending) return;
    changePassword.mutate(
      { email: user.email, currentPassword, newPassword },
      {
        onSuccess: () => {
          router.dismissTo({
            pathname: "/account",
            params: { updated: "password" },
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
            Change password
          </Text>
          <Text className="mt-3 font-sans text-base leading-6 text-rock-500">
            You’ll stay signed in on this device.
          </Text>

          <View className="mt-8 gap-3">
            <Input
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              error={
                wrongCurrent
                  ? (changePassword.error as Error).message
                  : undefined
              }
            />
            <Input
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={`New password (min. ${MIN_PASSWORD} characters)`}
              icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              error={
                pwTooShort ? `Use at least ${MIN_PASSWORD} characters.` : undefined
              }
            />
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              error={pwMismatch ? "Passwords don’t match." : undefined}
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!valid}
              loading={changePassword.isPending}
              onPress={submit}
            >
              Update password
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
