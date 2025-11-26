// src/pages/ChatRoom.jsx
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { sendMessage, subscribeMessages } from "../services/chatService";

export default function ChatRoom() {
  const { currentUser, role } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef(null); // Dùng để auto scroll xuống cuối

  // Subscribe tin nhắn khi component mount
  useEffect(() => {
    const unsub = subscribeMessages((msgs) => {
      setMessages(msgs);
    });
    return () => unsub(); // Cleanup khi rời trang
  }, []);

  // Auto scroll mỗi khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Gửi tin nhắn (Firestore onSnapshot sẽ tự update UI ngay lập tức)
      await sendMessage({ ...currentUser, role }, newMessage);
      setNewMessage(""); // Clear ô input
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  // Style cơ bản
  const containerStyle = {
    maxWidth: 800,
    margin: "30px auto",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    height: "80vh", // Chiều cao cố định để scroll
    border: "1px solid #e0e7ff",
    overflow: "hidden",
  };

  const headerStyle = {
    padding: "16px 24px",
    borderBottom: "1px solid #e0e7ff",
    background: "linear-gradient(90deg, #e0e7ff 0%, #f3f4f6 100%)",
    color: "#4f46e5",
    fontWeight: "bold",
    fontSize: 18,
  };

  const messageListStyle = {
    flex: 1,
    padding: 20,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: "#f9fafb",
  };

  const inputAreaStyle = {
    padding: 16,
    borderTop: "1px solid #e0e7ff",
    background: "#fff",
    display: "flex",
    gap: 10,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>💬 Phòng Chat Chung</div>

      <div style={messageListStyle}>
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
              {/* Tên người gửi (chỉ hiện nếu không phải là mình) */}
              {!isMe && (
                <small style={{ color: "#6b7280", marginBottom: 4, fontSize: 12 }}>
                  {msg.email?.split("@")[0]} 
                  {msg.role === 'admin' && <span style={{color: 'red', fontWeight: 'bold'}}> (Admin)</span>}
                </small>
              )}

              {/* Bong bóng chat */}
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: isMe
                    ? "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)" // Màu giống theme của bạn
                    : "#e5e7eb",
                  color: isMe ? "#fff" : "#374151",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  borderBottomRightRadius: isMe ? 2 : 12,
                  borderBottomLeftRadius: isMe ? 12 : 2,
                  wordBreak: "break-word",
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={inputAreaStyle}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 24,
            border: "1px solid #c7d2fe",
            outline: "none",
            fontSize: 15,
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            padding: "0 24px",
            borderRadius: 24,
            border: "none",
            background: "#6366f1",
            color: "#fff",
            fontWeight: "600",
            cursor: "pointer",
            transition: "background 0.2s",
            opacity: !newMessage.trim() ? 0.6 : 1,
          }}
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
