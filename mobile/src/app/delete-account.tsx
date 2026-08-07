import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, ScreenHeader } from '@/components/ui';
import { useDeleteAccount } from '@/queries/account';
import { colors } from '@/theme/colors';

// Eigener Bestätigungs-Screen fürs Account-Löschen (ADR-0004). Er sagt zuerst
// klar, was verschwindet UND was bleibt (Nachrichten überleben anonymisiert,
// CONTEXT.md „Gelöschte Nutzer:in"), und verlangt dann das Eintippen von
// DELETE, bevor der endgültige, nicht umkehrbare Schritt möglich ist.
// Bewusst KEINE Passwort-Reauth: Social-Konten (Apple/Google) haben gar kein
// Passwort — die Hürde muss für alle Login-Methoden dieselbe sein.

const CONFIRM_PHRASE = 'DELETE';

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
  const del = useDeleteAccount();

  const [confirmText, setConfirmText] = useState('');
  // trim fängt das unsichtbare Leerzeichen ab, das iOS-AutoCorrect gern anhängt.
  const confirmed = confirmText.trim() === CONFIRM_PHRASE;

  function confirmDelete() {
    if (!confirmed || del.isPending) return;
    // mutate, nicht mutateAsync: bei Erfolg verschwindet die Session und das
    // Root-Gate leitet selbst auf Login um — hier ist keine Navigation nötig.
    del.mutate();
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader />

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
              Type {CONFIRM_PHRASE} to confirm.
            </Text>
            <Input
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={CONFIRM_PHRASE}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
            />
          </View>

          <View className="mt-8 gap-3">
            <Button
              variant="danger"
              size="lg"
              fullWidth
              disabled={!confirmed || del.isPending}
              loading={del.isPending}
              onPress={confirmDelete}>
              Delete my account
            </Button>

            {del.error ? (
              <Text className="text-center font-sans text-sm text-danger">
                {(del.error as Error).message}
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
