import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { MatchRequest } from "@/types/database";

const REQUESTS_FOR_SESSION_KEY = (sessionId: string) =>
  ["matches", "session", sessionId] as const;
const MY_OUTGOING_KEY = ["matches", "outgoing"] as const;

/** A match request with the requester's profile joined in. */
export type MatchRequestWithRequester = MatchRequest & {
  requester: {
    id: string;
    display_name: string | null;
    avatar_path: string | null;
    skill_level: string | null;
  } | null;
};

async function getRequestsForSession(
  sessionId: string,
): Promise<MatchRequestWithRequester[]> {
  const { data, error } = await supabase
    .from("match_requests")
    .select(
      `
        *,
        requester:profiles!match_requests_requester_id_fkey ( id, display_name, avatar_path, skill_level )
      `,
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MatchRequestWithRequester[];
}

export function useRequestsForSession(sessionId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: REQUESTS_FOR_SESSION_KEY(sessionId ?? ""),
    queryFn: () => getRequestsForSession(sessionId!),
    enabled: !!sessionId,
  });

  // Realtime: a new request (or a status change) on this session refetches the
  // list so the creator sees it pop in without a reload. See queries/chat.ts §3.3.
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`session-requests:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_requests",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: REQUESTS_FOR_SESSION_KEY(sessionId),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  return query;
}

export function useCreateMatchRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("match_requests")
        .insert({ session_id: sessionId, requester_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (req) => {
      queryClient.invalidateQueries({
        queryKey: REQUESTS_FOR_SESSION_KEY(req.session_id),
      });
      queryClient.invalidateQueries({ queryKey: MY_OUTGOING_KEY });
    },
  });
}

export function useRespondToMatchRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "accept" | "decline";
    }) => {
      const status = action === "accept" ? "accepted" : "declined";
      const { data, error } = await supabase
        .from("match_requests")
        .update({ status })
        .eq("id", requestId)
        .select()
        .single();
      if (error) throw error;

      // Accepting fires the DB trigger that creates the chat + adds both members
      // (migration 0001). Look it up so the UI can jump straight into it.
      let chatId: string | null = null;
      if (action === "accept") {
        const { data: chat } = await supabase
          .from("chats")
          .select("id")
          .eq("session_id", data.session_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        chatId = chat?.id ?? null;
      }

      return { request: data, chatId };
    },
    onSuccess: ({ request }) => {
      queryClient.invalidateQueries({
        queryKey: REQUESTS_FOR_SESSION_KEY(request.session_id),
      });
      // The session flips to "matched" and a new chat exists — refresh both.
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["chats", "list"] });
    },
  });
}
