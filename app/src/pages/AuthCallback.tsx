import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";

/**
 * Landing page for magic-link callback.
 * AuthCallbackGate has already waited for Supabase to consume the URL hash by
 * the time this renders, so we just decide where to send the user.
 */
export default function AuthCallback() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    navigate(user ? "/" : "/auth", { replace: true });
  }, [user, isLoading, navigate]);

  return <PageLoader />;
}
