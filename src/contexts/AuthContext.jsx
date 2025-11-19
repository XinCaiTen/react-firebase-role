// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ensureUserDoc, getUserRole } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // lấy role từ Firestore
        const r = await getUserRole(user.uid);
        setRole(r || "user");
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // tạo doc user mặc định role = 'user'
    await ensureUserDoc(cred.user.uid, { email, role: "user" });
    return cred;
  };

  const logout = () => signOut(auth);

  const value = { currentUser, role, login, register, logout, loading };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
