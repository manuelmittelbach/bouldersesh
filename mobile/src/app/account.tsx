import { router } from "expo-router";
import { Ban, Lock, LogOut, Mail } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Input, ScreenHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardAwareField } from "@/hooks/useKeyboardAwareField";
import {
  ReauthFailedError,
  useChangeEmail,
  useChangePassword,
} from "@/queries/account";
import { useUpdateProfile } from "@/queries/profiles";
import { mapAuthError } from "@/lib/authErrors";
import { MIN_PASSWORD } from "@/lib/password";
import { colors } from "@/theme/colors";

// „Persönliche Daten" — die auth-nahen Felder (Name, E-Mail, Passwort), die
// bewusst NICHT auf dem Profile-Tab liegen: der Tab dreht sich um die
// Kletter-Identität, dieser Screen um den Account. Abmelden und Löschen sitzen
// unten, weil sie hierher gehören, nicht in den Feed-nahen Tab.
//
// Die Passwort-Mindestlänge kommt aus @/lib/password (MIN_PASSWORD) — dieselbe
// Grenze wie im Signup/Reset-Flow (ADR-0016), damit sie nicht auseinanderdriftet.

function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="mb-3 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

export default function Account() {
  const { user, profile, signOut } = useAuth();
  const updateProfile = useUpdateProfile();
  const changeEmail = useChangeEmail();
  const changePassword = useChangePassword();

  // Alle Felder hier sind einzeilig — die Lib scrollt sie schon voll frei, es reicht der
  // reine Gap-Offset (kein Höhen-Aufschlag, sonst würde es zu weit hochscrollen).
  const { bottomOffset } = useKeyboardAwareField();

  // Name — wie auf dem Profil einmal pro Identität seeden, damit ein
  // Hintergrund-Refetch keine laufende Eingabe überschreibt.
  const [displayName, setDisplayName] = useState("");
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || seededFor.current === profile.id) return;
    seededFor.current = profile.id;
    setDisplayName(profile.display_name ?? "");
  }, [profile]);
  const nameDirty =
    !!profile && displayName.trim() !== (profile.display_name ?? "");

  // E-Mail
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const emailError = changeEmail.error ? (changeEmail.error as Error) : null;

  // Passwort
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const pwTooShort =
    newPassword.length > 0 && newPassword.length < MIN_PASSWORD;
  const pwMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const pwWrongCurrent = changePassword.error instanceof ReauthFailedError;
  const pwOtherError =
    changePassword.error && !pwWrongCurrent
      ? (changePassword.error as Error)
      : null;
  const pwValid =
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD &&
    newPassword === confirmPassword;

  async function saveName() {
    if (!user || !nameDirty || updateProfile.isPending) return;
    await updateProfile.mutateAsync({
      id: user.id,
      display_name: displayName.trim() || null,
    });
  }

  function submitEmail() {
    if (!user?.email || !newEmail.trim() || changeEmail.isPending) return;
    const target = newEmail.trim();
    changeEmail.mutate(
      { newEmail: target },
      {
        onSuccess: () => {
          setPendingEmail(target);
          setNewEmail("");
        },
      },
    );
  }

  function submitPassword() {
    if (!user?.email || !pwValid || changePassword.isPending) return;
    changePassword.mutate(
      { email: user.email, currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
      {/* Zurück-Knopf und Titel kleben fest oben — der Titel scrollt nicht mit dem
          Formular weg. */}
      <ScreenHeader />
      <View className="px-5 pb-2">
        <Text className="font-display-bold text-[28px] leading-8 text-rock-900">
          Account
        </Text>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name — eigener Button im gleichen Stil wie E-Mail/Passwort (outline,
            grau), damit der Account-Screen in sich konsistent ist: drei gleich
            aussehende Aktionen. Ausgegraut bis zur Änderung. (Der Profil-Tab hat
            bewusst einen anderen, orangen Header-Save — dort sind Skill/Bio
            zusammen eine Sache; hier ist jedes Feld für sich.) */}
        <View className="mt-6">
          <SectionHeader>Name</SectionHeader>
          <View className="gap-3">
            <Input
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="What should we call you?"
            />
            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled={!nameDirty}
              loading={updateProfile.isPending}
              onPress={saveName}
            >
              Update name
            </Button>
            {updateProfile.isError ? (
              <Text className="text-center font-sans text-sm text-danger">
                {(updateProfile.error as Error).message}
              </Text>
            ) : null}
          </View>
        </View>

        {/* E-Mail */}
        <View className="mt-9 border-t border-rock-100 pt-8">
          <SectionHeader>Email</SectionHeader>
          <Text className="mb-3 font-sans text-[13px] text-rock-400">
            Currently {user?.email}
          </Text>
          <View className="gap-3">
            <Input
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="New email address"
              icon={<Mail size={18} color={colors.rock[400]} strokeWidth={2} />}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
            />
            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled={!newEmail.trim()}
              loading={changeEmail.isPending}
              onPress={submitEmail}
            >
              Update email
            </Button>
            {emailError ? (
              <Text className="text-center font-sans text-sm text-danger">
                {mapAuthError(emailError)}
              </Text>
            ) : null}
            {changeEmail.isSuccess && pendingEmail ? (
              <View className="rounded-lg bg-success-surface p-4">
                <Text className="font-display text-[15px] text-success">
                  Check your inbox
                </Text>
                <Text className="mt-1 font-sans text-[13px] leading-5 text-rock-700">
                  We sent a confirmation link to {pendingEmail} and to your
                  current address. Your email changes once you’ve confirmed from
                  both.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Passwort */}
        <View className="mt-9 border-t border-rock-100 pt-8">
          <SectionHeader>Password</SectionHeader>
          <View className="gap-3">
            {/* AutoFill NICHT per textContentType="none" abschalten: iOS ignoriert das
                  Opt-out, sobald mehrere secureTextEntry-Felder auf dem Screen stehen,
                  stuft das Formular per Heuristik als „Passwort ändern" ein und legt das
                  „Use Strong Password"-Sheet aufs erste fokussierte Feld — also auf
                  Current. Stattdessen die Felder semantisch labeln (current-/new-password,
                  wie in delete-account und auth/email): dann bietet iOS am Current-Feld
                  den Keychain-Fill an und Strong Password nur an den New-Feldern. */}
            <Input
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              error={
                pwWrongCurrent
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
              error={
                pwTooShort
                  ? `Use at least ${MIN_PASSWORD} characters.`
                  : undefined
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
              error={pwMismatch ? "Passwords don’t match." : undefined}
            />
            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled={!pwValid}
              loading={changePassword.isPending}
              onPress={submitPassword}
            >
              Update password
            </Button>
            {pwOtherError ? (
              <Text className="text-center font-sans text-sm text-danger">
                {mapAuthError(pwOtherError)}
              </Text>
            ) : null}
            {changePassword.isSuccess ? (
              <Text className="text-center font-sans text-sm text-success">
                Password updated.
              </Text>
            ) : null}
          </View>
        </View>

        {/* Sicherheit */}
        <View className="mt-9 border-t border-rock-100 pt-8">
          <SectionHeader>Safety</SectionHeader>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            icon={<Ban size={18} color={colors.rock[700]} strokeWidth={2} />}
            onPress={() => router.push("/blocked")}
          >
            Blocked climbers
          </Button>
        </View>

        {/* Account-Aktionen */}
        <View className="mt-10 border-t border-rock-100 pt-8 gap-3">
          <Button
            variant="outline"
            size="lg"
            fullWidth
            icon={<LogOut size={18} color={colors.rock[700]} strokeWidth={2} />}
            onPress={signOut}
          >
            Sign out
          </Button>

          {/* Löschen bleibt der zurückhaltende, gefährliche Weg — rot, ohne
                eigenen Knopf, auf den Bestätigungs-Screen (ADR-0004). */}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/delete-account")}
            className="items-center py-2 active:opacity-60"
          >
            <Text className="font-sans-medium text-[15px] text-danger">
              Delete account
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
