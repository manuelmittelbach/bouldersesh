import { router, useLocalSearchParams } from "expo-router";
import { Send } from "lucide-react-native";
import { Alert } from "react-native";

import {
  SessionForm,
  type SessionFormValues,
} from "@/components/SessionForm";
import { useActiveCity } from "@/hooks/useActiveCity";
import { SESSION_DAY_WINDOW, startOfDay, toDateKey } from "@/lib/utils";
import { useCities } from "@/queries/cities";
import { useCreateSession } from "@/queries/sessions";
import { colors } from "@/theme/colors";

export default function SessionCreate() {
  // Optionale Vorauswahl-Params aus dem Feed:
  //  - `date` ("YYYY-MM-DD", passend zum Chip-Fenster der DateFilter). Fehlt/passt er
  //    nicht ins Tagfenster (heute..heute+(SESSION_DAY_WINDOW-1)), bleibt es bei Today.
  //  - `gym` (Hallen-ID). Kommt aus dem aktiven Hallen-Filter des Feeds — die Halle liegt
  //    darum in der aktiven Stadt, die hier auch als cityId vorbelegt ist, also stimmig.
  //    Wird die Stadt im Formular gewechselt, setzt das Formular die Halle zurück.
  const params = useLocalSearchParams<{ date?: string; gym?: string }>();
  const { cityId: activeCityId, setActiveCity } = useActiveCity();
  const { data: cities } = useCities();
  const createSession = useCreateSession();

  // Gewählter Tag als Date (Mitternacht-Anker), optional aus params.date vorbelegt.
  const initialDate = (() => {
    const raw = typeof params.date === "string" ? params.date : null;
    const base = startOfDay(new Date());
    if (raw) {
      for (let i = 0; i < SESSION_DAY_WINDOW; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        if (toDateKey(d) === raw) return d;
      }
    }
    return base;
  })();

  // Uhrzeit-Default 18:00; beim Submit mit dem Tag zu einem Zeitstempel kombiniert.
  const initialTime = (() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  })();

  /**
   * Eine Session in einer anderen als der aktiven Stadt wechselt den Kontext NICHT
   * automatisch — sie weist nur darauf hin und bietet den Wechsel an. Sonst würde das
   * einmalige Anlegen einer Auswärts-Session stillschweigend den ganzen Feed umstellen.
   */
  function leaveAfterCreate(cityId: string) {
    const target = cities?.find((c) => c.id === cityId);
    const active = cities?.find((c) => c.id === activeCityId);
    if (cityId === activeCityId || !target) {
      router.replace("/");
      return;
    }
    Alert.alert(
      "Session created",
      `Your session in ${target.name} is live. Your feed still shows ${active?.name ?? "your current city"}.`,
      [
        {
          text: active ? `Stay in ${active.name}` : "Stay here",
          style: "cancel",
          onPress: () => router.replace("/"),
        },
        {
          text: `Switch to ${target.name}`,
          onPress: async () => {
            await setActiveCity(cityId);
            router.replace("/");
          },
        },
      ],
    );
  }

  async function submit(values: SessionFormValues) {
    await createSession.mutateAsync({
      gym_id: values.gymId,
      starts_at: values.startsAt.toISOString(),
      // Leere Notiz → null (nicht ""), die Spalte ist seit 0026 nullable.
      note: values.note || null,
      // DB-Kapazität = Plätze für andere + Gastgeber:in (ADR-0007).
      capacity: values.spots + 1,
    });
    leaveAfterCreate(values.cityId);
  }

  return (
    <SessionForm
      title="New session"
      initial={{
        // Der Screen ist nur erreichbar, wenn eine aktive Stadt steht (Gate im
        // RootNavigator) — der Initialwert ist also nie null.
        cityId: activeCityId,
        gymId: typeof params.gym === "string" ? params.gym : null,
        date: initialDate,
        time: initialTime,
        spots: 3,
        note: "",
      }}
      submitLabel="Publish session"
      submitIcon={<Send size={18} color={colors.rock[0]} strokeWidth={2} />}
      // Erklärt vorab, was Veröffentlichen auslöst — es entsteht ein Gruppenchat, und
      // Beitritts-Anfragen (0017) landen dort, nicht hier.
      submitHint="Publishing creates a group chat where requests reach you."
      pending={createSession.isPending}
      onSubmit={submit}
    />
  );
}
