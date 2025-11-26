// src/services/chatService.js
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

// Tên collection trong Firestore
const ROOM_NAME = "messages"; 

/**
 * Gửi tin nhắn mới lên Firestore
 * @param {object} user - Object user hiện tại (uid, email...)
 * @param {string} text - Nội dung tin nhắn
 */
export async function sendMessage(user, text) {
  if (!text.trim()) return;

  await addDoc(collection(db, ROOM_NAME), {
    text: text.trim(),
    uid: user.uid,
    email: user.email, // Lưu email để hiển thị tên người gửi
    role: user.role || "user", // Lưu role để hiển thị màu sắc (nếu cần)
    createdAt: serverTimestamp(), // Dùng giờ server để sắp xếp chuẩn xác
  });
}

/**
 * Lắng nghe tin nhắn realtime
 * @param {function} callback - Hàm set state ở component để update UI
 * @returns {function} - Hàm unsubscribe để huỷ lắng nghe khi component unmount
 */
export function subscribeMessages(callback) {
  // Lấy 100 tin nhắn gần nhất, sắp xếp theo thời gian tăng dần
  const q = query(
    collection(db, ROOM_NAME),
    orderBy("createdAt", "asc"),
    limit(100)
  );

  // onSnapshot giúp nhận dữ liệu realtime mỗi khi có thay đổi trên DB
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages);
  });
}
