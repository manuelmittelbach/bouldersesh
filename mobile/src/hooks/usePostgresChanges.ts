import { useEffect, useId, useRef } from "react";
import type {
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export type PostgresChangesBinding = {
  event: PostgresChangeEvent;
  schema?: string;
  table: string;
  filter?: string;
  onEvent: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ) => void;
};

/**
 * Owns a Supabase Realtime channel end to end: subscribes `bindings` on one
 * channel, unsubscribes on unmount or when `topic` changes, and always
 * suffixes the channel topic with a per-instance id (via useId).
 *
 * The suffix isn't optional: two mounts of the same caller (e.g. a tab badge
 * and its screen) that shared a topic string used to collide in supabase-js
 * ("tried to call channel.on() after channel was subscribed"). Baking the
 * suffix into this hook removes the "does this caller need it?" judgment call
 * that caused that crash once already — see queries/chat.ts history.
 *
 * `bindings`' event/schema/table/filter — and its length and order — must
 * only depend on values already folded into `topic`: they're read once per
 * `topic` (matched back to `onEvent` by index), not on every render.
 * `onEvent` closures, by contrast, are always read fresh — pass `topic:
 * undefined` to skip subscribing entirely, e.g. while an id isn't known yet.
 */
export function usePostgresChanges(
  topic: string | undefined,
  bindings: PostgresChangesBinding[],
) {
  const instanceId = useId();
  const bindingsRef = useRef(bindings);

  useEffect(() => {
    bindingsRef.current = bindings;
  });

  useEffect(() => {
    if (!topic) return;

    let channel = supabase.channel(`${topic}:${instanceId}`);
    bindings.forEach((binding, index) => {
      channel = channel.on(
        "postgres_changes",
        {
          event: binding.event,
          schema: binding.schema ?? "public",
          table: binding.table,
          filter: binding.filter,
        } as RealtimePostgresChangesFilter<PostgresChangeEvent>,
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) =>
          bindingsRef.current[index]?.onEvent(payload),
      );
    });
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // `bindings` is a fresh array every render (callers build it inline); only a
    // `topic` change should tear down and re-subscribe. Handlers stay current via
    // bindingsRef regardless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, instanceId]);
}
