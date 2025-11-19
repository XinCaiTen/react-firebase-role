// src/services/roleService.js
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove,
  collection, query, where, getDocs, writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

const rolesDocRef = doc(db, "settings", "roles");

/** Đảm bảo doc roles tồn tại & luôn có sẵn vài role cơ bản */
export async function ensureDefaultRoles() {
  const snap = await getDoc(rolesDocRef);
  if (!snap.exists()) {
    await setDoc(rolesDocRef, { roles: ["admin", "user", "quality"] });
    return ["admin", "user", "quality"];
  }
  const data = snap.data() || {};
  const roles = Array.isArray(data.roles) ? data.roles : [];
  return roles.length ? roles : ["admin", "user", "quality"];
}

export async function getRoles() {
  const snap = await getDoc(rolesDocRef);
  return snap.exists() ? (snap.data().roles || []) : [];
}

/** Thêm role mới (VD: operator). Cấm tạo 'admin'. */
export async function addRole(role) {
  const name = (role || "").trim();
  if (!name) throw new Error("Tên role không được rỗng.");
  if (name.toLowerCase() === "admin") throw new Error("Không thể tạo role 'admin'.");
  const snap = await getDoc(rolesDocRef);
  const roles = snap.exists() ? (snap.data().roles || []) : [];
  if (roles.includes(name)) throw new Error("Role đã tồn tại.");
  await updateDoc(rolesDocRef, { roles: arrayUnion(name) }).catch(async () => {
    await setDoc(rolesDocRef, { roles: [name] }, { merge: true });
  });
  return name;
}

/** Đổi tên role + migrate tất cả user có role cũ sang role mới */
export async function renameRole(oldRole, newRole) {
  const from = (oldRole || "").trim();
  const to = (newRole || "").trim();
  if (!from || !to) throw new Error("Tên role không hợp lệ.");
  if (from === to) return { updated: 0 };
  if (from === "admin") throw new Error("Không thể đổi tên role 'admin'.");
  if (to === "admin") throw new Error("Không thể đổi tên thành 'admin'.");

  const rolesSnap = await getDoc(rolesDocRef);
  const roles = rolesSnap.exists() ? (rolesSnap.data().roles || []) : [];
  if (!roles.includes(from)) throw new Error("Role cũ không tồn tại.");
  if (roles.includes(to)) throw new Error("Role mới đã tồn tại.");

  // migrate users
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", from));
  const snap = await getDocs(q);
  const docs = snap.docs;

  const CHUNK = 450; // an toàn < 500 update/batch
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    docs.slice(i, i + CHUNK).forEach((d) => batch.update(d.ref, { role: to }));
    await batch.commit();
  }

  // cập nhật danh sách roles
  await updateDoc(rolesDocRef, { roles: arrayUnion(to) });
  await updateDoc(rolesDocRef, { roles: arrayRemove(from) });

  return { updated: docs.length };
}

/** Xoá role khi KHÔNG còn user nào dùng; cấm xoá 'admin' */
export async function deleteRoleCompletely(role) {
  const name = (role || "").trim();
  if (!name) throw new Error("Role không hợp lệ.");
  if (name === "admin") throw new Error("Không thể xoá role 'admin'.");

  // kiểm tra còn user dùng role này không
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", name));
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error(`Không thể xoá vì còn ${snap.size} người dùng đang dùng role '${name}'.`);
  }

  await updateDoc(rolesDocRef, { roles: arrayRemove(name) });
  return name;
}
