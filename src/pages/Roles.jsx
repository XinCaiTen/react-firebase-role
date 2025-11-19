// src/pages/Roles.jsx
import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  ensureDefaultRoles,
  addRole,
  renameRole,
  deleteRoleCompletely
} from "../services/roleService";

export default function Roles() {
  const { role } = useAuth();
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    const ref = doc(db, "settings", "roles");
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        const defaults = await ensureDefaultRoles();
        setRoles(defaults);
      } else {
        const data = snap.data() || {};
        setRoles(Array.isArray(data.roles) ? data.roles : []);
      }
    }, (e) => setMsg(e.message));
    return () => unsub();
  }, []);

  const nonAdminRoles = useMemo(() => roles.filter(r => r !== "admin"), [roles]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      setBusy(true);
      await addRole(newRole);
      setNewRole("");
      setMsg("Thêm role mới thành công.");
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditValue(roles[idx] || "");
  };
  const cancelEdit = () => { setEditIdx(null); setEditValue(""); };

  const commitEdit = async () => {
    if (editIdx == null) return;
    const oldRole = roles[editIdx];
    const newVal = editValue.trim();
    if (!newVal || newVal === oldRole) { cancelEdit(); return; }
    setMsg("");
    try {
      setBusy(true);
      const { updated } = await renameRole(oldRole, newVal);
      setMsg(`Đổi '${oldRole}' → '${newVal}' thành công. Đã cập nhật ${updated} user.`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
      cancelEdit();
    }
  };

  const removeRole = async (r) => {
    if (!confirm(`Xoá role '${r}'?`)) return;
    setMsg("");
    try {
      setBusy(true);
      await deleteRoleCompletely(r);
      setMsg(`Đã xoá role '${r}'.`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Quản lý loại Role</h2>
      <p>Thêm, đổi tên, xoá các loại role hệ thống. (Role <b>admin</b> không thể đổi tên hoặc xoá)</p>
      <section style={{ marginTop: 16 }}>
        <h3>Thêm role mới</h3>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, maxWidth: 520 }}>
          <input
            placeholder="Tên role (ví dụ: operator)"
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            disabled={busy}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={busy}>Thêm</button>
        </form>
        <small>Gợi ý: đặt tên chữ thường, không dấu, không khoảng trắng.</small>
      </section>
      {msg && <div style={{ margin: "12px 0", color: /thành công|Đã/.test(msg) ? "green" : "crimson" }}>{msg}</div>}

      <section style={{ margin: "16px 0" }}>
        <h3>Danh sách role</h3>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8, maxWidth: 520 }}>
          {roles.map((r, idx) => (
            <li key={r} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
              {editIdx === idx ? (
                <>
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    disabled={busy}
                    style={{ flex: 1 }}
                  />
                  <button onClick={commitEdit} disabled={busy}>Lưu</button>
                  <button onClick={cancelEdit} disabled={busy}>Huỷ</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>
                    {r === "admin" ? <b>{r}</b> : r}
                  </span>
                  {r !== "admin" && (
                    <>
                      <button onClick={() => startEdit(idx)} disabled={busy}>Đổi tên</button>
                      <button onClick={() => removeRole(r)} disabled={busy} style={{ color: "#b00" }}>Xoá</button>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
          {roles.length === 0 && <i>Chưa có role nào.</i>}
        </ul>
      </section>
    </div>
  );
}