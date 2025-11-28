import { 
  collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, 
  doc, setDoc, updateDoc, increment, where, getDoc, deleteDoc 
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // <-- Import Storage
import { db } from "../firebase";

const storage = getStorage();

// --- 1. Helper tạo ID phòng chat ---
export function getPrivateChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// --- 2. Upload File ---
export async function uploadFile(file) {
  if (!file) return null;
  const storageRef = ref(storage, `chat_files/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// --- 3. Gửi tin nhắn (Nâng cấp: hỗ trợ File, Reply) ---
export async function sendMessage({ 
  user, 
  text = "", 
  file = null, 
  roomId, 
  isPrivate, 
  receiverId = null,
  replyTo = null // Object: { id, text, senderName }
}) {
  // Nếu không có text và không có file thì không gửi
  if (!text.trim() && !file) return;

  let fileUrl = null;
  let fileType = null;

  // Xử lý upload nếu có file
  if (file) {
    fileUrl = await uploadFile(file);
    fileType = file.type.startsWith("image/") ? "image" : "file";
  }

  const collectionRef = isPrivate 
    ? collection(db, "private_chats", roomId, "messages")
    : collection(db, "messages");

  const messageData = {
    text: text.trim(),
    uid: user.uid,
    email: user.email,
    role: user.role || "user",
    createdAt: serverTimestamp(),
    // Các trường mới
    fileUrl,
    fileType,
    fileName: file ? file.name : null,
    replyTo: replyTo ? {
      id: replyTo.id,
      text: replyTo.text || "[Hình ảnh/File]",
      senderName: replyTo.email?.split("@")[0] || "User"
    } : null,
    reactions: {} // Map: { uid: "❤️" }
  };

  await addDoc(collectionRef, messageData);

  // Cập nhật biến đếm unread (chỉ cho chat riêng)
  if (isPrivate && receiverId) {
    const roomDocRef = doc(db, "private_chats", roomId);
    await setDoc(roomDocRef, {
      users: [user.uid, receiverId],
      unread: { [receiverId]: increment(1) },
      lastMessage: file ? "[File đính kèm]" : text.trim(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
}

// --- 4. Thả cảm xúc (Reaction) ---
export async function toggleReaction(roomId, messageId, isPrivate, uid, emoji) {
  const msgRef = isPrivate 
    ? doc(db, "private_chats", roomId, "messages", messageId)
    : doc(db, "messages", messageId);

  const docSnap = await getDoc(msgRef);
  if (docSnap.exists()) {
    const currentReactions = docSnap.data().reactions || {};
    
    // Nếu đã thả emoji này rồi thì xóa (toggle off), chưa thì thêm/sửa
    if (currentReactions[uid] === emoji) {
      delete currentReactions[uid];
    } else {
      currentReactions[uid] = emoji;
    }

    await updateDoc(msgRef, { reactions: currentReactions });
  }
}

// --- 5. Các hàm cũ (Giữ nguyên) ---
export async function markAsRead(roomId, myUid) {
  if (!roomId || !myUid) return;
  const roomRef = doc(db, "private_chats", roomId);
  await updateDoc(roomRef, { [`unread.${myUid}`]: 0 }).catch(() => {});
}

export function subscribeMyRooms(myUid, callback) {
  const q = query(collection(db, "private_chats"), where("users", "array-contains", myUid));
  return onSnapshot(q, (snap) => {
    const data = {};
    snap.docs.forEach(d => {
      const r = d.data();
      const other = r.users?.find(id => id !== myUid);
      if (other) data[other] = r.unread?.[myUid] || 0;
    });
    callback(data);
  });
}

export function subscribeMessages(callback, roomId = "messages", isPrivate = false) {
  const collectionRef = isPrivate 
    ? collection(db, "private_chats", roomId, "messages")
    : collection(db, "messages");
  const q = query(collectionRef, orderBy("createdAt", "asc"), limit(100));
  return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

// --- 6. Xóa tin nhắn ---
export async function deleteMessage(messageId, roomId, isPrivate = false) {
  const msgRef = isPrivate 
    ? doc(db, "private_chats", roomId, "messages", messageId)
    : doc(db, "messages", messageId);
  
  await deleteDoc(msgRef);
}
