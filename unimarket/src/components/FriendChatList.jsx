import React, { useEffect, useState, useCallback } from "react";
import "./FriendChatList.css";
import {
  joinGroup,
  registerChatEventHandler,
  unregisterChatEventHandler,
  markAsSeen,
  deleteConversation,
} from "../services/chatSocialService";
import ChatListItemMenu from "./ChatListItemMenu";
import { BellOff } from "react-feather"; // <-- Logic từ Code 1

const FriendChatList = ({ userId, onSelectChat, selectedChatId }) => {
  const [friendChats, setFriendChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===================================================
  // 🕒 Format thời gian tin nhắn (Giống nhau)
  // ===================================================
  const formatMessageTime = (utcDateString) => {
    if (!utcDateString) return "";
    const messageDate = new Date(utcDateString);
    const now = new Date();
    const options = { timeZone: "Asia/Ho_Chi_Minh" };
    const messageDateVN = new Date(messageDate.toLocaleString("en-US", options));
    const nowVN = new Date(now.toLocaleString("en-US", options));

    const messageDayStart = new Date(
      messageDateVN.getFullYear(),
      messageDateVN.getMonth(),
      messageDateVN.getDate()
    );
    const todayStart = new Date(
      nowVN.getFullYear(),
      nowVN.getMonth(),
      nowVN.getDate()
    );

    const timeString = messageDateVN.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    if (messageDayStart.getTime() === todayStart.getTime()) {
      return timeString;
    }

    return messageDateVN.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ===================================================
  // 🔄 Realtime: Cập nhật cuộc trò chuyện (Logic Mute từ Code 1)
  // ===================================================
  const handleUpdateConversation = useCallback(
    (data) => {
      if (!data || !data.maCuocTroChuyen) return;

      setFriendChats((prevChats) => {
        const chatIndex = prevChats.findIndex(
          (c) => c.maCuocTroChuyen === data.maCuocTroChuyen
        );

        // 🧩 Cập nhật hội thoại đã tồn tại
        if (chatIndex > -1) {
          const existingChat = prevChats[chatIndex];
          const isActiveChat =
            existingChat.maCuocTroChuyen === selectedChatId;
          const isFromOtherUser = data.nguoiGuiId !== userId;

          let newUnreadCount = existingChat.unreadCount || 0;

          if (isActiveChat) {
            newUnreadCount = 0;
          } else if (
            isFromOtherUser &&
            !(data.tinNhanCuoi || "").includes("[Tin nhắn đã thu hồi]")
          ) {
            newUnreadCount += 1;
          }

          const updatedChat = {
            ...existingChat,
            lastMessage: {
              noiDung: data.tinNhanCuoi,
              thoiGianGui: data.thoiGianCapNhat,
              sender: {
                id: data.nguoiGuiId,
                fullName: data.tenNguoiGui,
                avatarUrl: data.avatarNguoiGui,
              },
              messageType:
                data.lastMessage?.messageType || data.messageType || "text",
            },
            unreadCount: newUnreadCount,
            isMuted: existingChat.isMuted, // <-- Logic từ Code 1: Giữ trạng thái isMuted
          };

          const newChats = prevChats.filter(
            (c) => c.maCuocTroChuyen !== data.maCuocTroChuyen
          );
          return [updatedChat, ...newChats];
        }

        // 🆕 Tạo hội thoại mới
        const partnerInfo = data.partner || {
          id: data.nguoiGuiId,
          fullName: data.tenNguoiGui,
          avatarUrl: data.avatarNguoiGui,
          isOnline: true,
        };

        if (partnerInfo && partnerInfo.id) {
          const newChat = {
            maCuocTroChuyen: data.maCuocTroChuyen,
            thoiGianTao: data.thoiGianTao || data.thoiGianCapNhat,
            lastMessage: {
              noiDung: data.tinNhanCuoi,
              thoiGianGui: data.thoiGianCapNhat,
              sender: {
                id: data.nguoiGuiId,
                fullName: data.tenNguoiGui,
                avatarUrl: data.avatarNguoiGui,
              },
              messageType:
                data.lastMessage?.messageType || data.messageType || "text",
            },
            partner: partnerInfo,
            unreadCount: (data.tinNhanCuoi || "").includes(
              "[Tin nhắn đã thu hồi]"
            )
              ? 0
              : 1,
            isMuted: false, // <-- Logic từ Code 1: Mặc định chat mới là false
          };
          joinGroup(data.maCuocTroChuyen);
          return [newChat, ...prevChats];
        }

        return prevChats;
      });
    },
    [userId, selectedChatId]
  );

  // ===================================================
  // 🟢 Realtime: Cập nhật trạng thái online/offline (Giống nhau)
  // ===================================================
  const handlePresenceUpdate = useCallback((presence) => {
    setFriendChats((prev) =>
      prev.map((chat) =>
        chat.partner?.id === presence.userId
          ? {
              ...chat,
              partner: {
                ...chat.partner,
                isOnline: presence.isOnline,
              },
            }
          : chat
      )
    );
  }, []);

  // ===================================================
  // ✨ Realtime: Cập nhật trạng thái chặn / gỡ chặn (Giống nhau)
  // ===================================================
  const handleBlockStatusChanged = useCallback((data) => {
    setFriendChats((prevChats) =>
      prevChats.map((chat) =>
        chat.maCuocTroChuyen === data.maCuocTroChuyen
          ? {
              ...chat,
              isBlocked: data.isBlocked,
              maNguoiChan: data.maNguoiChan,
            }
          : chat
      )
    );
  }, []);

  // ===================================================
  // ✨ [MỚI] Realtime: Cập nhật trạng thái Tắt/Bật TB (Logic từ Code 1)
  // ===================================================
  const handleMuteStatusChanged = useCallback((data) => {
    setFriendChats((prevChats) =>
      prevChats.map((chat) =>
        chat.maCuocTroChuyen === data.maCuocTroChuyen
          ? {
              ...chat,
              isMuted: data.isMuted,
            }
          : chat
      )
    );
  }, []);

  // ===================================================
  // 📦 Lấy danh sách cuộc trò chuyện (Logic Mute từ Code 1)
  // ===================================================
  const fetchFriendChats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Chưa đăng nhập hoặc thiếu token");

      const res = await fetch(
        `http://localhost:5133/api/SocialShare/social/user/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );

      if (res.status === 401) throw new Error("Token hết hạn hoặc không hợp lệ");
      if (!res.ok) throw new Error("Lỗi khi gọi API SocialChat");

      const data = await res.json();

      const chats = Array.isArray(data)
        ? data.map((chat) => ({
            ...chat,
            unreadCount: chat.unreadCount ?? 0,
            isMuted: chat.isMuted ?? false, // <-- Logic từ Code 1: Đảm bảo isMuted có giá trị
          }))
        : [];

      setFriendChats((prevChats) => {
        const isEqual =
          JSON.stringify(prevChats.map((c) => c.maCuocTroChuyen)) ===
          JSON.stringify(chats.map((c) => c.maCuocTroChuyen));
        return isEqual ? prevChats : chats;
      });

      for (const chat of chats) {
        if (chat.maCuocTroChuyen) joinGroup(chat.maCuocTroChuyen);
      }
    } catch (error) {
      console.error("❌ Lỗi lấy danh sách bạn bè:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ===================================================
  // 🗑️ Xử lý xóa cuộc trò chuyện (Giống nhau)
  // ===================================================
  const handleDeleteConversation = async (maCuocTroChuyen) => {
    setError(null);

    const chatToDelete = friendChats.find(
      (c) => c.maCuocTroChuyen === maCuocTroChuyen
    );
    const wasUnread = chatToDelete && chatToDelete.unreadCount > 0;

    try {
      if (wasUnread) await markAsSeen(maCuocTroChuyen);
      await deleteConversation(maCuocTroChuyen);

      setFriendChats((prevChats) =>
        prevChats.filter((chat) => chat.maCuocTroChuyen !== maCuocTroChuyen)
      );

      if (selectedChatId === maCuocTroChuyen) onSelectChat(null, null);
    } catch (err) {
      console.error("Lỗi khi xóa chat:", err);
      setError(err.message || "Không thể xóa. Vui lòng thử lại.");
    }
  };

  // ===================================================
  // ⚡ Đăng ký / Hủy đăng ký realtime event (Logic Mute từ Code 1)
  // ===================================================
  useEffect(() => {
    if (!userId) return;

    fetchFriendChats();
    registerChatEventHandler("CapNhatCuocTroChuyen", handleUpdateConversation);
    registerChatEventHandler("PresenceUpdated", handlePresenceUpdate);
    registerChatEventHandler("BlockStatusChanged", handleBlockStatusChanged);
    // ✨ [MỚI] Đăng ký sự kiện Mute (Logic từ Code 1)
    registerChatEventHandler("MuteStatusChanged", handleMuteStatusChanged);

    return () => {
      unregisterChatEventHandler(
        "CapNhatCuocTroChuyen",
        handleUpdateConversation
      );
      unregisterChatEventHandler("PresenceUpdated", handlePresenceUpdate);
      unregisterChatEventHandler(
        "BlockStatusChanged",
        handleBlockStatusChanged
      );
      // ✨ [MỚI] Hủy đăng ký sự kiện Mute (Logic từ Code 1)
      unregisterChatEventHandler("MuteStatusChanged", handleMuteStatusChanged);
    };
  }, [
    userId,
    fetchFriendChats,
    handleUpdateConversation,
    handlePresenceUpdate,
    handleBlockStatusChanged,
    handleMuteStatusChanged, // <-- Logic từ Code 1
  ]);

  // ===================================================
  // 🖱️ Chọn cuộc trò chuyện (Giống nhau)
  // ===================================================
  const handleSelectChat = (chat) => {
    const wasUnread = chat.unreadCount > 0;

    setFriendChats((prev) =>
      prev.map((c) =>
        c.maCuocTroChuyen === chat.maCuocTroChuyen
          ? { ...c, unreadCount: 0 }
          : c
      )
    );

    onSelectChat(chat, "social");
    if (wasUnread) markAsSeen(chat.maCuocTroChuyen);
  };

  // ===================================================
  // 💬 Render dòng tin nhắn cuối (Logic Mute từ Code 1)
  // ===================================================
  const renderLastMessageLine = (chat, isUnread) => {
    const lastMessage = chat.lastMessage;
    const formattedTime = formatMessageTime(lastMessage.thoiGianGui);
    const isActiveChat = chat.maCuocTroChuyen === selectedChatId;

    // ✨ [MỚI] Chỉ in đậm khi: chưa đọc, không active, VÀ không bị mute (Logic từ Code 1)
    const isActuallyUnread = isUnread && !isActiveChat && !chat.isMuted;

    const textClass = isActuallyUnread ? "last-text bold" : "last-text";
    const senderClass = isActuallyUnread ? "last-sender bold" : "last-sender";

    const senderId = lastMessage.sender?.Id || lastMessage.sender?.id;
    const senderName =
      senderId === userId
        ? "Bạn"
        : lastMessage.sender?.FullName ||
          lastMessage.sender?.fullName ||
          "Ai đó";

    const content = (lastMessage.noiDung || "").trim();

    if (content.includes("[Tin nhắn đã thu hồi]")) {
      const recallText =
        senderId === userId
          ? "Bạn đã thu hồi một tin nhắn"
          : `${senderName} đã thu hồi một tin nhắn`;

      return (
        <>
          <span className={`${textClass} italic`}>{recallText}</span>
          <span className="last-time"> • {formattedTime}</span>
        </>
      );
    }

    const messageType = lastMessage.messageType || "text";
    let cleanContent = content.replace(/\[ShareId:.*?\]\s*/g, "").trim();

    if (messageType === "video" && !cleanContent)
      cleanContent = "đã gửi 1 video";
    if (messageType === "image" && !cleanContent)
      cleanContent = "đã gửi 1 ảnh";

    if (!cleanContent) {
      if (messageType === "video") cleanContent = "đã chia sẻ 1 video";
      else if (messageType === "share") cleanContent = "đã chia sẻ 1 bài viết";
      else cleanContent = "đã gửi 1 tin nhắn";
    }

    return (
      <>
        <span className={senderClass}>{senderName}:</span>{" "}
        <span className={textClass}>{cleanContent}</span>
        <span className="last-time"> • {formattedTime}</span>
      </>
    );
  };

  // ===================================================
  // 🧩 Render danh sách chat (Gộp cả logic Mute từ Code 1 và <span> từ Code 2)
  // ===================================================
  if (loading) return <p className="chatlist-empty">Đang tải...</p>;

  return (
    <div className="friend-chatlist">
      {error && <p className="chatlist-empty error-text">{error}</p>}

      {friendChats.length === 0 ? (
        <p className="chatlist-empty">Không có cuộc trò chuyện nào</p>
      ) : (
        friendChats.map((chat) => {
          const isUnread = chat.unreadCount > 0;
          const isActive = chat.maCuocTroChuyen === selectedChatId;

          return (
            <div
              key={chat.maCuocTroChuyen}
              className={`chatlist-item-wrapper ${
                isActive ? "active-chat" : ""
              } ${
                chat.isMuted ? "muted" : "" // <-- Logic từ Code 1: Thêm class 'muted'
              }`}
            >
              <div
                className={`chatlist-item ${
                  isUnread && !isActive && !chat.isMuted ? "unread-chat" : "" // <-- Logic từ Code 1: Chỉ tô nền unread khi không mute
                }`}
                onClick={() => handleSelectChat(chat)}
              >
                <img
                  src={chat.partner?.avatarUrl || "/default-avatar.png"}
                  alt="Avatar"
                  className="chatlist-avatar"
                />
                <div className="chatlist-item-content">
                  <div className="chatlist-item-title">
                    {/* 👇 ĐÂY LÀ PHẦN GỘP TỪ CODE 2 (của bạn) VÀO CODE 1 👇 */}
                    <span className="chatlist-item-title-text">
                      {chat.partner?.fullName || "Người dùng"}
                    </span>
                    {/* 👆 KẾT THÚC PHẦN GỘP 👆 */}
                    
                    {chat.partner?.isOnline && (
                      <span className="online-dot" title="Đang online"></span>
                    )}
                  </div>
                  <div className="chatlist-item-last">
                    {chat.lastMessage
                      ? renderLastMessageLine(chat, isUnread)
                      : "Chưa có tin nhắn"}
                  </div>
                </div>

                {/* ✨ [MỚI] Logic hiển thị thông báo (Logic từ Code 1) */}
                {isUnread && !isActive && (
                  <div className="chatlist-item-badge-container">
                    {chat.isMuted ? (
                      // 1. Nếu Mute: Hiển thị chuông
                      <BellOff className="muted-bell-icon" size={16} />
                    ) : (
                      // 2. Nếu không Mute: Hiển thị số lượng
                      <div className="unread-badge">{chat.unreadCount}</div>
                    )}
                  </div>
                )}
              </div>

              {/* ✨ Truyền chat (đã có isMuted) cho menu (Logic từ Code 1) */}
              <ChatListItemMenu
                chat={chat}
                currentUserId={userId}
                onDelete={() => handleDeleteConversation(chat.maCuocTroChuyen)}
              />
            </div>
          );
        })
      )}
    </div>
  );
};

export default FriendChatList;