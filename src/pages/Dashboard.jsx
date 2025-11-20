// src/pages/Dashboard.jsx
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { currentUser, role } = useAuth();
  if(role === "uservip"){
    return (
    <div style={{ padding: 24 }}>
      <h2>Chao xìn: {currentUser?.email}</h2>
      <p>Vai trò hiện tại: <b>{role}</b></p>
      <a
      href="https://xincaiten.github.io/react-firebase-role/#/christmas"
      rel="noopener noreferrer"
      style={{
        textDecoration: "none",
      }}
    >
      <button
        style={{
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          padding: "12px 32px",
          fontSize: "16px",
          fontWeight: "600",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
          transition: "all 0.3s ease",
          display: "inline-block",
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = "#0056b3";
          e.target.style.transform = "translateY(-3px)";
          e.target.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = "#007bff";
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
        }}
      >
        Click để xem
      </button>
    </a>
    </div>
    
  );
  } else {
    return (
      <div style={{ padding: 24 }}>
        <h2>Dashboard</h2>
        <p>Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }
  
}
