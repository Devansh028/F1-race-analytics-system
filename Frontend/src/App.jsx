import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ReplayPage from "./pages/ReplayPage";
import MetricsPage from "./pages/MetricsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminPage from "./pages/AdminPage";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div className="min-h-screen text-zinc-100">
      {!isAuthRoute && (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-red-400">Formula 1</p>
              <h1 className="text-xl font-semibold tracking-wide text-zinc-50">Race Analytics Command Center</h1>
            </div>
            {isAuthenticated ? (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <nav className="flex flex-wrap gap-2 text-sm">
                  <NavItem to="/live">Live</NavItem>
                  <NavItem to="/replay">Replay</NavItem>
                  <NavItem to="/metrics">Performance</NavItem>
                  {user?.role === "ADMIN" && <NavItem to="/admin">Admin</NavItem>}
                </nav>
                <div className="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
                  {user?.name} ({user?.role})
                </div>
                <button
                  onClick={logout}
                  className="rounded-md bg-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <nav className="flex gap-2 text-sm">
                <NavItem to="/login">Login</NavItem>
                <NavItem to="/register">Register</NavItem>
              </nav>
            )}
          </div>
        </header>
      )}

      <main className={isAuthRoute ? "px-4 pb-10" : "mx-auto max-w-7xl px-6 py-8"}>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/live" : "/login"} replace />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/live"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/replay"
            element={
              <ProtectedRoute>
                <ReplayPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/metrics"
            element={
              <ProtectedRoute>
                <MetricsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md border px-3 py-2 transition ${
          isActive
            ? "border-red-500/70 bg-red-600 text-white shadow-[0_0_0_1px_rgba(239,68,68,0.35)]"
            : "border-white/10 bg-zinc-900/70 text-zinc-300 hover:border-white/20 hover:bg-zinc-800"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default App;
