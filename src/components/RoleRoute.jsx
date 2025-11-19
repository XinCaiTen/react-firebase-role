// src/components/RoleRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** roles: mảng role được phép, ví dụ ['admin'] */
export default function RoleRoute({ roles = [], children }) {
  const { currentUser, role } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}
