import { CheckCircle2, Hand, LogOut, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { availableAction, type SessionRole } from '@/domain/session';
import { useCreateMatchRequest, useWithdrawRequest } from '@/queries/matches';
import { useDeleteSession, useLeaveSession } from '@/queries/sessions';
import { colors } from '@/theme/colors';

/** Worauf das Sheet gerade wirkt — vom Feed beim Antippen einer Karte gesetzt. Das Sheet
 *  zeigt bewusst KEINEN Kopf (Name/Zeit stehen schon auf der Karte), nur die eine Aktion —
 *  die `role` bestimmt sie (via availableAction), `id` sagt der Mutation, welche Session
 *  gemeint ist. Eine volle Fremd-Session öffnet das Sheet gar nicht erst (der Feed macht
 *  sie nicht tippbar), darum kommt der „none"-Fall hier nur als „Climb together?" vor. */
export type SessionActionTarget = {
  id: string;
  role: SessionRole;
};

// Statt die Feed-Karte mit Buttons zu überladen, öffnet ein Tap dieses Bottom-Sheet mit
// GENAU der einen Aktion, die zu meiner Beziehung passt (ADR-0006-Aktionsplatz, hierher
// vom Detail-Screen gezogen): eigene → Löschen, dabei → Verlassen, angefragt → Zurück-
// ziehen, offen → „Climb together?". Die Detailseite bleibt bestehen, aber nur noch über
// das „i" im Chat erreichbar. Optik/Copy spiegeln CitySwitcherSheet bzw. den Detail-Bar.
export function SessionActionSheet({
  target,
  onClose,
}: {
  target: SessionActionTarget | null;
  onClose: () => void;
}) {
  const request = useCreateMatchRequest();
  const withdraw = useWithdrawRequest();
  const leave = useLeaveSession();
  const del = useDeleteSession();

  // `target` steuert Sichtbarkeit UND Inhalt. Beim Schließen fällt es sofort auf null;
  // damit das Sheet während der Slide-out-Animation nicht leer zusammenklappt, halten
  // wir den letzten Inhalt in `shown` fest und rendern daraus. Der Abgleich läuft in der
  // Render-Phase (React-Muster für „State aus Props ableiten"), nicht im Effect.
  const [shown, setShown] = useState<SessionActionTarget | null>(target);
  if (target && target !== shown) setShown(target);
  const visible = !!target;
  const data = target ?? shown;

  // Jedes neue Öffnen startet mit frischem Fehlerzustand — sonst bliebe ein alter
  // „Request failed" am nächsten geöffneten Sheet hängen.
  useEffect(() => {
    if (target) request.reset();
    // request.reset ist über Renders stabil (react-query); target ist der Auslöser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  function confirmDelete(id: string) {
    // Gleiche Copy wie Detail-Bar (ADR-0006) und der Chats-Swipe — dieselbe Handlung
    // klingt überall identisch.
    Alert.alert('Delete session?', 'This removes the session and the group chat for everyone.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          del.mutate(id, {
            onSuccess: onClose,
            onError: () =>
              Alert.alert('Couldn’t delete', 'Something went wrong. Please try again.'),
          }),
      },
    ]);
  }

  function confirmLeave(id: string) {
    Alert.alert('Leave session?', "You'll leave this session and its chat.", [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => leave.mutate(id, { onSuccess: onClose }) },
    ]);
  }

  function confirmWithdraw(id: string) {
    Alert.alert('Withdraw request?', undefined, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: () => withdraw.mutate(id, { onSuccess: onClose }),
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-rock-950/40" onPress={onClose}>
        {/* Inneres Pressable fängt Taps ab, damit ein Klick ins Sheet es nicht schließt. */}
        <Pressable className="overflow-hidden rounded-t-2xl bg-rock-25" onPress={() => {}}>
          <SafeAreaView edges={['bottom']}>
            {/* Kein Kopf — nur die eine Aktion. Der Griff oben signalisiert das Sheet;
                geschlossen wird per Tap auf den Backdrop (außen) oder nach der Aktion. */}
            <View className="items-center pb-1 pt-3">
              <View className="h-1 w-9 rounded-full bg-rock-200" />
            </View>
            <View className="px-5 pb-4 pt-2">{data ? renderAction(data) : null}</View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // Die zustandsabhängige EINE Aktion. Reine Render-Funktion (kein `<Component/>`),
  // damit sie auf dieselben Mutations-/Handler-Closures zugreift, ohne eine instabile
  // verschachtelte Komponente zu erzeugen.
  function renderAction(target: SessionActionTarget) {
    // Die Rolle → die eine Handlung (domain/session). Das Sheet öffnet nur für Sessions
    // auf dem Feed, darum ohne `offFeed` — „leave-chat" kommt hier nie vor.
    switch (availableAction(target.role)) {
      case 'delete':
        return (
          <Button
            variant="ghost"
            size="md"
            fullWidth
            loading={del.isPending}
            icon={<Trash2 size={16} color={colors.danger} strokeWidth={2} />}
            onPress={() => confirmDelete(target.id)}>
            <Text className="font-sans-semibold text-[15px] text-danger">Delete session</Text>
          </Button>
        );
      case 'leave':
        return (
          <Button
            variant="ghost"
            size="md"
            fullWidth
            loading={leave.isPending}
            icon={<LogOut size={16} color={colors.danger} strokeWidth={2} />}
            onPress={() => confirmLeave(target.id)}>
            <Text className="font-sans-semibold text-[15px] text-danger">Leave session</Text>
          </Button>
        );
      case 'withdraw':
        // Bereits angefragt (aus dem Feed betreten) — derselbe Bestätigungs-Block wie
        // direkt nach dem Antippen von „Climb together?".
        return renderRequested(target.id);
      default:
        // 'join' — offene Session: beitreten. (Volle Fremd-Sessions kommen hier nie an —
        // der Feed macht sie nicht tippbar, siehe SessionActionTarget.) Nach erfolgreichem Anfragen
        // schließt das Sheet NICHT — es kippt an Ort und Stelle in den Bestätigungs-Block,
        // damit klar wird, was passiert ist; geschlossen wird per Tap auf den Backdrop.
        if (request.isSuccess) return renderRequested(target.id);
        return (
          <>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={request.isPending}
              icon={<Hand size={18} color={colors.rock[0]} strokeWidth={2} />}
              onPress={() => request.mutate(target.id)}>
              Climb together?
            </Button>
            {request.isError ? (
              <Text className="mt-2 text-center font-sans text-sm text-danger">
                Request failed. Maybe you already asked?
              </Text>
            ) : null}
          </>
        );
    }
  }

  // Der Bestätigungs-Block einer laufenden Anfrage: „Request sent" + eine Zeile, die sagt,
  // was als Nächstes passiert, darunter das (leise) Zurückziehen. Geteilt zwischen dem
  // `requested`-Fall und dem Moment direkt nach erfolgreichem „Climb together?".
  function renderRequested(id: string) {
    return (
      <View className="gap-2">
        <View className="items-center gap-1 rounded-md bg-success-surface px-4 py-3">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={16} color={colors.success} strokeWidth={2} />
            <Text className="font-sans-semibold text-base text-success">Request sent</Text>
          </View>
          <Text className="text-center font-sans text-[13px] leading-4 text-success">
            Once accepted, plan together in the chat.
          </Text>
        </View>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          loading={withdraw.isPending}
          onPress={() => confirmWithdraw(id)}>
          <Text className="font-sans-semibold text-[15px] text-rock-500">Withdraw request</Text>
        </Button>
      </View>
    );
  }
}
