// src/components/NavBar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function NavBar() {
  const { currentUser, role, logout } = useAuth();

  return (
    <nav style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #eee" }}>
      <Link to="/">Home</Link>
      {currentUser && <Link to="/dashboard">Dashboard</Link>}
      {/* {role === "admin" && <Link to="/admin">Admin</Link>} */}
      
{role === "admin" && (
  <>
    <Link to="/admin">Admin</Link>
    <Link to="/roles">Roles</Link>
  </>
)}

      {role === "quality" && <Link to="/quality">Quality</Link>}
      <div style={{ marginLeft: "auto" }}>
        {!currentUser ? (
          <Link to="/login">Đăng nhập</Link>
        ) : (
          <>
            <span style={{ marginRight: 12 }}>
              {currentUser.email} ({role})
            </span>
            <button onClick={logout}>Đăng xuất</button>
          </>
        )}
      </div>
    </nav>
  );
}
