import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui';
import { useKeyboardAwareField } from '@/hooks/useKeyboardAwareField';

// Gemeinsamer Rahmen der Form-Auth-Screens (Email, Code, Reset, Onboarding) —
// alles außer dem Login-Hero. Einheitlicher Kopf, einheitliche Typo, EIN
// keyboard-aware Scroller. Der Login-Screen (Foto-Hero) bleibt eigenständig.
//
// `back` blendet den Zurück-Button ein. Post-Auth-Gates (Reset, Onboarding)
// setzen `back={false}` — von dort führt kein Weg zurück in den Login-Stack.

type AuthScaffoldProps = {
  title: string;
  subtitle?: string;
  back?: boolean;
  children: ReactNode;
};

export function AuthScaffold({ title, subtitle, back = true, children }: AuthScaffoldProps) {
  const { bottomOffset } = useKeyboardAwareField();

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      {back ? <ScreenHeader /> : <View className="h-14" />}
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10"
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text className="mt-1 font-display-bold text-[26px] leading-8 text-rock-900">{title}</Text>
        {subtitle ? (
          <Text className="mt-2 font-sans text-[15px] leading-5 text-rock-500">{subtitle}</Text>
        ) : null}
        <View className="mt-7">{children}</View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
