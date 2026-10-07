import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStore } from "@/lib/auth";

/** Protects app routes. Signed-out users go to /login with return path. */
export function RequireAuth() {
  const location = useLocation();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <main className="min-h-screen bg-bg" aria-busy="true" />;
  }

  if (!session) {
    return (
      <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
    );
  }

  return <Outlet />;
}
