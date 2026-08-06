import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Input, ScreenHeader } from "@/components/ui";
import { useSendFeedback } from "@/queries/feedback";

// Single-Purpose-Screen für App-Feedback (aus der Account-Zeilenliste). Ein
// Freitextfeld, ein Button — bei Erfolg sofort zurück zur Liste, die dann kurz
// „Thanks for your feedback." zeigt (updated-Param, wie edit-name).
//
// Bewusst EIN Feld ohne Kategorie-Auswahl: Bug oder Idee sortiert sich beim
// Lesen im Dashboard, nicht beim Schreiben in der App.

// Muss zur DB-Grenze passen (0031: length(message) between 1 and 2000).
const MAX_LENGTH = 2000;

export default function Feedback() {
  const sendFeedback = useSendFeedback();
  const [message, setMessage] = useState("");

  const canSend = message.trim().length > 0;

  function send() {
    if (!canSend || sendFeedback.isPending) return;
    sendFeedback.mutate(message, {
      onSuccess: () => {
        router.dismissTo({
          pathname: "/account",
          params: { updated: "feedback" },
        });
      },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScreenHeader />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mt-2 font-display-bold text-[28px] leading-8 text-rock-900">
            Feedback
          </Text>
          <Text className="mt-3 font-sans text-base leading-6 text-rock-500">
            Found a bug? Missing a feature? Send us your beta.
          </Text>

          <View className="mt-8 gap-3">
            <Input
              value={message}
              onChangeText={setMessage}
              placeholder="What's on your mind?"
              multiline
              maxLength={MAX_LENGTH}
              showCount
              className="min-h-[140px]"
              autoFocus
            />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canSend}
              loading={sendFeedback.isPending}
              onPress={send}
            >
              Send
            </Button>
            {sendFeedback.isError ? (
              <Text className="text-center font-sans text-sm text-danger">
                {(sendFeedback.error as Error).message}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
