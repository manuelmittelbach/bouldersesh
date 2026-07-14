import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/lib/supabase";
import { PageLoader } from "./PageLoader";

/**
 * Wait briefly for Supabase to consume any access_token / refresh_token
 * in the URL hash before rendering the app.
 *
 * Without this, the very first render on /auth/callback can see "no session"
 * and bounce the user back to /auth before Supabase finishes processing the URL.
 *
 * Pattern ported from bar-happenings. See Lessons §2.
 */
export function AuthCallbackGate({ children }: { children: ReactNode }) {
  const hasAuthFragment =
    typeof window !== "undefined" &&
    (window.location.hash.includes("access_token") ||
      window.location.hash.includes("error_description"));

  const [ready, setReady] = useState(!hasAuthFragment);

  useEffect(() => {
    if (!hasAuthFragment) return;

    let cancelled = false;

    // detectSessionInUrl: true on the client triggers Supabase to parse the hash.
    // We poll for a session for up to ~3s, then give up and render anyway.
    const start = Date.now();
    const tick = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session || Date.now() - start > 3000) {
        if (!cancelled) setReady(true);
        return;
      }
      setTimeout(tick, 100);
    };
    tick();

    return () => {
      cancelled = true;
    };
  }, [hasAuthFragment]);

  if (!ready) return <PageLoader />;
  return <>{children}</>;
}
