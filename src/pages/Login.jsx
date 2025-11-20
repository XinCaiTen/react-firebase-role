import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { currentUser, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  if (currentUser) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: 380,
        margin: "60px auto",
        padding: "32px 28px",
        background: "linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)",
        borderRadius: 18,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        border: "1px solid #e5e7eb",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: 24,
          fontWeight: 700,
          color: "#374151",
          letterSpacing: 1,
        }}
      >
        {isRegister ? "Đăng ký tài khoản" : "Đăng nhập"}
      </h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #c7d2fe",
            outline: "none",
            fontSize: 16,
            background: "#fff",
            boxShadow: "0 2px 8px rgba(99,102,241,0.04)",
            transition: "border 0.2s",
          }}
          onFocus={e => (e.target.style.border = "1.5px solid #6366f1")}
          onBlur={e => (e.target.style.border = "1px solid #c7d2fe")}
        />
        <input
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #c7d2fe",
            outline: "none",
            fontSize: 16,
            background: "#fff",
            boxShadow: "0 2px 8px rgba(99,102,241,0.04)",
            transition: "border 0.2s",
          }}
          onFocus={e => (e.target.style.border = "1.5px solid #6366f1")}
          onBlur={e => (e.target.style.border = "1px solid #c7d2fe")}
        />
        {err && (
          <div
            style={{
              color: "#ef4444",
              background: "#fee2e2",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 15,
              marginTop: -6,
              textAlign: "center",
              border: "1px solid #fecaca",
            }}
          >
            {err}
          </div>
        )}
        <button
          type="submit"
          style={{
            padding: "12px 0",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(90deg,#6366f1 0%,#818cf8 100%)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(99,102,241,0.09)",
            transition: "background 0.2s",
          }}
          onMouseOver={e => (e.target.style.background = "linear-gradient(90deg,#818cf8 0%,#6366f1 100%)")}
          onMouseOut={e => (e.target.style.background = "linear-gradient(90deg,#6366f1 0%,#818cf8 100%)")}
        >
          {isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
      </form>
      <button
        style={{
          marginTop: 20,
          width: "100%",
          padding: "10px 0",
          borderRadius: 8,
          border: "none",
          background: "#e0e7ff",
          color: "#6366f1",
          fontWeight: 500,
          fontSize: 15,
          cursor: "pointer",
          transition: "background 0.2s, color 0.2s",
        }}
        onMouseOver={e => {
          e.target.style.background = "#6366f1";
          e.target.style.color = "#fff";
        }}
        onMouseOut={e => {
          e.target.style.background = "#e0e7ff";
          e.target.style.color = "#6366f1";
        }}
        onClick={() => setIsRegister((v) => !v)}
      >
        {isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
      </button>
    </div>
  );
}
