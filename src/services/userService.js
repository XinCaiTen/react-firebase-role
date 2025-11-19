// src/services/userService.js
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const userRef = (uid) => doc(db, "users", uid);

export async function ensureUserDoc(uid, data = {}) {
  const ref = userRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      role: "user",
      createdAt: serverTimestamp(),
      ...data,
    });
  }
}

export async function getUserRole(uid) {
  const snap = await getDoc(userRef(uid));
  if (snap.exists()) {
    return snap.data().role;
  }
  return null;
}

// (Tuỳ chọn) chỉ dùng bởi admin để đổi role
export async function setUserRole(uid, role) {
  await updateDoc(userRef(uid), { role });
}
