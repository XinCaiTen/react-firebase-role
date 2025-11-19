// src/pages/Dashboard.jsx
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { currentUser, role } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>Xin chào <b>{currentUser?.email}</b></p>
      <p>Vai trò hiện tại: <b>{role}</b></p>
    </div>
  );
}
