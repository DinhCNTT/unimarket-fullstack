import * as signalR from "@microsoft/signalr";

// ⚙️ CẤU HÌNH URL
const BASE_URL = "http://localhost:5133";
const HUB_URL = `${BASE_URL}/SocialChatHub`;

let connection = null;
let connectionPromise = null;

// ===================================================
// EVENT HANDLERS — Quản lý callback realtime
// ===================================================
const eventHandlers = {
  ReceiveMessage: [],
  CapNhatCuocTroChuyen: [],
  PresenceUpdated: [],
  MessageSeen: [],
  MessageRecalled: [],
  Typing: [],
  MessageRemovedForMe: [],
  BlockStatusChanged: [],
  ReceiveError: [],
  MuteStatusChanged: [],
  ConversationAccepted: [],
};

// ===================================================
// TOKEN HELPER — Lấy token linh hoạt
// ===================================================
const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken");

// ===================================================
// Đăng ký / Hủy đăng ký Event Handler
// ===================================================
export const registerChatEventHandler = (eventName, callback) => {
  if (eventHandlers[eventName] && !eventHandlers[eventName].includes(callback)) {
    eventHandlers[eventName].push(callback);
  }
};

export const unregisterChatEventHandler = (eventName, callback) => {
  if (eventHandlers[eventName]) {
    eventHandlers[eventName] = eventHandlers[eventName].filter(
      (h) => h !== callback
    );
  }
};

// ===================================================
// KẾT NỐI HUB — Smart Singleton + Auto Reconnect
// ===================================================
export const connectToSocialChatHub = () => {
  if (connectionPromise) return connectionPromise;

  connectionPromise = new Promise(async (resolve, reject) => {
    const token = getAuthToken();
    if (!token) {
      console.error("❌ Không tìm thấy token. Vui lòng đăng nhập lại.");
      connectionPromise = null;
      return reject(new Error("Token không tồn tại"));
    }

    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    // ---------------------------------------------------
    // Đăng ký các sự kiện từ Server
    // ---------------------------------------------------

    connection.on("ReceiveMessage", (message) => {
      eventHandlers.ReceiveMessage.forEach((h) => h(message));

      // ✅ Cập nhật danh sách hội thoại khi có tin mới
      const payload = {
        MaCuocTroChuyen: message.maCuocTroChuyen ?? message.MaCuocTroChuyen,
        TinNhanCuoi:
          message.noiDung ??
          message.NoiDung ??
          (message.mediaUrl || message.MediaUrl ? "[Đã gửi một tệp]" : ""),
        ThoiGianCapNhat:
          message.thoiGianGui ?? message.ThoiGianGui ?? new Date().toISOString(),
        NguoiGuiId:
          message.maNguoiGui ??
          message.MaNguoiGui ??
          message.sender?.id ??
          message.Sender?.Id,
        TenNguoiGui:
          message.sender?.fullName ??
          message.sender?.FullName ??
          message.TenNguoiGui ??
          message.Sender?.FullName,
        AvatarNguoiGui:
          message.sender?.avatarUrl ??
          message.sender?.AvatarUrl ??
          message.AvatarNguoiGui ??
          message.Sender?.AvatarUrl,
        HasUnreadMessages: true,
        Partner: message.Partner || null,
      };
      eventHandlers.CapNhatCuocTroChuyen.forEach((h) => h(payload));
    });

    connection.on("CapNhatCuocTroChuyen", (data) =>
      eventHandlers.CapNhatCuocTroChuyen.forEach((h) => h(data))
    );

    connection.on("PresenceUpdated", (data) =>
      eventHandlers.PresenceUpdated.forEach((h) => h(data))
    );

    connection.on("MessageSeen", (data) =>
      eventHandlers.MessageSeen.forEach((h) => h(data))
    );

    connection.on("MessageRecalled", (data) =>
      eventHandlers.MessageRecalled.forEach((h) => h(data))
    );

    connection.on("Typing", (data) =>
      eventHandlers.Typing.forEach((h) => h(data))
    );

    connection.on("MessageRemovedForMe", (data) =>
      eventHandlers.MessageRemovedForMe.forEach((h) => h(data))
    );

    // ✨ [MỚI] Khi trạng thái chặn thay đổi (block/unblock realtime)
    connection.on("BlockStatusChanged", (data) =>
      eventHandlers.BlockStatusChanged.forEach((h) => h(data))
    );

    // ✨ [MỚI] Khi có lỗi realtime (ví dụ: gửi tin khi bị chặn)
    connection.on("ReceiveError", (errorMessage) =>
      eventHandlers.ReceiveError.forEach((h) => h(errorMessage))
    );

    // ✨ [MỚI] Đăng ký sự kiện Mute/Unmute
    connection.on("MuteStatusChanged", (data) =>
      eventHandlers.MuteStatusChanged.forEach((h) => h(data))
    );

    // ✨ [MỚI] Đăng ký sự kiện ConversationAccepted (Chấp nhận tin nhắn chờ)
    connection.on("ConversationAccepted", (data) =>
      eventHandlers.ConversationAccepted.forEach((h) => h(data))
    );

    // ---------------------------------------------------
    // Bắt đầu kết nối
    // ---------------------------------------------------
    try {
      await connection.start();
      console.log("🔗 SocialChatHub connected:", connection.connectionId);
      resolve(connection);
    } catch (err) {
      console.error("❌ Kết nối SocialChatHub thất bại:", err);
      connectionPromise = null;
      connection = null;
      reject(err);
    }
  });

  return connectionPromise;
};

// ===================================================
// Ngắt kết nối Hub
// ===================================================
export const disconnectFromSocialChatHub = async () => {
  if (connection) {
    await connection.stop();
    console.log("🔌 Ngắt kết nối SocialChatHub");
  }
  connection = null;
  connectionPromise = null;
};

// ===================================================
// Helper: Hàm gọi Hub an toàn (Auto Reconnect)
// ===================================================
const invoke = async (methodName, ...args) => {
  await connectionPromise; // Chờ kết nối đầu tiên hoàn tất

  if (connection?.state !== signalR.HubConnectionState.Connected) {
    console.warn(`⚠️ Hub chưa kết nối (${methodName}), thử reconnect...`);
    try {
      await connectToSocialChatHub();
    } catch (error) {
      console.error("❌ Không thể reconnect:", error);
      return;
    }
  }

  try {
    return await connection.invoke(methodName, ...args);
  } catch (err) {
    console.error(`❌ Lỗi khi gọi '${methodName}':`, err);
  }
};

// ===================================================
// SIGNALR ACTIONS (Gửi lệnh lên Server)
// ===================================================
export const joinGroup = (maCuocTroChuyen) =>
  invoke("JoinGroup", maCuocTroChuyen);

export const leaveGroup = (maCuocTroChuyen) =>
  invoke("LeaveGroup", maCuocTroChuyen);

// ✨ SendMessage — hỗ trợ reply
export const sendMessage = (
  maCuocTroChuyen,
  noiDung,
  mediaUrl = null,
  parentMessageId = null
) =>
  invoke("SendMessage", maCuocTroChuyen, noiDung, mediaUrl, parentMessageId);

export const markAsSeen = (maCuocTroChuyen) =>
  invoke("MarkAsSeen", maCuocTroChuyen);

export const recallMessage = (maCuocTroChuyen, maTinNhan) =>
  invoke("ThuHoiTinNhan", maCuocTroChuyen, maTinNhan);

export const sendTyping = (maCuocTroChuyen, toUserId = null) =>
  invoke("Typing", maCuocTroChuyen, toUserId);

export const ping = () => invoke("Ping");

export const updateUserPresence = (userId, isOnline) =>
  invoke("CapNhatTrangThaiNguoiDung", userId, isOnline);

// ===================================================
// API HELPER (Dùng chung cho các lệnh Fetch)
// ===================================================
const callConversationApi = async (maCuocTroChuyen, action) => {
  const token = getAuthToken();
  if (!token) throw new Error("Token không tồn tại.");

  try {
    const res = await fetch(
      `${BASE_URL}/api/SocialShare/conversation/${maCuocTroChuyen}/${action}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Lỗi khi ${action} cuộc trò chuyện`);
    }

    return await res.json();
  } catch (err) {
    console.error(`❌ Lỗi khi gọi API ${action}:`, err);
    throw err;
  }
};

// ===================================================
// API RESTFUL — CÁC CHỨC NĂNG CHAT KHÁC
// ===================================================

/**
 * ✨ Lấy hoặc tạo cuộc trò chuyện 1-1
 * @param {string} targetUserId - ID của người muốn chat
 */
export const getOrCreateConversation = async (targetUserId) => {
  const token = getAuthToken();
  if (!token) throw new Error("Chưa đăng nhập");

  try {
    const res = await fetch(
      `${BASE_URL}/api/SocialShare/start-conversation`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Gửi string trực tiếp vì Backend nhận [FromBody] string
        body: JSON.stringify(targetUserId),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Không thể tạo cuộc trò chuyện");
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi getOrCreateConversation:", error);
    throw error;
  }
};

/**
 * ✨ [MỚI] Chấp nhận tin nhắn chờ
 * @param {string} maCuocTroChuyen 
 */
export const acceptMessageRequest = async (maCuocTroChuyen) => {
  const token = getAuthToken();
  if (!token) throw new Error("Token không tồn tại.");

  try {
    const res = await fetch(
      `${BASE_URL}/api/SocialShare/conversation/${maCuocTroChuyen}/accept`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Lỗi khi chấp nhận cuộc trò chuyện.");
    }

    return await res.json();
  } catch (err) {
    console.error("Lỗi acceptMessageRequest:", err);
    throw err;
  }
};

// --- Block / Unblock ---
export const blockConversation = (maCuocTroChuyen) =>
  callConversationApi(maCuocTroChuyen, "block");

export const unblockConversation = (maCuocTroChuyen) =>
  callConversationApi(maCuocTroChuyen, "unblock");

// --- Mute / Unmute ---
export const muteConversation = (maCuocTroChuyen) =>
  callConversationApi(maCuocTroChuyen, "mute");

export const unmuteConversation = (maCuocTroChuyen) =>
  callConversationApi(maCuocTroChuyen, "unmute");

// --- Xóa cuộc trò chuyện (Ẩn) ---
export const deleteConversation = async (maCuocTroChuyen) => {
  const token = getAuthToken();
  if (!token) throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");

  try {
    const res = await fetch(
      `${BASE_URL}/api/SocialShare/conversation/${maCuocTroChuyen}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Lỗi khi ẩn cuộc trò chuyện");
    }

    return await res.json();
  } catch (err) {
    console.error("Lỗi khi gọi API deleteConversation:", err);
    throw err;
  }
};

// --- Xóa tin nhắn (Chỉ phía tôi) ---
export const deleteMessageForMe = async (conversationId, messageId) => {
  const token = getAuthToken();
  if (!token) throw new Error("Token không tồn tại.");

  try {
    const response = await fetch(
      `${BASE_URL}/api/SocialShare/message/delete-for-me`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ConversationId: conversationId,
          MessageId: messageId,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Lỗi khi xóa tin nhắn.");
    }

    return await response.json();
  } catch (err) {
    console.error("Lỗi khi gọi deleteMessageForMe:", err);
    throw err;
  }
};

// ===================================================
// TRẠNG THÁI KẾT NỐI
// ===================================================
export const getConnectionState = () =>
  connection ? connection.state : "Disconnected";