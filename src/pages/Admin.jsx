// src/pages/Admin.jsx
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
  const [roles, setRoles] = useState(["admin", "user", "quality"]); // default nếu doc chưa có

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
          // nếu chưa có, khởi tạo doc roles mặc định
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

  // Thêm doc user (placeholder) — KHÔNG tạo tài khoản Auth
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
  // ========= RENDER =========
  return (
    <div style={{ padding: 24 }}>
      <h2>Khu vực Admin</h2>
      {err && (
        <div style={{ color: err.startsWith("Đổi") ? "green" : "crimson", marginBottom: 12 }}>
          {err}
        </div>
      )}

      {/* ======= SECTION: QUẢN LÝ NGƯỜI DÙNG ======= */}
      <section style={{ margin: "24px 0" }}>
        <h3>Thêm/Sửa document người dùng</h3>
        <form onSubmit={handleAddUserDoc} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
          <input
            placeholder="UID (nếu người dùng đã đăng ký Auth). Để trống nếu muốn tạo ID tự sinh."
            value={newUser.uid}
            onChange={(e) => setNewUser((s) => ({ ...s, uid: e.target.value }))}
          />
          <input
            placeholder="Email (tuỳ chọn)"
            value={newUser.email}
            onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))}
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser((s) => ({ ...s, role: e.target.value }))}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy}>
            Thêm/Sửa doc
          </button>
        </form>
        <small>
          ⚠️ Việc này <b>không tạo tài khoản đăng nhập</b>. Người dùng cần <b>tự đăng ký</b> để có UID thật.
        </small>
      </section>

      <section>
        <h3>Danh sách người dùng (collection: <code>users</code>)</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {users.map((u) => (
            <div key={u.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label>
                  <b>Doc ID (uid):</b> {u.id}
                </label>

                <label>
                  Email:&nbsp;
                  <input
                    value={u.email || ""}
                    onChange={(e) => handleEmailChange(u.id, e.target.value)}
                    style={{ width: 280 }}
                  />
                </label>

                <label>
                  Role:&nbsp;
                  <select
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

              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => resetRoleToUser(u.id)} disabled={busy || isSelf(u.id)}>
                  Reset role → user
                </button>
                <button onClick={() => handleRoleDelete(u.id)} disabled={busy || isSelf(u.id)}>
                  Xóa role (delete field)
                </button>
                <button
                  onClick={() => handleDeleteUserDoc(u.id)}
                  disabled={busy || isSelf(u.id)}
                  style={{ color: "#b00" }}
                >
                  Xóa doc
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && <i>Chưa có người dùng nào.</i>}
        </div>
      </section>
    </div>
  );
}
