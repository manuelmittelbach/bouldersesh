import { router } from 'expo-router';
import { ArrowLeft, Check, Lock, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ReauthFailedError, useDeleteAccount } from '@/queries/account';
import { colors } from '@/theme/colors';

// Eigener Bestätigungs-Screen fürs Account-Löschen (ADR-0004). Er sagt zuerst
// klar, was verschwindet UND was bleibt (Nachrichten überleben anonymisiert,
// CONTEXT.md „Gelöschte Nutzer:in"), und verlangt dann die erneute Eingabe des
// Passworts, bevor der endgültige, nicht umkehrbare Schritt möglich ist.

function OutcomeRow({ tone, children }: { tone: 'gone' | 'stays'; children: ReactNode }) {
  const gone = tone === 'gone';
  return (
    <View className="flex-row items-start gap-2.5">
      <View
        className={
          'mt-0.5 h-5 w-5 shrink-0 items-center justify-center rounded-full ' +
          (gone ? 'bg-danger-surface' : 'bg-success-surface')
        }>
        {gone ? (
          <X size={13} color={colors.danger} strokeWidth={2.5} />
        ) : (
          <Check size={13} color={colors.success} strokeWidth={2.5} />
        )}
      </View>
      <Text className="flex-1 font-sans text-[15px] leading-6 text-rock-700">{children}</Text>
    </View>
  );
}

export default function DeleteAccount() {
  const { user } = useAuth();
  const del = useDeleteAccount();

  const [password, setPassword] = useState('');

  // ReauthFailedError ist erwartbar (falsches Passwort) und wird am Feld gezeigt;
  // alles andere ist ein echter Fehler und kommt als eigene Zeile über den Button.
  const wrongPassword = del.error instanceof ReauthFailedError;
  const otherError = del.error && !wrongPassword ? (del.error as Error) : null;

  function confirmDelete() {
    if (!user?.email || !password || del.isPending) return;
    // mutate, nicht mutateAsync: bei Erfolg verschwindet die Session und das
    // Root-Gate leitet selbst auf Login um — hier ist keine Navigation nötig.
    del.mutate({ email: user.email, password });
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="px-4 py-2">
          <IconButton variant="ghost" label="Back" onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.rock[700]} strokeWidth={2} />
          </IconButton>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled">
          <Text className="mt-2 font-display-bold text-[28px] leading-8 text-rock-900">
            Delete account
          </Text>
          <Text className="mt-3 font-sans text-base leading-6 text-rock-500">
            This is permanent. There’s no undo and no grace period.
          </Text>

          <View className="mt-8 gap-3.5">
            <OutcomeRow tone="gone">
              Your profile, photos, sessions and match requests are deleted.
            </OutcomeRow>
            <OutcomeRow tone="stays">
              Messages you’ve sent stay in other people’s chats, shown as “Deleted user.”
            </OutcomeRow>
          </View>

          <View className="mt-9 border-t border-rock-100 pt-8">
            <Text className="mb-3 font-sans text-[15px] leading-6 text-rock-700">
              Enter your password to confirm.
            </Text>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              icon={<Lock size={18} color={colors.rock[400]} strokeWidth={2} />}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              error={wrongPassword ? (del.error as Error).message : undefined}
            />
          </View>

          <View className="mt-8 gap-3">
            <Button
              variant="danger"
              size="lg"
              fullWidth
              disabled={!password || del.isPending}
              loading={del.isPending}
              onPress={confirmDelete}>
              Delete my account
            </Button>

            {otherError ? (
              <Text className="text-center font-sans text-sm text-danger">
                {otherError.message}
              </Text>
            ) : null}

            <Button variant="ghost" size="lg" fullWidth onPress={() => router.back()}>
              Keep my account
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
