import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useCouple } from "./context/CoupleContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import CategoryView from "./pages/CategoryView";
import Memories from "./pages/Memories";
import Timeline from "./pages/Timeline";
import Search from "./pages/Search";
import PrivacyCenter from "./pages/PrivacyCenter";
import PartnerView from "./pages/PartnerView";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireCouple({ children }: { children: JSX.Element }) {
  const { couple, loading } = useCouple();
  if (loading) return <FullScreenLoader />;
  if (!couple || couple.status !== "ACTIVE") return <Navigate to="/onboarding" replace />;
  return children;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-inkMuted">
      <span className="animate-pulse text-sm tracking-wide">cargando el archivo…</span>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <Onboarding />
          </RequireAuth>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <RequireCouple>
              <Dashboard />
            </RequireCouple>
          </RequireAuth>
        }
      />
      <Route
        path="/category/:categoryId"
        element={
          <RequireAuth>
            <RequireCouple>
              <CategoryView />
            </RequireCouple>
          </RequireAuth>
        }
      />
      <Route
        path="/memories"
        element={
          <RequireAuth>
            <RequireCouple>
              <Memories />
            </RequireCouple>
          </RequireAuth>
        }
      />
      <Route
        path="/timeline"
        element={
          <RequireAuth>
            <RequireCouple>
              <Timeline />
            </RequireCouple>
          </RequireAuth>
        }
      />
      <Route
        path="/search"
        element={
          <RequireAuth>
            <RequireCouple>
              <Search />
            </RequireCouple>
          </RequireAuth>
        }
      />
      <Route
        path="/privacy"
        element={
          <RequireAuth>
            <PrivacyCenter />
          </RequireAuth>
        }
      />
      <Route
        path="/partner"
        element={
          <RequireAuth>
            <RequireCouple>
              <PartnerView />
            </RequireCouple>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
