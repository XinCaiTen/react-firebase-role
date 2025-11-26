// src/pages/ChatRoom.jsx
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { sendMessage, subscribeMessages, getPrivateChatId } from "../services/chatService";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function ChatRoom() {
  const { currentUser, role } = useAuth();
  
  // State cho Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // State cho User List & Chuyển phòng
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // null = Chat chung
  
  const bottomRef = useRef(null);

  // 1. Lấy danh sách User realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Loại bỏ bản thân mình khỏi danh sách chat
      setUsers(list.filter(u => u.id !== currentUser.uid));
    });
    return () => unsub();
  }, [currentUser.uid]);

  // 2. Xác định Room ID hiện tại
  // Nếu selectedUser là null -> room "messages" (chung)
  // Nếu có chọn user -> room "uid1_uid2" (riêng)
  const currentRoomId = selectedUser 
    ? getPrivateChatId(currentUser.uid, selectedUser.id) 
    : "messages";
  
  const isPrivateMode = !!selectedUser;

  // 3. Subscribe tin nhắn mỗi khi đổi phòng
  useEffect(() => {
    setMessages([]); // Clear tin nhắn cũ khi đổi phòng
    const unsub = subscribeMessages((msgs) => {
      setMessages(msgs);
    }, currentRoomId, isPrivateMode);
    
    return () => unsub();
  }, [currentRoomId, isPrivateMode]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await sendMessage(
        { ...currentUser, role }, 
        newMessage, 
        currentRoomId, 
        isPrivateMode
      );
      setNewMessage("");
    } catch (error) {
      console.error(error);
    }
  };

  // --- STYLES ---
  const layoutStyle = {
    display: "flex",
    height: "85vh",
    maxWidth: 1000,
    margin: "20px auto",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    overflow: "hidden",
    border: "1px solid #e0e7ff"
  };

  const sidebarStyle = {
    width: "30%",
    borderRight: "1px solid #e0e7ff",
    background: "#f9fafb",
    display: "flex",
    flexDirection: "column"
  };

  const chatAreaStyle = {
    width: "70%",
    display: "flex",
    flexDirection: "column",
    background: "#fff"
  };

  const userItemStyle = (isActive) => ({
    padding: "12px 16px",
    cursor: "pointer",
    background: isActive ? "#e0e7ff" : "transparent",
    borderBottom: "1px solid #f3f4f6",
    transition: "0.2s",
    fontWeight: isActive ? "600" : "400",
    color: isActive ? "#4f46e5" : "#374151"
  });

  return (
    <div style={layoutStyle}>
      {/* --- CỘT TRÁI: DANH SÁCH USER --- */}
      <div style={sidebarStyle}>
        <div style={{ padding: 16, fontWeight: "bold", borderBottom: "1px solid #e0e7ff", background: "#fff" }}>
          Danh sách thành viên
        </div>
        
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Nút Chat Chung */}
          <div 
            style={userItemStyle(selectedUser === null)}
            onClick={() => setSelectedUser(null)}
          >
            🌐 Chat Chung (Global)
          </div>

          {/* Danh sách User */}
          {users.map(u => (
            <div 
              key={u.id} 
              style={userItemStyle(selectedUser?.id === u.id)}
              onClick={() => setSelectedUser(u)}
            >
              👉 {u.email?.split("@")[0]} 
              {u.role === 'admin' && <span style={{color:'red', fontSize: 12}}> (Admin)</span>}
            </div>
          ))}
        </div>
      </div>

      {/* --- CỘT PHẢI: KHUNG CHAT --- */}
      <div style={chatAreaStyle}>
        {/* Header */}
        <div style={{ 
          padding: "16px 24px", 
          borderBottom: "1px solid #e0e7ff", 
          background: isPrivateMode ? "#f0fdf4" : "#eef2ff", // Xanh lá nhạt cho private, xanh dương cho chung
          fontWeight: "bold",
          color: "#374151"
        }}>
          {isPrivateMode 
            ? `💬 Chat riêng với: ${selectedUser?.email}` 
            : "🌐 Phòng Chat Chung"}
        </div>

        {/* Message List */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "#f9fafb", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.length === 0 && (
            <div style={{textAlign: 'center', color: '#9ca3af', marginTop: 20}}>
              Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
            </div>
          )}
          
          {messages.map((msg) => {
            const isMe = msg.uid === currentUser?.uid;
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "70%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                }}
              >
                {!isMe && (
                  <small style={{ color: "#6b7280", marginBottom: 4, fontSize: 11 }}>
                    {msg.email?.split("@")[0]}
                  </small>
                )}
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    background: isMe 
                      ? (isPrivateMode ? "#10b981" : "#6366f1") // Màu xanh lá cho chat riêng, tím cho chat chung
                      : "#e5e7eb",
                    color: isMe ? "#fff" : "#374151",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    borderBottomRightRadius: isMe ? 2 : 12,
                    borderBottomLeftRadius: isMe ? 12 : 2,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ padding: 16, borderTop: "1px solid #e0e7ff", display: "flex", gap: 10 }}>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isPrivateMode ? `Nhắn cho ${selectedUser?.email}...` : "Nhắn cho mọi người..."}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: "1px solid #c7d2fe", outline: "none" }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            style={{
              padding: "0 24px", borderRadius: 24, border: "none",
              background: isPrivateMode ? "#10b981" : "#6366f1",
              color: "#fff", fontWeight: "600", cursor: "pointer"
            }}
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
