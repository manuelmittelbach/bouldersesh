import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session as SupabaseSession, User } from "@supabase/supabase-js";

import { unregisterPushToken } from "@/lib/notifications";
import { PROVISIONING_KEY } from "@/lib/socialAuth";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

/**
 * Auth state hook.
 *
 * Subscribes to onAuthStateChange and pushes session changes into TanStack Query
 * so components re-render via useAuth() automatically. Pattern ported from
 * the bar-happenings project — see Lessons-from-bar-happenings §2.
 *
 * Returns: { session, user, profile, isLoading, signOut }.
 */

const SESSION_KEY = ["auth", "session"] as const;
const PROFILE_KEY = (userId: string | undefined) =>
  ["auth", "profile", userId ?? "anon"] as const;

async function fetchInitialSession(): Promise<SupabaseSession | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchInitialSession,
    staleTime: Infinity,
  });

  const user: User | null = sessionQuery.data?.user ?? null;

  const profileQuery = useQuery({
    queryKey: PROFILE_KEY(user?.id),
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Reines Cache-Flag (nie gefetcht) — signInWithApple schaltet es via
  // setQueryData um. Solange true, hält RootNavigator den Boot-Zustand, statt das
  // Onboarding zu zeigen, während der Apple-Name gerade persistiert wird.
  const provisioningQuery = useQuery({
    queryKey: PROVISIONING_KEY,
    queryFn: () => false,
    initialData: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        queryClient.setQueryData(SESSION_KEY, session);
        if (!session) {
          // Sign-out: clear any user-scoped caches.
          queryClient.removeQueries({ queryKey: ["auth", "profile"] });
        }
      },
    );
    return () => subscription.subscription.unsubscribe();
  }, [queryClient]);

  return {
    session: sessionQuery.data ?? null,
    user,
    profile: profileQuery.data ?? null,
    provisioning: provisioningQuery.data,
    isLoading: sessionQuery.isLoading || (!!user && profileQuery.isLoading),
    signOut: async () => {
      // Vor dem signOut: Das Token-Delete braucht die noch aktive Session
      // (RLS "delete own", Migration 0028). Fehler sind dort nicht fatal.
      await unregisterPushToken();
      await supabase.auth.signOut();
    },
  };
}
