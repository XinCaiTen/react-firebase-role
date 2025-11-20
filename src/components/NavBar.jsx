import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function NavBar() {
  const { currentUser, role, logout } = useAuth();

  // Style cho link
  const linkStyle = {
    textDecoration: "none",
    color: "#6366f1",
    fontWeight: 500,
    padding: "8px 16px",
    borderRadius: 8,
    transition: "background 0.2s, color 0.2s",
    fontSize: 16,
    letterSpacing: 0.5,
    marginRight: 2,
    display: "inline-block"
  };

  // Style cho link khi hover
  const linkHover = (e) => {
    e.target.style.background = "#6366f1";
    e.target.style.color = "#fff";
  };
  const linkOut = (e) => {
    e.target.style.background = "none";
    e.target.style.color = "#6366f1";
  };

  // Style cho button
  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontWeight: 500,
    fontSize: 16,
    cursor: "pointer",
    transition: "background 0.2s",
    marginLeft: 6,
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 28px",
        borderBottom: "1px solid #e0e7ff",
        background: "linear-gradient(90deg,#e0e7ff 0%,#f3f4f6 100%)",
        boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      <Link
        to="/"
        style={linkStyle}
        onMouseOver={linkHover}
        onMouseOut={linkOut}
      >
        Home
      </Link>
      <Link
        to="https://thehoang21.github.io/ntp-luong/"
        style={linkStyle}
        target="_blank"
        rel="noopener noreferrer"
        onMouseOver={linkHover}
        onMouseOut={linkOut}
      >
        Tính lương
      </Link>
      {currentUser && (
        <Link
          to="/dashboard"
          style={linkStyle}
          onMouseOver={linkHover}
          onMouseOut={linkOut}
        >
          Dashboard
        </Link>
      )}
      {role === "admin" && (
        <>
          <Link
            to="/admin"
            style={linkStyle}
            onMouseOver={linkHover}
            onMouseOut={linkOut}
          >
            Admin
          </Link>
          <Link
            to="/roles"
            style={linkStyle}
            onMouseOver={linkHover}
            onMouseOut={linkOut}
          >
            Roles
          </Link>
        </>
      )}
      {role === "quality" && (
        <Link
          to="/quality"
          style={linkStyle}
          onMouseOver={linkHover}
          onMouseOut={linkOut}
        >
          Quality
        </Link>
      )}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
        {!currentUser ? (
          <Link
            to="/login"
            style={{ ...linkStyle, background: "#6366f1", color: "#fff" }}
            onMouseOver={e => {
              e.target.style.background = "#818cf8";
              e.target.style.color = "#fff";
            }}
            onMouseOut={e => {
              e.target.style.background = "#6366f1";
              e.target.style.color = "#fff";
            }}
          >
            Đăng nhập
          </Link>
        ) : (
          <>
            <span
              style={{
                marginRight: 12,
                color: "#374151",
                fontWeight: 500,
                fontSize: 15,
                padding: "6px 10px",
                background: "#e0e7ff",
                borderRadius: 8,
              }}
            >
              {currentUser.email} <span style={{ color: "#6366f1" }}>({role})</span>
            </span>
            <button
              style={buttonStyle}
              onMouseOver={e => (e.target.style.background = "#dc2626")}
              onMouseOut={e => (e.target.style.background = "#ef4444")}
              onClick={logout}
            >
              Đăng xuất
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
