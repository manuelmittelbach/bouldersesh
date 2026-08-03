import { useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { cn } from '@/lib/utils';

// 8-stelliges Code-Feld für Email-Verify UND Passwort-Reset (ADR-0016).
// Länge = Supabase-OTP-Länge des Projekts (mailer_otp_length = 8); muss exakt
// passen, sonst nimmt der Screen den Code aus der Mail nie an.
//
// Ein EINZIGES (unsichtbares) TextInput fängt die Eingabe ab; darüber liegen
// acht sichtbare Kästchen. So bekommen wir iOS-SMS/Email-Autofill
// (`textContentType="oneTimeCode"`) und ein sauberes number-pad, ohne acht
// Felder mit fragilem Fokus-Weiterreichen zu bauen. Die aktive Umrandung läuft
// über ein getoggeltes border-className (wie im DS-`Input`) — Schatten werden
// hier bewusst NICHT getoggelt (NativeWind-Shadow-Toggle-Crash).

const LENGTH = 8;

export type OtpInputProps = {
  value: string;
  onChangeText: (next: string) => void;
  /** Feuert, sobald alle acht Stellen stehen — gut für Auto-Submit. */
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  editable?: boolean;
  /** Färbt alle Kästchen im Fehlerfall rot. */
  invalid?: boolean;
};

export function OtpInput({
  value,
  onChangeText,
  onComplete,
  autoFocus,
  editable = true,
  invalid = false,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  function handleChange(text: string) {
    const cleaned = text.replace(/\D/g, '').slice(0, LENGTH);
    onChangeText(cleaned);
    if (cleaned.length === LENGTH) onComplete?.(cleaned);
  }

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => inputRef.current?.focus()}
      className="relative">
      <View className="flex-row justify-between">
        {Array.from({ length: LENGTH }).map((_, i) => {
          const char = value[i] ?? '';
          // Das „aktive" Kästchen ist das nächste leere (oder das letzte, wenn voll).
          const isCursor = editable && i === Math.min(value.length, LENGTH - 1);
          const border = invalid
            ? 'border-danger'
            : char || isCursor
              ? 'border-brand-500'
              : 'border-rock-200';
          return (
            <View
              key={i}
              className={cn(
                'h-14 w-9 items-center justify-center rounded-md border bg-rock-0',
                border,
              )}>
              <Text className="font-display-bold text-[20px] text-rock-900">{char}</Text>
            </View>
          );
        })}
      </View>

      {/* Unsichtbarer Fänger — deckt die Kästchen ab, damit ein Tap fokussiert. */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        autoFocus={autoFocus}
        editable={editable}
        caretHidden
        className="absolute inset-0 h-full w-full opacity-0"
      />
    </Pressable>
  );
}
