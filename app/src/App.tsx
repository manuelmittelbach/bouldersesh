import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthCallbackGate } from "@/components/AuthCallbackGate";
import { PageLoader } from "@/components/PageLoader";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Route-based lazy loading from day 1.
// See Lessons-from-bar-happenings §1 — keeps the initial JS bundle small.
const Auth = lazy(() => import("@/pages/Auth"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SessionCreate = lazy(() => import("@/pages/SessionCreate"));
const SessionDetail = lazy(() => import("@/pages/SessionDetail"));
const Chat = lazy(() => import("@/pages/Chat"));
const ChatList = lazy(() => import("@/pages/ChatList"));
const Profile = lazy(() => import("@/pages/Profile"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function App() {
  return (
    <div className="app-shell">
      <AuthCallbackGate>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Public feed — browsable without login. Actions below stay gated. */}
            <Route path="/" element={<Dashboard />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/sessions/new" element={<SessionCreate />} />
              <Route path="/sessions/:id" element={<SessionDetail />} />
              <Route path="/chats" element={<ChatList />} />
              <Route path="/chats/:id" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </AuthCallbackGate>
    </div>
  );
}
