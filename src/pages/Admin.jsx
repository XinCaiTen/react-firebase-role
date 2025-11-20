import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  deleteField,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { role, currentUser } = useAuth();

  // ========= USERS state =========
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ uid: "", email: "", role: "user" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // ========= ROLES (system) state =========
  const [roles, setRoles] = useState(["admin", "user", "quality", "uservip"]);

  // Chặn non-admin vào trang
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  // Subscribe danh sách USERS
  useEffect(() => {
    const ref = collection(db, "users");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(list);
      },
      (e) => setErr(e.message)
    );
    return () => unsub();
  }, []);

  // Subscribe danh sách ROLES (settings/roles)
  useEffect(() => {
    const ref = doc(db, "settings", "roles");
    const unsub = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          await setDoc(ref, { roles: ["admin", "user", "quality"] }, { merge: true });
          setRoles(["admin", "user", "quality"]);
        } else {
          const data = snap.data() || {};
          const list = Array.isArray(data.roles) ? data.roles : [];
          if (list.length) setRoles(list);
        }
      },
      (e) => setErr(e.message)
    );
    return () => unsub();
  }, []);

  // ===== Helpers cho USERS =====
  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users]
  );
  const isLastAdmin = (id) => {
    const target = users.find((u) => u.id === id);
    return target?.role === "admin" && adminCount <= 1;
  };
  const isSelf = (id) => currentUser?.uid === id;

  // ===== USERS handlers =====
  const handleRoleChange = async (id, value) => {
    try {
      setErr("");
      if (isSelf(id) && value !== "admin") {
        setErr("Bạn không thể tự hạ cấp chính mình.");
        return;
      }
      if (isLastAdmin(id) && value !== "admin") {
        setErr("Không thể hạ cấp admin cuối cùng. Vui lòng tạo thêm admin khác trước.");
        return;
      }
      setBusy(true);
      await updateDoc(doc(db, "users", id), { role: value });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRoleDelete = async (id) => {
    if (!confirm("Xóa trường 'role' khỏi người dùng này?")) return;
    try {
      setErr("");
      if (isSelf(id)) {
        setErr("Bạn không thể xóa role của chính mình.");
        return;
      }
      if (isLastAdmin(id)) {
        setErr("Không thể xoá role của admin cuối cùng.");
        return;
      }
      setBusy(true);
      await updateDoc(doc(db, "users", id), { role: deleteField() });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resetRoleToUser = async (id) => {
    try {
      setErr("");
      if (isSelf(id)) {
        setErr("Bạn không thể tự hạ cấp chính mình.");
        return;
      }
      if (isLastAdmin(id)) {
        setErr("Không thể hạ cấp admin cuối cùng. Vui lòng tạo thêm admin khác trước.");
        return;
      }
      setBusy(true);
      await updateDoc(doc(db, "users", id), { role: "user" });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleEmailChange = async (id, value) => {
    try {
      setBusy(true);
      await updateDoc(doc(db, "users", id), { email: value });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteUserDoc = async (id) => {
    const target = users.find((u) => u.id === id);
    if (!confirm("Xóa document người dùng này? Thao tác không thể hoàn tác.")) return;

    try {
      setErr("");
      if (isSelf(id)) {
        setErr("Bạn không thể xóa chính mình.");
        return;
      }
      if (target?.role === "admin" && adminCount <= 1) {
        setErr("Không thể xoá document của admin cuối cùng.");
        return;
      }
      setBusy(true);
      await deleteDoc(doc(db, "users", id));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Thêm doc user
  const handleAddUserDoc = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setBusy(true);
      const uid = newUser.uid.trim();
      if (uid) {
        await setDoc(
          doc(db, "users", uid),
          { email: newUser.email || "", role: newUser.role || "user" },
          { merge: true }
        );
      } else {
        await addDoc(collection(db, "users"), {
          email: newUser.email || "",
          role: newUser.role || "user",
        });
      }
      setNewUser({ uid: "", email: "", role: "user" });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  // ===== Style helpers =====
  const cardStyle = {
    border: "1px solid #e0e7ff",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(99,102,241,0.07)",
    padding: 16,
    marginBottom: 8,
    transition: "box-shadow 0.2s",
  };

  const inputStyle = {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #c7d2fe",
    fontSize: 15,
    outline: "none",
    background: "#f3f4f6",
    marginBottom: 2,
    transition: "border 0.2s",
  };

  const selectStyle = {
    ...inputStyle,
    padding: "10px 12px",
    cursor: "pointer",
    background: "#eef2ff",
  };

  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: "#6366f1",
    color: "#fff",
    fontWeight: 500,
    fontSize: 15,
    cursor: "pointer",
    transition: "background 0.2s",
    boxShadow: "0 2px 6px rgba(99,102,241,0.09)",
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: "#ef4444",
    color: "#fff",
    marginLeft: 4,
  };

  const resetButtonStyle = {
    ...buttonStyle,
    background: "#818cf8",
    color: "#fff",
    marginLeft: 4,
  };

  // ========= RENDER =========
  return (
    <div
      style={{
        maxWidth: 820,
        margin: "32px auto",
        padding: "32px 24px",
        background: "linear-gradient(135deg,#e0e7ff 0%,#f3f4f6 100%)",
        borderRadius: 22,
        boxShadow: "0 6px 32px rgba(99,102,241,0.08)",
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#6366f1", fontWeight: 700, marginBottom: 18 }}>
        Khu vực Admin
      </h2>
      {err && (
        <div
          style={{
            color: err.startsWith("Đổi") ? "#22c55e" : "#ef4444",
            background: err.startsWith("Đổi") ? "#dcfce7" : "#fee2e2",
            border: `1px solid ${err.startsWith("Đổi") ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 15,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {err}
        </div>
      )}

      {/* ======= SECTION: QUẢN LÝ NGƯỜI DÙNG ======= */}
      <section style={{ margin: "32px 0 28px 0" }}>
        <h3 style={{ color: "#374151", fontWeight: 600, marginBottom: 10 }}>Thêm/Sửa document người dùng</h3>
        <form onSubmit={handleAddUserDoc} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <input
            style={inputStyle}
            placeholder="UID (nếu người dùng đã đăng ký Auth). Để trống nếu muốn tạo ID tự sinh."
            value={newUser.uid}
            onChange={(e) => setNewUser((s) => ({ ...s, uid: e.target.value }))}
            onFocus={e => (e.target.style.border = "1.5px solid #6366f1")}
            onBlur={e => (e.target.style.border = "1px solid #c7d2fe")}
          />
          <input
            style={inputStyle}
            placeholder="Email (tuỳ chọn)"
            value={newUser.email}
            onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))}
            onFocus={e => (e.target.style.border = "1.5px solid #6366f1")}
            onBlur={e => (e.target.style.border = "1px solid #c7d2fe")}
          />
          <select
            style={selectStyle}
            value={newUser.role}
            onChange={(e) => setNewUser((s) => ({ ...s, role: e.target.value }))}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            style={buttonStyle}
            onMouseOver={e => (e.target.style.background = "#818cf8")}
            onMouseOut={e => (e.target.style.background = "#6366f1")}
          >
            Thêm/Sửa doc
          </button>
        </form>
        <small style={{ color: "#64748b", marginTop: 8, display: "block" }}>
          ⚠️ Việc này <b>không tạo tài khoản đăng nhập</b>. Người dùng cần <b>tự đăng ký</b> để có UID thật.
        </small>
      </section>

      <section>
        <h3 style={{ color: "#374151", fontWeight: 600, marginBottom: 10 }}>
          Danh sách người dùng (<code>users</code>)
        </h3>
        <div style={{ display: "grid", gap: 18 }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={cardStyle}
              onMouseOver={e => (e.currentTarget.style.boxShadow = "0 4px 18px rgba(99,102,241,0.12)")}
              onMouseOut={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(99,102,241,0.07)")}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <label style={{ color: "#6366f1", fontWeight: 500 }}>
                  Doc ID (uid): <span style={{ color: "#374151" }}>{u.id}</span>
                </label>
                <label style={{ color: "#374151" }}>
                  Email:&nbsp;
                  <input
                    style={{ ...inputStyle, width: 240, display: "inline-block" }}
                    value={u.email || ""}
                    onChange={(e) => handleEmailChange(u.id, e.target.value)}
                    disabled={busy}
                    onFocus={e => (e.target.style.border = "1.5px solid #6366f1")}
                    onBlur={e => (e.target.style.border = "1px solid #c7d2fe")}
                  />
                </label>
                <label style={{ color: "#374151" }}>
                  Role:&nbsp;
                  <select
                    style={{ ...selectStyle, minWidth: 120, display: "inline-block" }}
                    value={u.role || "user"}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={busy}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  style={resetButtonStyle}
                  onMouseOver={e => (e.target.style.background = "#6366f1")}
                  onMouseOut={e => (e.target.style.background = "#818cf8")}
                  onClick={() => resetRoleToUser(u.id)}
                  disabled={busy || isSelf(u.id)}
                >
                  Reset role → user
                </button>
                <button
                  style={buttonStyle}
                  onMouseOver={e => (e.target.style.background = "#818cf8")}
                  onMouseOut={e => (e.target.style.background = "#6366f1")}
                  onClick={() => handleRoleDelete(u.id)}
                  disabled={busy || isSelf(u.id)}
                >
                  Xóa role (delete field)
                </button>
                <button
                  style={dangerButtonStyle}
                  onMouseOver={e => (e.target.style.background = "#b91c1c")}
                  onMouseOut={e => (e.target.style.background = "#ef4444")}
                  onClick={() => handleDeleteUserDoc(u.id)}
                  disabled={busy || isSelf(u.id)}
                >
                  Xóa doc
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <i style={{ color: "#64748b", fontSize: 15 }}>Chưa có người dùng nào.</i>
          )}
        </div>
      </section>
    </div>
  );
}
