import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="p-6 text-sm text-zinc-400">Checking session...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?tab=login" replace state={{ from: location }} />;
  }

  return children;
}
