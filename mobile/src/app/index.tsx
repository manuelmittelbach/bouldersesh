import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Token-Specimen: verifiziert VISUELL, dass der Design-Token-Port steht — Fonts wirklich
// geladen, Farben/Radien/Shadows rendern —, bevor die 11 DS-Komponenten drauf aufsetzen.
// Wegwerfbar: wird beim Screen-Rebuild durch das echte Dashboard ersetzt.
//
// Hinweis: NativeWind generiert nur LITERAL im Quelltext gefundene Klassen. Darum sind die
// Swatch-Klassen ausgeschrieben statt per `bg-brand-${n}` konstruiert.

type Swatch = { cls: string; label: string; ink: 'light' | 'dark' };

const BRAND: Swatch[] = [
  { cls: 'bg-brand-50', label: '50', ink: 'dark' },
  { cls: 'bg-brand-100', label: '100', ink: 'dark' },
  { cls: 'bg-brand-200', label: '200', ink: 'dark' },
  { cls: 'bg-brand-300', label: '300', ink: 'dark' },
  { cls: 'bg-brand-400', label: '400', ink: 'dark' },
  { cls: 'bg-brand-500', label: '500', ink: 'light' },
  { cls: 'bg-brand-600', label: '600', ink: 'light' },
  { cls: 'bg-brand-700', label: '700', ink: 'light' },
  { cls: 'bg-brand-800', label: '800', ink: 'light' },
  { cls: 'bg-brand-900', label: '900', ink: 'light' },
];

const ROCK: Swatch[] = [
  { cls: 'bg-rock-0', label: '0', ink: 'dark' },
  { cls: 'bg-rock-25', label: '25', ink: 'dark' },
  { cls: 'bg-rock-50', label: '50', ink: 'dark' },
  { cls: 'bg-rock-100', label: '100', ink: 'dark' },
  { cls: 'bg-rock-200', label: '200', ink: 'dark' },
  { cls: 'bg-rock-300', label: '300', ink: 'dark' },
  { cls: 'bg-rock-400', label: '400', ink: 'dark' },
  { cls: 'bg-rock-500', label: '500', ink: 'light' },
  { cls: 'bg-rock-600', label: '600', ink: 'light' },
  { cls: 'bg-rock-700', label: '700', ink: 'light' },
  { cls: 'bg-rock-800', label: '800', ink: 'light' },
  { cls: 'bg-rock-900', label: '900', ink: 'light' },
  { cls: 'bg-rock-950', label: '950', ink: 'light' },
];

const GRADES = [
  { surface: 'bg-grade-beginner', ink: 'text-grade-beginner-ink', label: 'Beginner' },
  { surface: 'bg-grade-intermediate', ink: 'text-grade-intermediate-ink', label: 'Intermediate' },
  { surface: 'bg-grade-advanced', ink: 'text-grade-advanced-ink', label: 'Advanced' },
  { surface: 'bg-grade-pro', ink: 'text-grade-pro-ink', label: 'Pro' },
];

const FUNCTIONAL = [
  { surface: 'bg-success-surface', ink: 'text-success', label: 'Success' },
  { surface: 'bg-warning-surface', ink: 'text-warning', label: 'Warning' },
  { surface: 'bg-danger-surface', ink: 'text-danger', label: 'Danger' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="font-mono text-[11px] uppercase tracking-[2px] text-rock-500">{title}</Text>
      {children}
    </View>
  );
}

function SwatchRow({ items }: { items: Swatch[] }) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {items.map((s) => (
        <View key={s.cls} className={`h-12 w-12 items-center justify-center rounded-sm ${s.cls}`}>
          <Text
            className={`font-mono text-[10px] ${s.ink === 'light' ? 'text-rock-0' : 'text-rock-900'}`}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function TokenSpecimen() {
  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      <ScrollView contentContainerClassName="gap-8 px-5 pb-16 pt-4">
        {/* Wordmark — Space Grotesk (Display) */}
        <View className="gap-1">
          <Text className="font-display-bold text-4xl text-rock-900">Boulder Buddy</Text>
          <Text className="font-sans text-sm text-rock-500">Design-Token-Specimen</Text>
        </View>

        <Section title="Brand · Send Orange">
          <SwatchRow items={BRAND} />
        </Section>

        <Section title="Neutrals · Rock">
          <SwatchRow items={ROCK} />
        </Section>

        <Section title="Grade-Bänder">
          <View className="flex-row flex-wrap gap-2">
            {GRADES.map((g) => (
              <View key={g.label} className={`rounded-md px-3 py-1.5 ${g.surface}`}>
                <Text className={`font-mono-semibold text-xs ${g.ink}`}>{g.label}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Funktional">
          <View className="flex-row flex-wrap gap-2">
            {FUNCTIONAL.map((f) => (
              <View key={f.label} className={`rounded-md px-3 py-1.5 ${f.surface}`}>
                <Text className={`font-sans-semibold text-xs ${f.ink}`}>{f.label}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Typografie">
          <View className="gap-2">
            <Text className="font-display-medium text-2xl text-rock-900">Space Grotesk Medium</Text>
            <Text className="font-display text-2xl text-rock-900">Space Grotesk SemiBold</Text>
            <Text className="font-display-bold text-2xl text-rock-900">Space Grotesk Bold</Text>
            <View className="h-px bg-rock-200" />
            <Text className="font-sans text-base text-rock-700">Inter Regular — Body-Text</Text>
            <Text className="font-sans-medium text-base text-rock-700">Inter Medium — Body-Text</Text>
            <Text className="font-sans-semibold text-base text-rock-700">Inter SemiBold — Labels</Text>
            <Text className="font-sans-bold text-base text-rock-700">Inter Bold — Betont</Text>
            <View className="h-px bg-rock-200" />
            <Text className="font-mono text-base text-rock-700">JetBrains Mono · V4 6C+ 18:00</Text>
            <Text className="font-mono-semibold text-base text-rock-700">JetBrains Mono SemiBold</Text>
            <Text className="font-mono-bold text-base text-rock-700">JetBrains Mono Bold</Text>
          </View>
        </Section>

        <Section title="Radien">
          <View className="flex-row flex-wrap items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-xs bg-rock-900">
              <Text className="font-mono text-[10px] text-rock-0">xs</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-sm bg-rock-900">
              <Text className="font-mono text-[10px] text-rock-0">sm</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-md bg-rock-900">
              <Text className="font-mono text-[10px] text-rock-0">md</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-lg bg-rock-900">
              <Text className="font-mono text-[10px] text-rock-0">lg</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-xl bg-rock-900">
              <Text className="font-mono text-[10px] text-rock-0">xl</Text>
            </View>
          </View>
        </Section>

        <Section title="Schatten (iOS-Shadow / Android-Elevation)">
          <View className="flex-row flex-wrap gap-4 pb-2">
            <View className="h-16 w-16 items-center justify-center rounded-md bg-rock-0 shadow-xs">
              <Text className="font-mono text-[10px] text-rock-700">xs</Text>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-md bg-rock-0 shadow-sm">
              <Text className="font-mono text-[10px] text-rock-700">sm</Text>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-md bg-rock-0 shadow-md">
              <Text className="font-mono text-[10px] text-rock-700">md</Text>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-md bg-rock-0 shadow-lg">
              <Text className="font-mono text-[10px] text-rock-700">lg</Text>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-md bg-brand-500 shadow-brand">
              <Text className="font-mono text-[10px] text-rock-0">glow</Text>
            </View>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
