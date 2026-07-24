import type { ReactNode } from "react";
import { forwardRef, useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";
import { colors } from "@/theme/colors";

// Textfeld / Textarea mit optionalem Uppercase-Eyebrow-Label, Leading-Icon, Hint und
// Error-State. Fokus tönt den Rahmen orange (+ dezenter Glow auf iOS). `multiline` rendert
// ein wachsendes Feld. Reicht alle TextInput-Props durch (value/onChangeText/placeholder …).
export type InputProps = TextInputProps & {
  label?: string;
  icon?: ReactNode;
  hint?: string;
  error?: string;
  multiline?: boolean;
  // Zeigt rechts in der Fußzeile einen Zeichenzähler „N/max" — nur zusammen mit
  // `maxLength` sinnvoll. Bei Erreichen des Limits färbt er sich danger.
  showCount?: boolean;
  containerClassName?: string;
  // Meldet die Höhe der (umrandeten) Feld-Box — nicht des Labels. Ein
  // KeyboardAwareScrollView leitet daraus ab, wie weit es scrollen muss, damit das
  // ganze Feld über der Tastatur steht, statt eine feste Zahl zu raten.
  onFieldLayout?: (height: number) => void;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    icon,
    hint,
    error,
    multiline,
    showCount,
    containerClassName,
    className,
    onFocus,
    onBlur,
    onFieldLayout,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderClass = error
    ? "border-danger"
    : focused
      ? "border-brand-500"
      : "border-rock-200";

  // Zähler nur, wenn angefordert UND ein Limit existiert. `value`/`maxLength` bleiben
  // in `rest` (sie fließen unverändert ins TextInput) — hier nur mitgelesen.
  const counted = showCount && typeof rest.maxLength === "number";
  const count = String(rest.value ?? "").length;
  const atLimit = counted && count >= (rest.maxLength as number);

  return (
    <View className={cn("gap-1.5", containerClassName)}>
      {label ? (
        <Text className="font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
          {label}
        </Text>
      ) : null}
      <View
        // Nur mehrzeilige Felder melden ihre Höhe: dort kann der Cursor oben stehen,
        // während die Box nach unten reicht — der Scroll muss die ganze Box freiräumen.
        // Bei einzeiligen Feldern sitzt der Cursor faktisch an der Unterkante; die Lib
        // scrollt sie ohnehin frei, ein Höhen-Aufschlag würde nur zu weit hochscrollen.
        onLayout={
          onFieldLayout && multiline
            ? (e) => onFieldLayout(e.nativeEvent.layout.height)
            : undefined
        }
        className={cn(
          "flex-row gap-2 rounded-md border bg-rock-0 px-3.5",
          multiline ? "items-start py-3" : "h-[46px] items-center",
          borderClass,
        )}
        // Fokus-Ring als dezenter Brand-Glow (iOS-Shadow / Android-Elevation).
        // `style` MUSS immer ein Objekt bleiben: schaltet es zwischen undefined und Objekt
        // um, verliert das TextInput beim Fokussieren sofort wieder den Fokus (Keyboard
        // flackert auf und zu). Daher nur die Werte togglen, nie die Prop selbst.
        style={{
          shadowColor: colors.brand[500],
          shadowOpacity: focused ? 0.18 : 0,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
          elevation: focused ? 2 : 0,
        }}
      >
        {icon ? (
          <View className={cn("shrink-0", multiline && "pt-0.5")}>{icon}</View>
        ) : null}
        <TextInput
          ref={ref}
          multiline={multiline}
          placeholderTextColor={colors.rock[400]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            "flex-1 font-sans text-[15px] text-rock-900",
            multiline && "min-h-[72px]",
            className,
          )}
          style={multiline ? { textAlignVertical: "top" } : undefined}
          {...rest}
        />
      </View>
      {error || hint || counted ? (
        <View className="flex-row items-center justify-between gap-2">
          {error ? (
            <Text className="flex-1 font-sans text-xs text-danger">{error}</Text>
          ) : hint ? (
            <Text className="flex-1 font-sans text-xs text-rock-400">{hint}</Text>
          ) : (
            <View className="flex-1" />
          )}
          {counted ? (
            <Text
              className={cn(
                "font-sans text-xs",
                atLimit ? "text-danger" : "text-rock-400",
              )}
            >
              {count}/{rest.maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});
