// src/services/chatService.js
import { 
  collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Tạo ID phòng chat riêng giữa 2 người
 * Luôn sắp xếp ID để A chat với B giống B chat với A
 */
export function getPrivateChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

/**
 * Gửi tin nhắn (Hỗ trợ cả chat chung và riêng)
 * @param {string} roomId - ID của phòng (VD: "messages" hoặc "uidA_uidB")
 * @param {boolean} isPrivate - Có phải chat riêng không?
 */
export async function sendMessage(user, text, roomId = "messages", isPrivate = false) {
  if (!text.trim()) return;

  // Nếu là chat riêng, path là: private_chats/{roomId}/messages
  // Nếu là chat chung, path là: messages (như cũ)
  const collectionRef = isPrivate 
    ? collection(db, "private_chats", roomId, "messages")
    : collection(db, "messages");

  await addDoc(collectionRef, {
    text: text.trim(),
    uid: user.uid,
    email: user.email,
    role: user.role || "user",
    createdAt: serverTimestamp(),
  });
}

/**
 * Lắng nghe tin nhắn realtime theo phòng
 */
export function subscribeMessages(callback, roomId = "messages", isPrivate = false) {
  const collectionRef = isPrivate 
    ? collection(db, "private_chats", roomId, "messages")
    : collection(db, "messages");

  const q = query(
    collectionRef,
    orderBy("createdAt", "asc"),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages);
  });
}
