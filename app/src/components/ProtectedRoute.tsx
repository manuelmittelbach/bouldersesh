import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "./PageLoader";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;
  if (!user) {
    return (
      <Navigate
        to="/auth"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }
  return <Outlet />;
}
