import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import Spinner from "./Spinner";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Spinner label="Verificando sessão..." />;
  if (!user)
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}
