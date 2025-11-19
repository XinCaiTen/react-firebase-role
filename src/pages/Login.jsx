// src/pages/Login.jsx
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
    <div style={{ maxWidth: 360, margin: "48px auto" }}>
      <h2>{isRegister ? "Đăng ký" : "Đăng nhập"}</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Mật khẩu" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div style={{ color: "red" }}>{err}</div>}
        <button type="submit">{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</button>
      </form>
      <button
        style={{ marginTop: 12 }}
        onClick={() => setIsRegister((v) => !v)}
      >
        {isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
      </button>
    </div>
  );
}
