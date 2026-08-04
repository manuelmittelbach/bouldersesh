import { router, useLocalSearchParams, type Href } from "expo-router";
import { ChevronRight, LogOut } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, ScreenHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { colors } from "@/theme/colors";

// „Account" — die auth-nahen Einstellungen (Name, E-Mail, Passwort), die bewusst
// NICHT auf dem Profile-Tab liegen: der Tab dreht sich um die Kletter-Identität,
// dieser Screen um den Account. Abmelden und Löschen sitzen unten, weil sie
// hierher gehören, nicht in den Feed-nahen Tab.
//
// Aufbau als iOS-Settings-Zeilenliste (kein Formular): jede sensible Änderung ist
// eine antippbare Zeile auf einen eigenen, fokussierten Sub-Screen. Getrennte
// Screens lösen zugleich die iOS-AutoFill-Probleme — ein E-Mail-Feld direkt über
// einem Passwortfeld sah für iOS wie ein Login-Formular aus. Auf Single-Purpose-
// Screens dürfen AutoFill/Keychain wieder normal arbeiten.

// Erfolgs-Feedback: der jeweilige Sub-Screen poppt sofort per `dismissTo` hierher
// zurück und übergibt `updated` = name | email | password. Die Liste zeigt kurz
// die grüne Bestätigung; verify-email-change (OTP-Schritt) liefert `updated=email`.
const UPDATED_MESSAGE: Record<string, string> = {
  name: "Name updated.",
  email: "Email updated.",
  password: "Password updated.",
};

function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="mb-3 font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
      {children}
    </Text>
  );
}

// Eine Einstellungs-Zeile: Label links, aktueller Wert grau rechts, Chevron.
// `divider` zieht eine Trennlinie nach unten (alle außer der letzten Zeile einer
// Gruppe). Der Wert kann fehlen (z.B. „Blocked climbers" — reine Navigation).
function Row({
  label,
  value,
  divider,
  onPress,
}: {
  label: string;
  value?: string;
  divider?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={
        "flex-row items-center gap-3 px-4 py-3.5 active:bg-rock-50 " +
        (divider ? "border-b border-rock-100" : "")
      }
    >
      <Text className="font-sans-medium text-[15px] text-rock-900">{label}</Text>
      <View className="flex-1 flex-row items-center justify-end gap-1.5">
        {value ? (
          <Text
            numberOfLines={1}
            className="shrink font-sans text-[15px] text-rock-400"
          >
            {value}
          </Text>
        ) : null}
        <ChevronRight size={18} color={colors.rock[300]} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

export default function Account() {
  const { user, profile, signOut } = useAuth();

  // Der Erfolgs-Param kommt von einem Sub-Screen zurück. Sofort wieder löschen,
  // sonst zeigt die Meldung nach jedem Zurück-Navigieren erneut.
  const params = useLocalSearchParams<{ updated?: string }>();
  const [updated, setUpdated] = useState<string | null>(null);
  useEffect(() => {
    if (params.updated && UPDATED_MESSAGE[params.updated]) {
      setUpdated(params.updated);
      router.setParams({ updated: undefined });
    }
  }, [params.updated]);

  // Beim Antippen einer Zeile klärt sich die alte Bestätigung.
  function go(pathname: Href) {
    setUpdated(null);
    router.push(pathname);
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
      <ScreenHeader />
      <View className="px-5 pb-2">
        <Text className="font-display-bold text-[28px] leading-8 text-rock-900">
          Account
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        {updated ? (
          <Text className="mt-3 text-center font-sans-medium text-sm text-success">
            {UPDATED_MESSAGE[updated]}
          </Text>
        ) : null}

        <View className="mt-6">
          <SectionHeader>Personal</SectionHeader>
          <View className="overflow-hidden rounded-2xl border border-rock-100 bg-rock-0">
            <Row
              label="Name"
              value={profile?.display_name ?? undefined}
              divider
              onPress={() => go("/edit-name")}
            />
            <Row
              label="Email"
              value={user?.email}
              divider
              onPress={() => go("/change-email")}
            />
            <Row
              label="Password"
              value="••••••"
              onPress={() => go("/change-password")}
            />
          </View>
        </View>

        <View className="mt-10">
          <SectionHeader>Safety</SectionHeader>
          <View className="overflow-hidden rounded-2xl border border-rock-100 bg-rock-0">
            <Row label="Blocked climbers" onPress={() => go("/blocked")} />
          </View>
        </View>

        {/* Account-Aktionen */}
        <View className="mt-10 gap-3">
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
            onPress={() => go("/delete-account")}
            className="items-center py-2 active:opacity-60"
          >
            <Text className="font-sans-medium text-[15px] text-danger">
              Delete account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
