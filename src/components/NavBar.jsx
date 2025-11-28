import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

export default function NavBar() {
  const { currentUser, role, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setShowMobileMenu(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    display: "inline-block",
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
        gap: isMobile ? 8 : 10,
        padding: isMobile ? "8px 16px" : "12px 28px",
        borderBottom: "1px solid #e0e7ff",
        background: "linear-gradient(90deg,#e0e7ff 0%,#f3f4f6 100%)",
        boxShadow: "0 2px 12px rgba(99,102,241,0.06)",
        fontFamily: "Segoe UI, Arial, sans-serif",
        position: "relative",
        flexWrap: isMobile ? "nowrap" : "wrap",
        justifyContent: isMobile ? "space-between" : "flex-start",
      }}
    >
      {/* Mobile navigation links or desktop navigation */}
      {isMobile ? (
        <>
          {/* Mobile hamburger button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              padding: "8px",
              color: "#6366f1",
            }}
          >
            ☰
          </button>
          
          {/* Mobile menu overlay */}
          {showMobileMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #e0e7ff",
                borderTop: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                padding: "16px",
                gap: "8px",
              }}
            >
              {currentUser && (
                <Link
                  to="/dashboard"
                  style={{...linkStyle, padding: "12px 16px", fontSize: 16}}
                  onMouseOver={linkHover}
                  onMouseOut={linkOut}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                </Link>
              )}
              {currentUser && (
                <Link
                  to="/chat"
                  style={{...linkStyle, padding: "12px 16px", fontSize: 16}}
                  onMouseOver={linkHover}
                  onMouseOut={linkOut}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Phòng Chat
                </Link>
              )}
              {role !== "uservip" && (
                <Link
                  to="https://thehoang21.github.io/ntp-luong/"
                  style={{...linkStyle, padding: "12px 16px", fontSize: 16}}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseOver={linkHover}
                  onMouseOut={linkOut}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Tính lương
                </Link>
              )}
              {currentUser && (
                <Link
                  to="https://thehoang21.github.io/grammar-check/"
                  style={{...linkStyle, padding: "12px 16px", fontSize: 16}}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseOver={linkHover}
                  onMouseOut={linkOut}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Kiểm tra ngữ pháp
                </Link>
              )}
              {role === "admin" && (
                <>
                  <Link
                    to="/admin"
                    style={{...linkStyle, padding: "12px 16px", fontSize: 16}}
                    onMouseOver={linkHover}
                    onMouseOut={linkOut}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Admin
                  </Link>
                  <Link
                    to="/roles"
                    style={{...linkStyle, padding: "12px 16px", fontSize: 16}}
                    onMouseOver={linkHover}
                    onMouseOut={linkOut}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Roles
                  </Link>
                </>
              )}
              {role === "quality" && (
                <Link
                  to="/quality"
                  style={{...linkStyle, padding: "12px 16px", fontSize: 16}}
                  onMouseOver={linkHover}
                  onMouseOut={linkOut}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Quality
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Desktop navigation */}
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
          {currentUser && (
            <Link
              to="/chat"
              style={linkStyle}
              onMouseOver={linkHover}
              onMouseOut={linkOut}
            >
              Phòng Chat
            </Link>
          )}
          {role !== "uservip" && (
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
          )}
          {currentUser && (
            <Link
              to="https://thehoang21.github.io/grammar-check/"
              style={linkStyle}
              target="_blank"
              rel="noopener noreferrer"
              onMouseOver={linkHover}
              onMouseOut={linkOut}
            >
              Kiểm tra ngữ pháp
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
        </>
      )}
      {/* {role === ("uservip" || "admin") && (
        <Link
          to="/christmas"
          style={linkStyle}
          onMouseOver={linkHover}
          onMouseOut={linkOut}
        >
          Christmas
        </Link>
      )} */}
      <div
        style={{ 
          marginLeft: isMobile ? 0 : "auto", 
          display: "flex", 
          alignItems: "center",
          gap: isMobile ? 8 : 12
        }}
      >
        {!currentUser ? (
          <Link
            to="/login"
            style={{ 
              ...linkStyle, 
              background: "#6366f1", 
              color: "#fff",
              padding: isMobile ? "6px 12px" : "8px 16px",
              fontSize: isMobile ? 14 : 16
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#818cf8";
              e.target.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#6366f1";
              e.target.style.color = "#fff";
            }}
          >
            {isMobile ? "Login" : "Đăng nhập"}
          </Link>
        ) : (
          <>
            {!isMobile && (
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
                {currentUser.email}{" "}
                <span style={{ color: "#6366f1" }}>({role})</span>
              </span>
            )}
            {isMobile && (
              <span
                style={{
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: 12,
                }}
              >
                {currentUser.email?.split('@')[0]}
              </span>
            )}
            <button
              style={{
                ...buttonStyle,
                padding: isMobile ? "6px 12px" : "8px 16px",
                fontSize: isMobile ? 14 : 16,
                minHeight: isMobile ? "36px" : "auto",
              }}
              onMouseOver={(e) => (e.target.style.background = "#dc2626")}
              onMouseOut={(e) => (e.target.style.background = "#ef4444")}
              onClick={logout}
            >
              {isMobile ? "Thoát" : "Đăng xuất"}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
