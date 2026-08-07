import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  SessionForm,
  type SessionFormValues,
} from "@/components/SessionForm";
import { ScreenHeader } from "@/components/ui";
import {
  canEditSession,
  minSpotsForOthers,
  roleFor,
  spotsTotal,
} from "@/domain/session";
import { useAuth } from "@/hooks/useAuth";
import { hasLeftFeed, startOfDay } from "@/lib/utils";
import { useSession, useUpdateSession } from "@/queries/sessions";
import { colors } from "@/theme/colors";

// Eine eigene Session editieren (ADR-0017) — dasselbe Formular wie Create, nur
// vorausgefüllt. Erreichbar überall dort, wo auch „Delete session" steht (Feed-
// Aktions-Sheet, Session-Detail, Chats-Swipe), im selben Zeitfenster (nicht off-feed).
// Die Folge-Effekte einer Änderung (matched↔open bei Kapazität, System-Zeile + Push an
// die Mitglieder bei Zeit/Halle) übernehmen DB-Trigger (Migration 0033) — der Screen
// schreibt nur die Zeile.
export default function SessionEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading } = useSession(id);
  const { user } = useAuth();
  const update = useUpdateSession();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-rock-25">
        <ActivityIndicator color={colors.brand[500]} />
      </SafeAreaView>
    );
  }

  // Kein Edit ohne Session, ohne Host-Rolle oder nach Feed-Ablauf — dieselbe Regel
  // wie beim Delete. Die UI bietet Edit dann gar nicht erst an; das hier fängt nur
  // stale Einstiege ab (z. B. Session währenddessen gelöscht). Rolle über die eine
  // Rollenleiter (roleFor, ADR-0010) — ohne Membership-Signale, die braucht der
  // Host-Fall nicht.
  const role = session ? roleFor(session, user?.id) : "none";
  if (!session || !canEditSession(role, { offFeed: hasLeftFeed(session.starts_at) })) {
    return (
      <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
        <ScreenHeader />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-sans text-rock-500">
            This session can’t be edited (anymore).
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const startsAt = new Date(session.starts_at);

  async function submit(values: SessionFormValues) {
    try {
      await update.mutateAsync({
        id: session!.id,
        gym_id: values.gymId,
        starts_at: values.startsAt.toISOString(),
        // Leere Notiz → null (nicht ""), die Spalte ist seit 0026 nullable.
        note: values.note || null,
        // DB-Kapazität = Plätze für andere + Gastgeber:in (ADR-0007).
        capacity: values.spots + 1,
      });
    } catch (e) {
      // Der Floor-Guard aus 0033 kann trotz gesperrter Chips zuschlagen, wenn der
      // Client die Besetzung untererfasst (accepted_count blendet Geblockte aus,
      // siehe withClimbers) — dann lesbare Copy statt der rohen PG-Meldung.
      if (e instanceof Error && e.message.includes("capacity below occupied spots")) {
        throw new Error("Spots can’t go below the climbers already in.");
      }
      throw e;
    }
    router.back();
  }

  return (
    <SessionForm
      title="Edit session"
      initial={{
        cityId: session.gym?.city_id ?? null,
        gymId: session.gym_id,
        date: startOfDay(startsAt),
        time: startsAt,
        spots: spotsTotal(session),
        note: session.note ?? "",
      }}
      // Angenommene Anfragen sind verbindlich — Spots nie unter die Besetzung.
      minSpots={minSpotsForOthers(session)}
      // Eine schon gestartete (aber noch nicht off-feed) Session darf ihre
      // unveränderte Startzeit behalten; nur ein NEUER Zeitpunkt muss vorn liegen.
      allowPastStartsAtMs={startsAt.getTime()}
      submitLabel="Save changes"
      submitIcon={<Check size={18} color={colors.rock[0]} strokeWidth={2} />}
      pending={update.isPending}
      onSubmit={submit}
    />
  );
}
