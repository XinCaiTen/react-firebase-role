import { useEffect, useState, useRef, memo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  sendMessage,
  subscribeMessages,
  getPrivateChatId,
  markAsRead,
  subscribeMyRooms,
  toggleReaction,
  deleteMessage,
} from "../services/chatService";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import EmojiPicker from "emoji-picker-react";

// --- HÀM HELPER ---
const formatDateDivider = (dateObj) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const date = new Date(dateObj);
  if (date.toDateString() === today.toDateString()) return "Hôm nay";
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
};

const getFileIcon = (fileName) => {
  if (!fileName) return "📄";
  const ext = fileName.split(".").pop().toLowerCase();
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["pdf"].includes(ext)) return "📕";
  if (["zip", "rar", "7z"].includes(ext)) return "📦";
  return "📄";
};

const isAudio = (fileName) => /\.(mp3|wav|ogg|m4a)$/i.test(fileName);
const isVideo = (fileName) => /\.(mp4|mov|webm|mkv)$/i.test(fileName);

const renderMessageContent = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const youtubeMatch = part.match(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        return (
          <div
            key={index}
            style={{
              marginTop: 8,
              marginBottom: 8,
              width: "100%",
              minWidth: "250px",
            }}
          >
            <a
              href={part}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "inherit",
                textDecoration: "underline",
                fontSize: 12,
              }}
            >
              {part}
            </a>
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
                borderRadius: 8,
                marginTop: 4,
                maxWidth: window.innerWidth <= 768 ? "280px" : "100%",
              }}
            >
              <iframe
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: 0,
                }}
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allowFullScreen
              />
            </div>
          </div>
        );
      }
      if (part.match(/\.(mp3|wav|ogg)$/i)) {
        return (
          <div key={index} style={{ marginTop: 8, marginBottom: 8 }}>
            <a
              href={part}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "inherit",
                textDecoration: "underline",
                fontSize: 12,
              }}
            >
              {part}
            </a>
            <audio
              controls
              style={{
                width: "100%",
                marginTop: 4,
                borderRadius: 20,
                height: 30,
              }}
            >
              <source src={part} type="audio/mpeg" />
            </audio>
          </div>
        );
      }
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "inherit",
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

// --- MESSAGE ITEM ---
const MessageItem = memo(
  ({
    msg,
    currentUser,
    isPrivateMode,
    scrollToMessage,
    setReplyTo,
    handleReaction,
    users,
    currentRoomId,
    onDeleteMessage,
  }) => {
    const isMe = msg.uid === currentUser?.uid;
    const [isHovering, setIsHovering] = useState(false);
    const [isHoveringReaction, setIsHoveringReaction] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const reactionsList = ["👍", "❤️", "😂", "😮", "😢", "😡"];

    const groupReactions = (reactions) => {
      if (!reactions) return {};
      const grouped = {};
      Object.values(reactions).forEach((emoji) => {
        grouped[emoji] = (grouped[emoji] || 0) + 1;
      });
      return grouped;
    };

    const handleCopy = () => {
      navigator.clipboard.writeText(msg.text || "");
      alert("Copied to clipboard!");
    };

    const handleShare = () => {
      setShowSharePopup(true);
      setShowMenu(false);
    };

    const handleDelete = () => {
      if (window.confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) {
        onDeleteMessage(msg.id);
        setShowMenu(false);
      }
    };

    const groupedReactions = groupReactions(msg.reactions);
    const hasReactions = Object.keys(groupedReactions).length > 0;

    const SharePopup = ({ users, onClose, onShare }) => {
      const [selectedUsers, setSelectedUsers] = useState([]);
    
      const toggleUserSelection = (userId) => {
        setSelectedUsers((prev) =>
          prev.includes(userId)
            ? prev.filter((id) => id !== userId)
            : [...prev, userId]
        );
      };
    
      return (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={onClose}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              width: 400,
              maxHeight: "80vh",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: "600" }}>
              Chia sẻ tin nhắn
            </h3>
            <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 16 }}>
              {users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 0",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    style={{ marginRight: 8 }}
                  />
                  <span>👤 {user.email?.split("@")[0]}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  padding: "8px 16px",
                  background: "#e5e7eb",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => onShare(selectedUsers)}
                disabled={selectedUsers.length === 0}
                style={{
                  padding: "8px 16px",
                  background: selectedUsers.length > 0 ? "#6366f1" : "#9ca3af",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: selectedUsers.length > 0 ? "pointer" : "not-allowed",
                  fontSize: 14,
                }}
              >
                Chia sẻ ({selectedUsers.length})
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div
        id={`msg-${msg.id}`}
        style={{
          alignSelf: isMe ? "flex-end" : "flex-start",
          maxWidth: window.innerWidth <= 768 ? "90%" : "75%",
          display: "flex",
          flexDirection: "column",
          alignItems: isMe ? "flex-end" : "flex-start",
          position: "relative",
          marginBottom: hasReactions ? (window.innerWidth <= 768 ? 25 : 30) : (window.innerWidth <= 768 ? 12 : 16),
          opacity: msg.isTemp ? 0.7 : 1,
          paddingLeft: isMe ? (window.innerWidth <= 768 ? 20 : 40) : 0,
          paddingRight: !isMe ? (window.innerWidth <= 768 ? 20 : 40) : 0,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setIsHoveringReaction(false);
          setShowMenu(false);
        }}
      >
        {!isMe && (
          <small style={{ color: "#6b7280", fontSize: 11, marginBottom: 2 }}>
            {msg.email?.split("@")[0]}
          </small>
        )}

        {msg.replyTo && (
          <div
            onClick={() => scrollToMessage(msg.replyTo.id)}
            style={{
              background: isMe ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.05)",
              padding: "6px 10px",
              borderRadius: 8,
              marginBottom: 4,
              fontSize: 12,
              borderLeft: "3px solid #205bc0ff",
              width: "100%",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontWeight: "bold",
                color: isMe ? "#921042ff" : "#4b5563",
              }}
            >
              {msg.replyTo.senderName === currentUser.email
                ? "Bạn"
                : msg.replyTo.senderName?.split("@")[0]}
            </span>
            <span
              style={{
                color: isMe ? "#355f9eff" : "#292b30ff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "200px",
              }}
            >
              {msg.replyTo.fileType === "image"
                ? "[Hình ảnh]"
                : msg.replyTo.fileName || msg.replyTo.text || "[File]"}
            </span>
          </div>
        )}

        <div
          style={{
            padding: window.innerWidth <= 768 ? "8px 12px" : "10px 14px",
            borderRadius: window.innerWidth <= 768 ? 16 : 12,
            background: isMe
              ? isPrivateMode
                ? "#10b981"
                : "#6366f1"
              : "#e5e7eb",
            color: isMe ? "#fff" : "#374151",
            position: "relative",
            minWidth: msg.fileType === "image" ? (window.innerWidth <= 768 ? "120px" : "150px") : "auto",
            minHeight: msg.fileType === "image" ? (window.innerWidth <= 768 ? "80px" : "100px") : "auto",
            fontSize: window.innerWidth <= 768 ? 14 : 16,
            wordBreak: "break-word",
            maxWidth: "100%",
          }}
        >
          {msg.fileType === "image" && (
            <div
              style={{ position: "relative", marginBottom: msg.text ? 8 : 0 }}
            >
              {!imageLoaded && (
                <div
                  style={{
                    width: "200px",
                    height: "150px",
                    background: "#e0e7ff",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#6366f1" }}>
                    Loading...
                  </span>
                </div>
              )}
              <img
                src={msg.fileUrl}
                alt="attachment"
                onLoad={() => setImageLoaded(true)}
                style={{
                  display: imageLoaded ? "block" : "none",
                  maxWidth: window.innerWidth <= 768 ? "200px" : "250px",
                  maxHeight: window.innerWidth <= 768 ? "200px" : "250px",
                  objectFit: "cover",
                  borderRadius: 8,
                  cursor: "pointer",
                  width: "100%",
                  height: "auto",
                }}
                onClick={() => window.open(msg.fileUrl, "_blank")}
              />
            </div>
          )}

          {msg.fileType === "file" && (
            <div style={{ marginBottom: msg.text ? 8 : 0 }}>
              {isVideo(msg.fileName) ? (
                <div style={{ maxWidth: "300px" }}>
                  <video
                    controls
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      maxHeight: window.innerWidth <= 768 ? "200px" : "300px",
                      maxWidth: "100%",
                    }}
                  >
                    <source src={msg.fileUrl} />
                  </video>
                  <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>
                    🎥 {msg.fileName}
                  </div>
                </div>
              ) : isAudio(msg.fileName) ? (
                <div style={{ minWidth: "250px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🎵</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: "bold",
                        wordBreak: "break-all",
                      }}
                    >
                      {msg.fileName}
                    </span>
                  </div>
                  <audio
                    controls
                    style={{
                      width: "100%",
                      height: window.innerWidth <= 768 ? "40px" : "30px",
                      borderRadius: "15px",
                      maxWidth: "100%",
                    }}
                  >
                    <source src={msg.fileUrl} />
                  </audio>
                </div>
              ) : (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: isMe ? "#fff" : "#1f2937",
                    textDecoration: "none",
                    background: isMe ? "rgba(255,255,255,0.2)" : "#fff",
                    padding: "8px 12px",
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 24 }}>
                    {getFileIcon(msg.fileName)}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: 13,
                        wordBreak: "break-all",
                      }}
                    >
                      {msg.fileName}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>
                      Nhấn để tải về
                    </span>
                  </div>
                </a>
              )}
            </div>
          )}

          <div style={{ wordBreak: "break-word" }}>
            {renderMessageContent(msg.text)}
          </div>

          {hasReactions && (
            <div
              style={{
                position: "absolute",
                bottom: -12,
                right: isMe ? 0 : "auto",
                left: !isMe ? 0 : "auto",
                background: "#fff",
                borderRadius: 12,
                padding: "2px 6px",
                fontSize: 11,
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: 2,
                zIndex: 10,
              }}
            >
              {Object.entries(groupedReactions).map(([emoji, count]) => (
                <span
                  key={emoji}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  {emoji}{" "}
                  {count > 1 && (
                    <span
                      style={{
                        marginLeft: 2,
                        fontWeight: "bold",
                        color: "#374151",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}

          {!msg.isTemp && (isHovering || isHoveringReaction) && (
            <div
              style={{
                position: "absolute",
                bottom: hasReactions ? -25 : -15,
                right: isMe ? (hasReactions ? 0 : -5) : "auto",
                left: !isMe ? (hasReactions ? 0 : -5) : "auto",
                zIndex: 100,
                paddingTop: 10,
                marginTop: -10,
                display: "flex",
                justifyContent: isMe ? "flex-end" : "flex-start",
              }}
              onMouseEnter={() => setIsHoveringReaction(true)}
              onMouseLeave={() => setIsHoveringReaction(false)}
            >
              {isHoveringReaction ? (
                <div
                  style={{
                    background: "#1f2937",
                    padding: window.innerWidth <= 768 ? "6px 10px" : "4px 8px",
                    borderRadius: 50,
                    display: "flex",
                    gap: window.innerWidth <= 768 ? 12 : 8,
                    alignItems: "center",
                    animation: "fadeIn 0.2s",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                    flexWrap: window.innerWidth <= 768 ? "wrap" : "nowrap",
                  }}
                >
                  {reactionsList.map((emoji) => (
                    <span
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(msg.id, emoji);
                        setIsHoveringReaction(false);
                        setIsHovering(false);
                      }}
                      style={{
                        cursor: "pointer",
                        fontSize: window.innerWidth <= 768 ? 24 : 20,
                        transition: "transform 0.1s",
                        padding: window.innerWidth <= 768 ? "4px" : "2px",
                        minWidth: window.innerWidth <= 768 ? "32px" : "auto",
                        minHeight: window.innerWidth <= 768 ? "32px" : "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.transform = "scale(1.3)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "scale(1)")
                      }
                    >
                      {emoji}
                    </span>
                  ))}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyTo({
                        id: msg.id,
                        text: msg.text,
                        senderName: msg.email || "Người dùng",
                        fileType: msg.fileType,
                        fileName: msg.fileName,
                      });
                      setIsHoveringReaction(false);
                      setIsHovering(false);
                      document
                        .querySelector('input[placeholder="Nhập tin nhắn..."]')
                        ?.focus();
                    }}
                    style={{
                      cursor: "pointer",
                      fontSize: 18,
                      color: "#fff",
                      marginLeft: 4,
                    }}
                    title="Trả lời"
                  >
                    ↩️
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#374151",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    color: "#9ca3af",
                    fontSize: 12,
                    border: "1px solid #4b5563",
                  }}
                >
                  👍
                </div>
              )}
            </div>
          )}
        </div>
        {msg.isTemp && (
          <div
            style={{
              fontSize: 10,
              color: "#9ca3af",
              marginTop: 2,
              textAlign: "right",
            }}
          >
            Đang gửi...
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: 0,
            transform: isMe ?"" : "translateY(50%)",
            right: isMe ? (hasReactions ? 0 : -5) : "auto",
            left: !isMe ? (hasReactions ? 0 : -5) : "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 100,
          }}
        >
          {isHovering && (
            <div
              style={{
                background: "#fff",
                padding: "4px 8px",
                borderRadius: 8,
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
              onClick={() => setShowMenu((prev) => !prev)}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                }}
              >
                ⋮
              </span>
            </div>
          )}

          {showMenu && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                padding: window.innerWidth <= 768 ? 12 : 8,
                position: "absolute",
                top: window.innerWidth <= 768 ? 35 : 30,
                right: isMe ? 0 : "auto",
                left: !isMe ? 0 : "auto",
                zIndex: 100,
                minWidth: window.innerWidth <= 768 ? 140 : 120,
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  padding: window.innerWidth <= 768 ? "12px 16px" : "8px 12px",
                  cursor: "pointer",
                  fontSize: window.innerWidth <= 768 ? 16 : 14,
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: window.innerWidth <= 768 ? "44px" : "auto",
                }}
                onClick={() => setReplyTo(msg)}
              >
                <span>↩️</span> Trả lời
              </div>
              <div
                style={{
                  padding: window.innerWidth <= 768 ? "12px 16px" : "8px 12px",
                  cursor: "pointer",
                  fontSize: window.innerWidth <= 768 ? 16 : 14,
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: window.innerWidth <= 768 ? "44px" : "auto",
                }}
                onClick={handleShare}
              >
                <span>📤</span> Chia sẻ
              </div>
              <div
                style={{
                  padding: window.innerWidth <= 768 ? "12px 16px" : "8px 12px",
                  cursor: "pointer",
                  fontSize: window.innerWidth <= 768 ? 16 : 14,
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: window.innerWidth <= 768 ? "44px" : "auto",
                }}
                onClick={handleCopy}
              >
                <span>📋</span> Sao chép
              </div>
              {isMe && (
                <div
                  style={{
                    padding: window.innerWidth <= 768 ? "12px 16px" : "8px 12px",
                    cursor: "pointer",
                    fontSize: window.innerWidth <= 768 ? 16 : 14,
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minHeight: window.innerWidth <= 768 ? "44px" : "auto",
                  }}
                  onClick={handleDelete}
                >
                  <span>🗑️</span> Xóa
                </div>
              )}
            </div>
          )}
        </div>
        
        {showSharePopup && (
          <SharePopup
            users={users}
            onClose={() => setShowSharePopup(false)}
            onShare={async (selectedUsers) => {
              if (selectedUsers.length > 0) {
                try {
                  // Tạo tin nhắn chia sẻ
                  const sharedMessage = `📤 Tin nhắn được chia sẻ từ ${currentUser.email?.split("@")[0]}:\n\n${msg.text || "[Hình ảnh/File]"}`;
                  
                  // Gửi đến từng user được chọn
                  for (const userId of selectedUsers) {
                    const privateChatId = getPrivateChatId(currentUser.uid, userId);
                    await sendMessage({
                      user: currentUser,
                      text: sharedMessage,
                      roomId: privateChatId,
                      isPrivate: true,
                      receiverId: userId
                    });
                  }
                  
                  const userNames = users
                    .filter(user => selectedUsers.includes(user.id))
                    .map(user => user.email?.split("@")[0])
                    .join(", ");
                  alert(`Tin nhắn đã được chia sẻ với: ${userNames}`);
                } catch (error) {
                  console.error("Lỗi chia sẻ:", error);
                  alert("Có lỗi xảy ra khi chia sẻ tin nhắn");
                }
              }
              setShowSharePopup(false);
            }}
          />
        )}
      </div>
    );
  }
);

// --- MAIN COMPONENT ---
export default function ChatRoom() {
  const { currentUser, role } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadMap, setUnreadMap] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isHoveringPreview, setIsHoveringPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- SỬA LỖI CUỘN: LƯU SỐ LƯỢNG TIN NHẮN CŨ ---
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.id !== currentUser.uid)
      );
    });
    return () => unsub();
  }, [currentUser.uid]);

  useEffect(() => {
    const unsub = subscribeMyRooms(currentUser.uid, setUnreadMap);
    return () => unsub();
  }, [currentUser.uid]);

  const currentRoomId = selectedUser
    ? getPrivateChatId(currentUser.uid, selectedUser.id)
    : "messages";
  const isPrivateMode = !!selectedUser;

  useEffect(() => {
    setMessages([]);
    setNewMessage("");
    setFile(null);
    setReplyTo(null);
    setPreviewUrl(null);
    prevMessagesLength.current = 0; // Reset khi đổi phòng
    if (isPrivateMode) markAsRead(currentRoomId, currentUser.uid);
    const unsub = subscribeMessages(
      (msgs) => {
        setMessages(msgs);
        if (isPrivateMode) markAsRead(currentRoomId, currentUser.uid);
      },
      currentRoomId,
      isPrivateMode
    );
    return () => unsub();
  }, [currentRoomId, isPrivateMode, currentUser.uid]);

  // --- LOGIC SMART SCROLL ---
  useEffect(() => {
    // 1. Nếu số lượng tin nhắn tăng lên (có tin mới) -> Scroll
    if (messages.length > prevMessagesLength.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // 2. Nếu đang preview ảnh (người dùng mới chọn ảnh) -> Scroll để thấy chỗ soạn thảo
    else if (previewUrl) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    // Cập nhật lại độ dài để so sánh lần sau
    prevMessagesLength.current = messages.length;
  }, [messages, previewUrl]);

  const scrollToMessage = (msgId) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element)
      element.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };
  const processFile = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processFile(files[0]);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        processFile(items[i].getAsFile());
        e.preventDefault();
        return;
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;
    const tempId = Date.now().toString();
    const tempMsg = {
      id: tempId,
      text: newMessage,
      uid: currentUser.uid,
      createdAt: { seconds: Date.now() / 1000 },
      fileUrl: previewUrl,
      fileType: file?.type.startsWith("image/")
        ? "image"
        : file
        ? "file"
        : null,
      fileName: file?.name,
      isTemp: true,
      replyTo: replyTo,
    };
    setMessages((prev) => [...prev, tempMsg]);
    const msgToSend = newMessage;
    const fileToSend = file;
    const replyToSend = replyTo;
    setNewMessage("");
    setFile(null);
    setPreviewUrl(null);
    setReplyTo(null);
    setShowEmoji(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(true);
    try {
      await sendMessage({
        user: { ...currentUser, role },
        text: msgToSend,
        file: fileToSend,
        roomId: currentRoomId,
        isPrivate: isPrivateMode,
        receiverId: selectedUser?.id,
        replyTo: replyToSend,
      });
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setUploading(false);
    }
  };

  const handleReaction = (msgId, emoji) => {
    toggleReaction(currentRoomId, msgId, isPrivateMode, currentUser.uid, emoji);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId, currentRoomId, isPrivateMode);
    } catch (error) {
      console.error("Lỗi xóa tin nhắn:", error);
      alert("Có lỗi xảy ra khi xóa tin nhắn");
    }
  };

  // Mobile detection and responsive hooks
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  const handleResize = useCallback(() => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    setShowSidebar(!mobile);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const layoutStyle = {
    display: "flex",
    height: isMobile ? "100vh" : "85vh",
    maxWidth: isMobile ? "100%" : 1000,
    margin: isMobile ? "0" : "20px auto",
    background: "#fff",
    borderRadius: isMobile ? 0 : 16,
    boxShadow: isMobile ? "none" : "0 4px 20px rgba(0,0,0,0.1)",
    overflow: "hidden",
    border: isMobile ? "none" : "1px solid #e0e7ff",
    position: "relative",
    flexDirection: isMobile ? "column" : "row",
  };
  const sidebarStyle = {
    width: isMobile ? "100%" : "30%",
    height: isMobile ? (showSidebar ? "50%" : "60px") : "100%",
    borderRight: isMobile ? "none" : "1px solid #e0e7ff",
    borderBottom: isMobile ? "1px solid #e0e7ff" : "none",
    background: "#f9fafb",
    display: showSidebar || !isMobile ? "flex" : "none",
    flexDirection: "column",
    position: isMobile ? "relative" : "static",
    zIndex: isMobile ? 10 : 1,
  };

  return (
    <div
      style={layoutStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(99, 102, 241, 0.1)",
            zIndex: 999,
            border: "3px dashed #6366f1",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px 40px",
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              fontWeight: "bold",
              color: "#6366f1",
            }}
          >
            📂 Thả file vào đây để gửi
          </div>
        </div>
      )}
      <div style={sidebarStyle}>
        <div
          style={{
            padding: isMobile ? 12 : 16,
            fontWeight: "bold",
            borderBottom: "1px solid #e0e7ff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: isMobile ? 14 : 16,
          }}
        >
          <span>Danh sách thành viên</span>
          {isMobile && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              {showSidebar ? "▲" : "▼"}
            </button>
          )}
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          <div
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              background: !selectedUser ? "#e0e7ff" : "transparent",
            }}
            onClick={() => setSelectedUser(null)}
          >
            <span>🌐 Chat Chung</span>
          </div>
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                background:
                  selectedUser?.id === u.id ? "#e0e7ff" : "transparent",
                display: "flex",
                justifyContent: "space-between",
              }}
              onClick={() => setSelectedUser(u)}
            >
              <span>👤 {u.email?.split("@")[0]}</span>
              {selectedUser?.id !== u.id && unreadMap[u.id] > 0 && (
                <span
                  style={{
                    background: "red",
                    color: "white",
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 10,
                  }}
                >
                  {unreadMap[u.id]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          width: isMobile ? "100%" : "70%",
          height: isMobile ? (showSidebar ? "50%" : "calc(100% - 60px)") : "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          flex: isMobile ? 1 : "none",
        }}
      >
        <div
          style={{
            padding: isMobile ? "12px 16px" : "16px 24px",
            borderBottom: "1px solid #e0e7ff",
            background: isPrivateMode ? "#f0fdf4" : "#eef2ff",
            fontWeight: "bold",
            fontSize: isMobile ? 14 : 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            {isPrivateMode
              ? `💬 ${isMobile ? selectedUser?.email?.split('@')[0] : `Chat riêng: ${selectedUser?.email}`}`
              : "🌐 Phòng Chat Chung"}
          </span>
          {isMobile && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid #6366f1",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 12,
                color: "#6366f1",
                cursor: "pointer",
              }}
            >
              👥
            </button>
          )}
        </div>
        <div
          style={{
            flex: 1,
            padding: isMobile ? "10px" : "20px",
            overflowY: "auto",
            overflowX: "hidden",
            background: "#f9fafb",
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? "6px" : "8px",
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
          }}
        >
          {messages.map((msg, index) => {
            const currentDate = msg.createdAt?.seconds
              ? new Date(msg.createdAt.seconds * 1000)
              : new Date();
            const prevMsg = messages[index - 1];
            const prevDate = prevMsg?.createdAt?.seconds
              ? new Date(prevMsg.createdAt.seconds * 1000)
              : null;
            let showDivider =
              !prevDate ||
              currentDate.toDateString() !== prevDate.toDateString();
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                {showDivider && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      margin: "16px 0",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        color: "#fff",
                        fontSize: 11,
                        padding: "4px 12px",
                        borderRadius: 12,
                        fontWeight: "500",
                      }}
                    >
                      {formatDateDivider(currentDate)}
                    </span>
                  </div>
                )}
                <MessageItem
                  msg={msg}
                  currentUser={currentUser}
                  isPrivateMode={isPrivateMode}
                  scrollToMessage={scrollToMessage}
                  setReplyTo={setReplyTo}
                  handleReaction={handleReaction}
                  users={users}
                  currentRoomId={currentRoomId}
                  onDeleteMessage={handleDeleteMessage}
                />
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div
          style={{
            padding: isMobile ? "8px 12px" : 16,
            borderTop: "1px solid #e0e7ff",
            position: "relative",
            paddingBottom: isMobile ? "max(12px, env(safe-area-inset-bottom))" : 16,
            background: "#fff",
            minHeight: isMobile ? "60px" : "auto",
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 8 : 12,
          }}
        >
          {replyTo && (
            <div
              style={{
                background: "#fff",
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 12,
                borderLeft: "4px solid #6366f1",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: "bold", color: "#6366f1" }}>
                  Đang trả lời {replyTo.senderName?.split("@")[0]}
                </span>
                <span style={{ color: "#6b7280", marginTop: 2 }}>
                  {replyTo.fileType === "image"
                    ? "[Hình ảnh]"
                    : replyTo.fileName || replyTo.text || "[File]"}
                </span>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: "#9ca3af",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
          )}
          {file && (
            <div style={{ marginBottom: 12, animation: "fadeIn 0.2s" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                File đính kèm
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div
                  style={{
                    position: "relative",
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={() => setIsHoveringPreview(true)}
                  onMouseLeave={() => setIsHoveringPreview(false)}
                >
                  {file.type.startsWith("image/") && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 24 }}>
                      {getFileIcon(file.name)}
                    </span>
                  )}
                  {isHoveringPreview && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() => fileInputRef.current.click()}
                        title="Đổi file"
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          border: "none",
                          color: "#fff",
                          borderRadius: 4,
                          width: 20,
                          height: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                        }}
                        title="Xóa"
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          border: "none",
                          color: "#fff",
                          borderRadius: 4,
                          width: 20,
                          height: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
                {!file.type.startsWith("image/") && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: 12,
                      color: "#4b5563",
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </div>
                )}
              </div>
            </div>
          )}
          {showEmoji && (
            <div
              style={{
                position: "absolute",
                bottom: 80,
                left: 20,
                zIndex: 100,
              }}
            >
              <EmojiPicker
                onEmojiClick={(data) =>
                  setNewMessage((prev) => prev + data.emoji)
                }
                height={350}
              />
            </div>
          )}
          <form
            onSubmit={handleSend}
            style={{ 
              display: "flex", 
              gap: isMobile ? 3 : 10, 
              alignItems: "center",
              flexWrap: "nowrap",
              width: "100%",
              maxWidth: "100%",
              overflow: "hidden",
              boxSizing: "border-box"
            }}
          >
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              style={{
                fontSize: isMobile ? 14 : 20,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: isMobile ? "4px" : "4px",
                minWidth: isMobile ? "32px" : "auto",
                minHeight: isMobile ? "32px" : "auto",
                width: isMobile ? "32px" : "auto",
                height: isMobile ? "32px" : "auto",
                flexShrink: 0,
                borderRadius: isMobile ? "50%" : 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              😊
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{
                fontSize: isMobile ? 14 : 20,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: isMobile ? "4px" : "4px",
                minWidth: isMobile ? "32px" : "auto",
                minHeight: isMobile ? "32px" : "auto",
                width: isMobile ? "32px" : "auto",
                height: isMobile ? "32px" : "auto",
                flexShrink: 0,
                borderRadius: isMobile ? "50%" : 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              📎
            </button>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onPaste={handlePaste}
              placeholder={isMobile ? "Tin nhắn..." : "Nhập tin nhắn..."}
              style={{
                flex: 1,
                padding: isMobile ? "8px 12px" : "12px 16px",
                borderRadius: isMobile ? 18 : 24,
                border: "1px solid #c7d2fe",
                outline: "none",
                background: "#fff",
                fontSize: isMobile ? 16 : 14, // Prevent zoom on iOS
                minHeight: isMobile ? "40px" : "auto",
                minWidth: 0, // Allow input to shrink
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() && !file}
              style={{
                padding: isMobile ? "6px 8px" : "10px 20px",
                borderRadius: isMobile ? 18 : 24,
                border: "none",
                background: (!newMessage.trim() && !file) ? "#9ca3af" : (isPrivateMode ? "#10b981" : "#6366f1"),
                color: "#fff",
                fontWeight: "600",
                cursor: (!newMessage.trim() && !file) ? "not-allowed" : "pointer",
                minWidth: isMobile ? "40px" : "80px",
                width: isMobile ? "40px" : "auto",
                minHeight: isMobile ? "40px" : "auto",
                height: isMobile ? "40px" : "auto",
                fontSize: isMobile ? 16 : 16,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: (!newMessage.trim() && !file) ? 0.6 : 1,
              }}
            >
              {isMobile ? "➤" : "Gửi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
