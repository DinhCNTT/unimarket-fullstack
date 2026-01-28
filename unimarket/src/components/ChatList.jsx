import React, { useEffect, useState, useRef } from "react";
import { createPortal } from 'react-dom';
import * as signalR from "@microsoft/signalr";
import "./ChatList.css";
import { MoreVertical, Trash2 } from "lucide-react"; // ← Cái này từ lucide-react (khác lib)
import FriendChatList from "./FriendChatList";
import QuickMessageModal from "./ChatList/QuickMessageModal";
import { useQuickMessages } from "./ChatList/useQuickMessages";

// ✅ Thêm FiTrash2 vô đây:
import { 
  FiUsers as Users, 
  FiArrowLeft as ArrowLeft, 
  FiCamera as Camera, 
  FiVideo as Video, 
  FiMoreVertical, 
  FiTrash2,               // 👈 trash icon
  FiEye,                  // 👈 eye icon for unhide
  FiEyeOff,               // 👈 eye-off icon for hide
  FiCheckSquare,          // 👈 checkbox icon for select multiple
  FiList,                 // 👈 list icon for "all"
  FiEyeOff as FiHidden,   // 👈 hidden icon for "hidden chats"
  FiMessageSquare         // 👈 message icon for quick messages
} from "react-icons/fi";

// Services
import { deleteConversationForMe, setChatState, bulkSetChatState, getUserChatStates, getUserChats, markConversationAsRead } from "../services/chatService";
import { injectChatPreview, injectChatMessage } from "./AI/AiHelpers";


const ChatList = ({ selectedChatId, onSelectChat, userId, initialMode }) => {
  const [chatList, setChatList] = useState([]);
  const [hiddenChatList, setHiddenChatList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHideMode, setIsHideMode] = useState(false);
  const [selectedToHide, setSelectedToHide] = useState([]);
  const [filterMode, setFilterMode] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedChatId, setExpandedChatId] = useState(null);
  const [popoverStyle, setPopoverStyle] = useState(null);
  const [showQuickMessageModal, setShowQuickMessageModal] = useState(false);
  const connectionRef = useRef(null);
  const menuButtonRefs = useRef({});
  const [showFriendList, setShowFriendList] = useState(initialMode === 'friend');
  const selectedChatIdRef = useRef(selectedChatId);

  // Use quick messages hook
  const {
    quickMessages,
    editingId,
    editingContent,
    setEditingContent,
    isLoadingQuickMessages,
    isSavingQuickMessages,
    loadQuickMessages,
    saveQuickMessages,
    deleteQuickMessage,
    startEditMessage,
    cancelEdit,
    syncQuickRepliesBar,
  } = useQuickMessages(userId);

  // Use centralized service functions (imported from services/chatService)

  // Hàm lấy URL hình ảnh đầy đủ
  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

 // ✅ Sắp xếp đơn giản: chỉ dựa vào thời gian tin nhắn mới nhất
const sortChatsLikeMessenger = (chats) => {
  return [...chats].sort((a, b) => {
    const timeA = new Date(
      a.ThoiGianCapNhat || a.thoiGianCapNhat || a.thoiGianTao || new Date()
    ).getTime();
    const timeB = new Date(
      b.ThoiGianCapNhat || b.thoiGianCapNhat || b.thoiGianTao || new Date()
    ).getTime();

    return timeB - timeA; // mới nhất lên đầu
  });
};

  // ✅ Helper: Parse AI message JSON và lấy replyText
  const formatChatPreview = (content, isAiChat) => {
    if (!content) return "";
    
    // Nếu là AI chat, thử parse JSON để lấy replyText
    if (isAiChat) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.replyText) {
          return parsed.replyText; // Hiển thị replyText thay vì JSON
        }
      } catch (e) {
        // Nếu parse lỗi, hiển thị content bình thường
      }
    }
    
    return content;
  };

  // Hiển thị xác nhận xóa cuộc trò chuyện
  const handleShowDeleteConfirm = (chatId) => {
    setShowDeleteConfirm(chatId);
  };

  // Hiển thị menu các tùy chọn cho cuộc trò chuyện
  const handleMenuClick = (e, chatId) => {
    e.stopPropagation();
    if (expandedChatId === chatId) {
      setExpandedChatId(null);
      setPopoverStyle(null);
    } else {
      // compute position for portal popover
      const btn = menuButtonRefs.current[chatId];
      if (btn && btn.getBoundingClientRect) {
        const rect = btn.getBoundingClientRect();
        const popoverWidth = 220; // match CSS min-width
        const margin = 8;
        let left = rect.right - popoverWidth;
        // ensure within viewport
        left = Math.max(margin, Math.min(left, window.innerWidth - popoverWidth - margin));
        // default place below; if not enough space, place above
        const estimatedHeight = 110; // approximate popover height
        let top = rect.bottom + 6;
        let placeAbove = false;
        if (rect.bottom + estimatedHeight + margin > window.innerHeight) {
          // place above
          top = rect.top - estimatedHeight - 6;
          placeAbove = true;
        }
        setPopoverStyle({ position: 'fixed', top: Math.round(top) + 'px', left: Math.round(left) + 'px', width: popoverWidth + 'px', transformOrigin: placeAbove ? 'bottom right' : 'top right' });
      } else {
        setPopoverStyle(null);
      }
      setExpandedChatId(chatId);
    }
  };

  // Xác nhận xóa cuộc trò chuyện - cập nhật với database
  const handleConfirmDelete = async () => {
  if (!showDeleteConfirm) return;

  try {
  const deleteRes = await deleteConversationForMe(showDeleteConfirm, userId);
    // Also update chat state to mark deleted locally/server-side (best-effort)
    await setChatState(showDeleteConfirm, false, true, userId).catch(() => {});

    // Remember deletion time locally so when conversation reappears we don't show old messages
    try {
      const raw = localStorage.getItem('deletedConversations');
      const map = raw ? JSON.parse(raw) : {};
      const serverHidden = deleteRes && (deleteRes.hidden || deleteRes.Hidden);
      const thoiGianAn = serverHidden && (serverHidden.ThoiGianAn || serverHidden.thoiGianAn)
        ? new Date(serverHidden.ThoiGianAn || serverHidden.thoiGianAn).toISOString()
        : new Date().toISOString();
      map[showDeleteConfirm] = thoiGianAn;
      localStorage.setItem('deletedConversations', JSON.stringify(map));
    } catch (e) {
      console.warn('Could not persist deletedConversations to localStorage', e);
    }
  } catch (err) {
    console.error("Lỗi xóa toàn bộ tin nhắn phía tôi:", err);
  }

  // Cập nhật local state
  setChatList((prev) =>
    prev.filter((chat) => chat.maCuocTroChuyen !== showDeleteConfirm)
  );
  setHiddenChatList((prev) =>
    prev.filter((chat) => chat.maCuocTroChuyen !== showDeleteConfirm)
  );

  // ✅ reset selectedChatId ở TrangChat
  onSelectChat(null);

  setShowDeleteConfirm(null);
  setExpandedChatId(null);
};

  // Ẩn / gỡ ẩn cuộc trò chuyện cho từng item
  const handleToggleHide = async (chatId, currentlyHidden) => {
    try {
      // setChatState(chatId, isHidden, isDeleted, userId)
      await setChatState(chatId, !currentlyHidden, false, userId);

      // Update local lists
      if (!currentlyHidden) {
        // move to hidden list
        setChatList((prev) => prev.filter((c) => c.maCuocTroChuyen !== chatId));
        setHiddenChatList((prev) => {
          const existing = prev.find((c) => c.maCuocTroChuyen === chatId);
          if (existing) return prev;
          const moved = chatList.find((c) => c.maCuocTroChuyen === chatId);
          return moved ? sortChatsLikeMessenger([{ ...moved, isHidden: true, hasUnreadMessages: false }, ...prev]) : prev;
        });
      } else {
        // unhide: move back to chatList
        setHiddenChatList((prev) => prev.filter((c) => c.maCuocTroChuyen !== chatId));
        // best-effort: refetch chat or move from hidden to visible
        const moved = hiddenChatList.find((c) => c.maCuocTroChuyen === chatId);
        if (moved) {
          setChatList((prev) => sortChatsLikeMessenger([{ ...moved, isHidden: false }, ...prev]));
        }
      }
    } catch (err) {
      console.error('Lỗi khi (gỡ)ẩn cuộc trò chuyện:', err);
    } finally {
      setExpandedChatId(null);
    }
  };

  // Hủy bỏ xác nhận xóa
  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // Lắng nghe click ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Không đóng menu nếu modal quản lý tin nhắn nhanh đang mở
      if (showQuickMessageModal) {
        return;
      }
      
      if (showDeleteConfirm && !e.target.closest('.chatlist-delete-confirm-modal')) {
        setShowDeleteConfirm(null);
      }
      // Don't close if click is inside the popover (portal) either
      if (expandedChatId && !e.target.closest('.chatlist-item') && !e.target.closest('.chatlist-menu-popover')) {
        setExpandedChatId(null);
        setPopoverStyle(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDeleteConfirm, expandedChatId, showQuickMessageModal]);

  // Lắng nghe click ngoài modal quản lý tin nhắn nhanh
  useEffect(() => {
    if (!showQuickMessageModal) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest('.chatlist-quick-message-modal')) {
        setShowQuickMessageModal(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showQuickMessageModal, userId]);

  // Load quick messages and sync quick-replies bar only when header filter (three-dot) is opened
  useEffect(() => {
    if (expandedChatId !== 'header-filter') return;
    if (!userId) return;

    console.log('[ChatList] Header filter opened - loading quick messages...');
    loadQuickMessages();
  }, [expandedChatId, userId]);

  useEffect(() => {
    if (initialMode === 'friend') {
        setShowFriendList(true);
    }
  }, [initialMode]);

  // ✅ Lắng nghe event khi tin nhắn bị xóa để cập nhật chatlist
  useEffect(() => {
    const handleMessageDeleted = (event) => {
      const { lastMessage, maCuocTroChuyen } = event.detail;
      
      setChatList((prev) => {
        const updatedList = prev.map((chat) => {
          if (chat.maCuocTroChuyen === maCuocTroChuyen) {
            if (lastMessage) {
              // Cập nhật với tin nhắn mới nhất
              return {
                ...chat,
                tinNhanCuoi: lastMessage.noiDung || "",
                maNguoiGuiCuoi: lastMessage.maNguoiGui,
                loaiTinNhanCuoi: lastMessage.loaiTinNhan,
                thoiGianCapNhat: lastMessage.thoiGian,
                ThoiGianCapNhat: lastMessage.thoiGian
              };
            } else {
              // Không còn tin nhắn nào trong cuộc trò chuyện
              return {
                ...chat,
                tinNhanCuoi: "",
                maNguoiGuiCuoi: null,
                loaiTinNhanCuoi: null
              };
            }
          }
          return chat;
        });
        return sortChatsLikeMessenger(updatedList);
      });
    };

    window.addEventListener('messageDeleted', handleMessageDeleted);
    return () => window.removeEventListener('messageDeleted', handleMessageDeleted);
  }, []);
 // ✅ Lắng nghe event khi có yêu cầu tạo chat preview từ AI (AiHelpers)
  useEffect(() => {
    const handleInjectPreview = (event) => {
      const newChat = event.detail;
      try {
        console.log('📥 Nhận được chat preview mới từ AI:', newChat);

        setChatList((prev) => {
          const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
          if (exists) return prev;
          return [newChat, ...prev];
        });

        // Tự động mở chat mới
        if (onSelectChat) onSelectChat(newChat.maCuocTroChuyen);
      } catch (err) {
        console.error('Lỗi khi xử lý InjectSampleMessageToChatList:', err);
      }
    };

    window.addEventListener('InjectSampleMessageToChatList', handleInjectPreview);
    return () => window.removeEventListener('InjectSampleMessageToChatList', handleInjectPreview);
  }, [onSelectChat]);
  // ✅ FIX: Kết nối SignalR với thời gian chính xác
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5133/hub/chat", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // Trong ChatList.jsx, tìm đoạn SignalR handler "CapNhatCuocTroChuyen"
// Thay thế toàn bộ đoạn xử lý chat ẩn này:

connection.on("CapNhatCuocTroChuyen", async (chat) => {
  let newChat = {
    maCuocTroChuyen: chat.maCuocTroChuyen || chat.MaCuocTroChuyen,
    isEmpty: chat.isEmpty ?? chat.IsEmpty,
    maTinDang: chat.maTinDang ?? chat.MaTinDang,
    tieuDeTinDang: chat.tieuDeTinDang ?? chat.TieuDeTinDang ?? "Tin đăng",
    giaTinDang: chat.giaTinDang ?? chat.GiaTinDang ?? 0,
    tenNguoiConLai: chat.tenNguoiConLai ?? chat.TenNguoiConLai ?? "Người dùng",
    tinNhanCuoi: chat.tinNhanCuoi ?? chat.TinNhanCuoi ?? "",
    maNguoiGuiCuoi: chat.maNguoiGui || null,
    loaiTinNhanCuoi: chat.loaiTinNhan || null,
    anhDaiDienTinDang: chat.anhDaiDienTinDang ?? chat.AnhDaiDienTinDang ?? "",
    thoiGianTao: chat.thoiGianTao ?? new Date().toISOString(),
    thoiGianCapNhat: chat.thoiGianCapNhat || chat.ThoiGianCapNhat || new Date().toISOString(),
    ThoiGianCapNhat: chat.ThoiGianCapNhat || chat.thoiGianCapNhat || new Date().toISOString(),
    hasUnreadMessages: chat.hasUnreadMessages ?? chat.HasUnreadMessages ?? false,
    isBlocked: chat.isBlocked ?? false,
    isRecalled: chat.isRecalled ?? chat.IsRecalled ?? false,
    isHidden: chat.isHidden ?? false,
    isDeleted: chat.isDeleted ?? false,
  };

  // ✅ NEW: Nếu ChatBox của conversation này đang mở, auto mark as read
  if (selectedChatIdRef.current === newChat.maCuocTroChuyen && newChat.maNguoiGuiCuoi !== userId) {
    // Auto mark as read realtime
    console.log(`🔔 New message arrived in open chat ${newChat.maCuocTroChuyen}, auto-marking as read...`);
    markConversationAsRead(newChat.maCuocTroChuyen, userId).catch(err => {
      console.warn("Failed to auto-mark chat as read:", err);
    });
    // ✅ Set hasUnreadMessages = false ngay để dòng chatlist info không in đậm
    newChat.hasUnreadMessages = false;
  }

  // Lấy trạng thái chat từ database
  const chatStates = await getUserChatStates(userId);
  const chatState = chatStates.find(cs => cs.chatId === newChat.maCuocTroChuyen);
  const isHidden = chatState?.isHidden ?? false;
  const isDeleted = chatState?.isDeleted ?? false;

  // Nếu cuộc trò chuyện bị xóa hoàn toàn và có tin nhắn mới từ đối phương => cho xuất hiện lại (theo cơ chế HasReappeared của server)
  if (isDeleted && newChat.maNguoiGuiCuoi !== userId) {
    // Cập nhật local state để phản ánh thay đổi ngay lập tức
    newChat.isDeleted = false;
    newChat.isHidden = false;

    // Hiển thị lại trong danh sách chat chính
    setChatList((prev) => {
      const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
      let updatedList;
      if (exists) {
        updatedList = prev.map((c) =>
          c.maCuocTroChuyen === newChat.maCuocTroChuyen ? newChat : c
        );
      } else {
        updatedList = [...prev, newChat];
      }
      return sortChatsLikeMessenger(updatedList);
    });

    // Xóa khỏi danh sách ẩn nếu có
    setHiddenChatList((prev) => prev.filter((c) => c.maCuocTroChuyen !== newChat.maCuocTroChuyen));
    return;
  }

  // Nếu cuộc trò chuyện bị xóa hoàn toàn, bỏ qua cập nhật
  if (isDeleted) {
    return;
  }

  // ✅ FIX: Nếu cuộc trò chuyện bị ẩn - GIỮ NGUYÊN TRONG TAB ẨN
  if (isHidden) {
    setHiddenChatList((prev) => {
      const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
      let updatedList;
      if (exists) {
        updatedList = prev.map((c) =>
          c.maCuocTroChuyen === newChat.maCuocTroChuyen 
            ? { 
                ...newChat, 
                // ✅ GIỮ UNREAD STATUS CHO TIN NHẮN MỚI TỪ NGƯỜI KHÁC
                hasUnreadMessages: newChat.maNguoiGuiCuoi !== userId ? newChat.hasUnreadMessages : false 
              }
            : c
        );
      } else {
        updatedList = [...prev, { 
          ...newChat, 
          hasUnreadMessages: newChat.maNguoiGuiCuoi !== userId ? newChat.hasUnreadMessages : false 
        }];
      }
      return sortChatsLikeMessenger(updatedList);
    });
    
    // ✅ QUAN TRỌNG: Không xóa khỏi danh sách ẩn và không thêm vào danh sách chính
    return;
  }

  // Cập nhật danh sách chat chính (không bị ẩn)
  setChatList((prev) => {
    const exists = prev.some((c) => c.maCuocTroChuyen === newChat.maCuocTroChuyen);
    let updatedList;
    if (exists) {
      updatedList = prev.map((c) =>
        c.maCuocTroChuyen === newChat.maCuocTroChuyen ? newChat : c
      );
    } else {
      updatedList = [...prev, newChat];
    }
    return sortChatsLikeMessenger(updatedList);
  });
  
  // Đảm bảo xóa khỏi danh sách ẩn nếu chat này xuất hiện trong danh sách chính
  setHiddenChatList((prev) => prev.filter((c) => c.maCuocTroChuyen !== newChat.maCuocTroChuyen));
});

    connection.on("CapNhatTrangThaiTinNhan", async (data) => {
      // Lấy trạng thái chat từ server
      try {
        const chatStates = await getUserChatStates(userId);
        const chatState = chatStates.find(cs => cs.chatId === data.maCuocTroChuyen);
        const isHidden = chatState?.isHidden ?? false;
        const isDeleted = chatState?.isDeleted ?? false;

        // Nếu cuộc trò chuyện bị xóa hoàn toàn, bỏ qua cập nhật
        if (isDeleted) {
          return;
        }

        if (isHidden) {
          // Không cập nhật trạng thái tin nhắn cho chat ẩn
          return;
        }

        setChatList((prev) => {
          const updatedList = prev.map((c) =>
            c.maCuocTroChuyen === data.maCuocTroChuyen
              ? { 
                  ...c, 
                  hasUnreadMessages: data.hasUnreadMessages,
                  // ✅ FIX: Giữ nguyên thời gian cập nhật từ backend
                  thoiGianCapNhat: data.thoiGianCapNhat || c.thoiGianCapNhat || c.ThoiGianCapNhat,
                  ThoiGianCapNhat: data.ThoiGianCapNhat || c.ThoiGianCapNhat || c.thoiGianCapNhat
                }
              : c
          );
          return sortChatsLikeMessenger(updatedList);
        });
      } catch (error) {
        console.error("Lỗi lấy trạng thái chat:", error);
      }
    });

    connection.on("CapNhatTinDang", async (updatedPost) => {
      // Lấy trạng thái chat từ server để kiểm tra
      try {
        const chatStates = await getUserChatStates(userId);

        setChatList((prev) =>
          prev.map((chat) => {
            const chatState = chatStates.find(cs => cs.chatId === chat.maCuocTroChuyen);
            const isDeleted = chatState?.isDeleted ?? false;
            
            if (Number(chat.maTinDang) === Number(updatedPost.MaTinDang) && !isDeleted) {
              return {
                ...chat,
                tieuDeTinDang: updatedPost.TieuDe,
                giaTinDang: updatedPost.Gia,
                anhDaiDienTinDang: updatedPost.AnhDaiDien || "",
              };
            }
            return chat;
          })
        );

        setHiddenChatList((prev) =>
          prev.map((chat) => {
            const chatState = chatStates.find(cs => cs.chatId === chat.maCuocTroChuyen);
            const isDeleted = chatState?.isDeleted ?? false;
            
            if (Number(chat.maTinDang) === Number(updatedPost.MaTinDang) && !isDeleted) {
              return {
                ...chat,
                tieuDeTinDang: updatedPost.TieuDe,
                giaTinDang: updatedPost.Gia,
                anhDaiDienTinDang: updatedPost.AnhDaiDien || "",
              };
            }
            return chat;
          })
        );
      } catch (error) {
        console.error("Lỗi lấy trạng thái chat khi cập nhật tin đăng:", error);
      }
    });

    // 1️⃣ Handler cho sự kiện block/unblock user
connection.on("UserBlocked", async (data) => {
  const { blockedUserId, isBlocked, actionType } = data;

  console.log(`[ChatList] Received UserBlocked event: ${actionType}, blockedUserId: ${blockedUserId}`);

  // Refresh lại chat list để cập nhật trạng thái block/unblock
  try {
  const chatData = await getUserChats(userId);

    const visibleChats = [];
    const hiddenChats = [];

    chatData.forEach((chat) => {
      const processedChat = {
        ...chat,
        maCuocTroChuyen: chat.MaCuocTroChuyen || chat.maCuocTroChuyen,
        thoiGianTao: chat.ThoiGianTao || chat.thoiGianTao,
        thoiGianCapNhat: chat.ThoiGianCapNhat || chat.thoiGianCapNhat,
        ThoiGianCapNhat: chat.ThoiGianCapNhat,
        tinNhanCuoi: chat.TinNhanCuoi?.NoiDung || chat.tinNhanCuoi?.noiDung || "",
        maNguoiGuiCuoi: chat.TinNhanCuoi?.MaNguoiGui || chat.tinNhanCuoi?.maNguoiGui || null,
        loaiTinNhanCuoi: chat.TinNhanCuoi?.LoaiTinNhan || chat.tinNhanCuoi?.loaiTinNhan || null,
        isRecalled: chat.TinNhanCuoi?.IsRecalled ?? chat.tinNhanCuoi?.isRecalled ?? false,
        hasUnreadMessages: chat.HasUnreadMessages ?? chat.hasUnreadMessages ?? false,
        isBlocked: chat.IsBlocked ?? chat.isBlocked ?? false,
        isHidden: chat.IsHidden ?? chat.isHidden ?? false,
        isDeleted: chat.IsDeleted ?? chat.isDeleted ?? false,
      };

      if (processedChat.isDeleted) return;

      if (processedChat.isHidden) {
        hiddenChats.push({ ...processedChat, hasUnreadMessages: false });
      } else {
        visibleChats.push(processedChat);
      }
    });

    setChatList(sortChatsLikeMessenger(visibleChats));
    setHiddenChatList(sortChatsLikeMessenger(hiddenChats));

  } catch (error) {
    console.error("Error refreshing chat list after block event:", error);
  }
});

// 2️⃣ Handler cho sự kiện thay đổi trạng thái chat
connection.on("ChatStatusChanged", (data) => {
  const { chatId, isBlocked } = data;

  console.log(`[ChatList] Chat ${chatId} status changed: isBlocked=${isBlocked}`);

  // Cập nhật trạng thái isBlocked cho chat cụ thể
  setChatList((prev) => 
    prev.map((chat) => 
      chat.maCuocTroChuyen === chatId 
        ? { ...chat, isBlocked: isBlocked }
        : chat
    )
  );

  setHiddenChatList((prev) => 
    prev.map((chat) => 
      chat.maCuocTroChuyen === chatId 
        ? { ...chat, isBlocked: isBlocked }
        : chat
    )
  );
});

    connection
      .start()
      .then(async () => {
        console.log("✅ SignalR connected for ChatList");
        await connection.invoke("ThamGiaCuocTroChuyen", `user-${userId}`);
      })
      .catch((err) => {
        console.error("❌ SignalR connection error:", err);
      });

    // ✅ FIX: Lấy danh sách cuộc trò chuyện với mapping chính xác
    const fetchChats = async () => {
      try {
        const data = await getUserChats(userId);
        
        // Tách chat thành 2 danh sách: hiện và ẩn dựa trên database
        const visibleChats = [];
        const hiddenChats = [];
        
        data.forEach((chat) => {
          const processedChat = {
            ...chat,
            // ✅ FIX: Map chính xác các field từ backend
            maCuocTroChuyen: chat.MaCuocTroChuyen || chat.maCuocTroChuyen,
            thoiGianTao: chat.ThoiGianTao || chat.thoiGianTao,
            thoiGianCapNhat: chat.ThoiGianCapNhat || chat.thoiGianCapNhat,
            ThoiGianCapNhat: chat.ThoiGianCapNhat, // Giữ nguyên từ backend
            tinNhanCuoi: chat.TinNhanCuoi?.NoiDung || chat.tinNhanCuoi?.noiDung || "",
            maNguoiGuiCuoi: chat.TinNhanCuoi?.MaNguoiGui || chat.tinNhanCuoi?.maNguoiGui || null,
            loaiTinNhanCuoi: chat.TinNhanCuoi?.LoaiTinNhan || chat.tinNhanCuoi?.loaiTinNhan || null,
            hasUnreadMessages: chat.HasUnreadMessages ?? chat.hasUnreadMessages ?? false,
            isBlocked: chat.IsBlocked ?? chat.isBlocked ?? false,
            isRecalled: chat.TinNhanCuoi?.IsRecalled ?? chat.tinNhanCuoi?.isRecalled ?? false,
            isHidden: chat.IsHidden ?? chat.isHidden ?? false,
            isDeleted: chat.IsDeleted ?? chat.isDeleted ?? false,
          };
          
          // Bỏ qua chat đã bị xóa hoàn toàn
          if (processedChat.isDeleted) {
            return;
          }
          
          if (processedChat.isHidden) {
            hiddenChats.push({ ...processedChat, hasUnreadMessages: false });
          } else {
            visibleChats.push(processedChat);
          }
        });
        
        // Sắp xếp cả 2 danh sách
        setChatList(sortChatsLikeMessenger(visibleChats));
        setHiddenChatList(sortChatsLikeMessenger(hiddenChats));

      } catch (error) {
        console.error("Lỗi lấy danh sách chat:", error);
      }
    };

    fetchChats();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [userId]);

  useEffect(() => {
    // ✅ FIX: Refresh với mapping chính xác
    const handleRefreshChatList = async () => {
      console.log("🔄 Refreshing ChatList...");
      
      try {
  const data = await getUserChats(userId);
        
        // Tách chat thành 2 danh sách: hiện và ẩn dựa trên database
        const visibleChats = [];
        const hiddenChats = [];
        
        data.forEach((chat) => {
          const processedChat = {
            ...chat,
            // ✅ FIX: Map chính xác các field từ backend
            maCuocTroChuyen: chat.MaCuocTroChuyen || chat.maCuocTroChuyen,
            thoiGianTao: chat.ThoiGianTao || chat.thoiGianTao,
            thoiGianCapNhat: chat.ThoiGianCapNhat || chat.thoiGianCapNhat,
            ThoiGianCapNhat: chat.ThoiGianCapNhat, // Giữ nguyên từ backend
            tinNhanCuoi: chat.TinNhanCuoi?.NoiDung || chat.tinNhanCuoi?.noiDung || "",
            maNguoiGuiCuoi: chat.TinNhanCuoi?.MaNguoiGui || chat.tinNhanCuoi?.maNguoiGui || null,
            loaiTinNhanCuoi: chat.TinNhanCuoi?.LoaiTinNhan || chat.tinNhanCuoi?.loaiTinNhan || null,
            hasUnreadMessages: chat.HasUnreadMessages ?? chat.hasUnreadMessages ?? false,
            isBlocked: chat.IsBlocked ?? chat.isBlocked ?? false,
            isHidden: chat.IsHidden ?? chat.isHidden ?? false,
            isDeleted: chat.IsDeleted ?? chat.isDeleted ?? false,
          };
          
          // Bỏ qua chat đã bị xóa hoàn toàn
          if (processedChat.isDeleted) {
            return;
          }
          
          if (processedChat.isHidden) {
            hiddenChats.push({ ...processedChat, hasUnreadMessages: false });
          } else {
            visibleChats.push(processedChat);
          }
        });
        
        // Sắp xếp và cập nhật state
        setChatList(sortChatsLikeMessenger(visibleChats));
        setHiddenChatList(sortChatsLikeMessenger(hiddenChats));
        
        console.log("✅ ChatList refreshed successfully");
      } catch (error) {
        console.error("❌ Error refreshing ChatList:", error);
      }
    };

    // Đăng ký event listener
    window.addEventListener('refreshChatList', handleRefreshChatList);

    // Cleanup
    return () => {
      window.removeEventListener('refreshChatList', handleRefreshChatList);
    };
  }, [userId]);
// ✅ AUTO-SELECT chat nếu selectedChatId từ URL params và chatList đã load
  useEffect(() => {
    if (!selectedChatId) return; // Không có selectedChatId từ URL
    if (!chatList || chatList.length === 0) return; // ChatList chưa load

    // Tìm xem chat có tồn tại trong danh sách không
    const existingChat = chatList.find(c => c.maCuocTroChuyen === selectedChatId);
    if (!existingChat) return; // Chat không tồn tại

    // ✅ Auto-select chat này
    if (onSelectChat) {
      console.log(`[ChatList] Auto-selecting chat from URL params: ${selectedChatId}`);
      onSelectChat(existingChat);
    }
  }, [chatList, selectedChatId, onSelectChat]);

  // ✅ NEW: Auto-mark as read khi selectedChatId thay đổi (ChatBox được mở)
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  // ✅ NEW: Auto-mark as read khi selectedChatId thay đổi (ChatBox được mở)
  useEffect(() => {
    if (!selectedChatId || !userId) return;

    // Mark conversation as read khi ChatBox được mở
    markConversationAsRead(selectedChatId, userId)
      .then((success) => {
        if (success) {
          console.log(`✅ Auto-marked ${selectedChatId} as read when ChatBox opened`);
          // Update UI: set hasUnreadMessages = false
          setChatList(prev => prev.map(c => 
            c.maCuocTroChuyen === selectedChatId 
              ? { ...c, hasUnreadMessages: false } 
              : c
          ));
          // Dispatch refresh event for navbar badge
          window.dispatchEvent(new Event("refreshChatList"));
        }
      })
      .catch(err => console.warn("Failed to auto-mark as read:", err));
  }, [selectedChatId, userId, markConversationAsRead]);
  // Lọc danh sách chat theo tiêu chí
  const filteredChats = (() => {
    let chatsToFilter = [];
    
    if (filterMode === "all") {
      chatsToFilter = chatList;
    } else if (filterMode === "hidden") {
      chatsToFilter = hiddenChatList;
    }
    
    return chatsToFilter.filter((chat) =>
      chat.tieuDeTinDang?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  })();

  // Hiển thị chế độ ẩn/hiện cuộc trò chuyện - cập nhật với database
  const toggleHideMode = () => {
    if (isHideMode) {
      setSelectedToHide([]);
    }
    setIsHideMode(!isHideMode);
    setShowDeleteConfirm(null);
    setExpandedChatId(null);
  };

  const confirmHideChats = async () => {
  if (selectedToHide.length === 0) return;
  
  try {
  await bulkSetChatState(selectedToHide, true, false, userId);

    const chatsToHide = chatList.filter(chat =>
      selectedToHide.includes(chat.maCuocTroChuyen)
    );

    setChatList((prev) =>
      prev.filter(chat => !selectedToHide.includes(chat.maCuocTroChuyen))
    );
    setHiddenChatList((prev) => {
      const updatedList = [
        ...prev,
        ...chatsToHide.map(chat => ({ ...chat, hasUnreadMessages: false }))
      ];
      return sortChatsLikeMessenger(updatedList);
    });

    setSelectedToHide([]);
    setIsHideMode(false);
    setFilterMode("all");

    // ✅ Reset chat đang mở về banner nếu nó nằm trong selectedToHide
    if (selectedToHide.includes(selectedChatId)) {
      onSelectChat(null);
    }
  } catch (error) {
    console.error("Lỗi ẩn cuộc trò chuyện:", error);
  }
};

  const confirmUnhideChats = async () => {
    if (selectedToHide.length === 0) return;
    
    try {
      // Cập nhật trạng thái trong database
  await bulkSetChatState(selectedToHide, false, false, userId);
      
      // Lấy các chat cần gỡ ẩn
      const chatsToUnhide = hiddenChatList.filter(chat => selectedToHide.includes(chat.maCuocTroChuyen));
      
      // Di chuyển từ danh sách ẩn sang danh sách chính
      setHiddenChatList((prev) => prev.filter(chat => !selectedToHide.includes(chat.maCuocTroChuyen)));
      setChatList((prev) => {
        const updatedList = [...prev, ...chatsToUnhide];
        return sortChatsLikeMessenger(updatedList);
      });
      
      setSelectedToHide([]);
      setIsHideMode(false);
      setFilterMode("all");
    } catch (error) {
      console.error("Lỗi gỡ ẩn cuộc trò chuyện:", error);
    }
  };

  const cancelHideChats = () => {
    setSelectedToHide([]);
    setIsHideMode(false);
  };

  const onCheckboxChange = (maCuocTroChuyen, checked) => {
    setSelectedToHide((prev) => {
      if (checked) {
        return [...prev, maCuocTroChuyen];
      } else {
        return prev.filter((id) => id !== maCuocTroChuyen);
      }
    });
  };

  return (
  <div className="chatlist-container">
    {/* ==================================================================== */}
    {/* PHẦN HEADER THAY ĐỔI THEO ĐIỀU KIỆN */}
    {/* ==================================================================== */}
    {showFriendList ? (
      // A. Header khi đang ở màn hình Bạn bè: CHỈ CÓ NÚT QUAY LẠI
      <div className="chatlist-back-header" onClick={() => setShowFriendList(false)}>
        <ArrowLeft  size={20} className="icon" />
        <h3>Bạn bè</h3>
      </div>
    ) : (
      // B. Header gốc cho màn hình Mua bán (hiển thị mặc định)
      <div className="chatlist-header-wrapper">
        <div className="chatlist-search">
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <button
          className="chatlist-filter-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            const rect = btn.getBoundingClientRect();
            const popoverWidth = 220;
            const margin = 8;
            let left = rect.right - popoverWidth;
            left = Math.max(margin, Math.min(left, window.innerWidth - popoverWidth - margin));
            const estimatedHeight = 110;
            let top = rect.bottom + 6;
            let placeAbove = false;
            if (rect.bottom + estimatedHeight + margin > window.innerHeight) {
              top = rect.top - estimatedHeight - 6;
              placeAbove = true;
            }
            setPopoverStyle({ 
              position: 'fixed', 
              top: Math.round(top) + 'px', 
              left: Math.round(left) + 'px', 
              width: popoverWidth + 'px', 
              transformOrigin: placeAbove ? 'bottom right' : 'top right' 
            });
            setExpandedChatId(expandedChatId === 'header-filter' ? null : 'header-filter');
          }}
          title="Tùy chọn lọc"
        >
          <FiMoreVertical size={20} />
        </button>
        </div>
      </div>
    )}

    {/* ==================================================================== */}
    {/* PHẦN DANH SÁCH THAY ĐỔI THEO ĐIỀU KIỆN */}
    {/* ==================================================================== */}
    <div className="chatlist-scrollable">
      {showFriendList ? (
        // A. Nếu đang xem bạn bè => CHỈ HIỂN THỊ DANH SÁCH BẠN BÈ
        <FriendChatList
          userId={userId}
          onSelectChat={onSelectChat}
          selectedChatId={selectedChatId}
        />
      ) : (
        // B. Nếu ở màn hình mua bán => HIỂN THỊ CẢ NÚT "BẠN BÈ" VÀ DANH SÁCH MUA BÁN
        <>
          {/* Item đặc biệt UniMarket Bạn bè */}
          <div
            className={`chatlist-item special-item`}
            onClick={() => {
              setShowFriendList(true); // Bật chế độ FriendList
              onSelectChat(null);      // Ẩn ChatBox đang mở
            }}
          >
            <div className="chatlist-item-content">
              <div className="chatlist-item-title">
                <Users size={20} className="icon" />
                <span className="chatlist-item-title-text">UniMarket Bạn bè</span>
              </div>
              <div className="chatlist-item-last">Xem danh sách bạn bè của bạn</div>
            </div>
          </div>
          
          {/* Danh sách chat mua bán */}
          {filteredChats.length === 0 ? (
            <p className="chatlist-empty">Không có cuộc trò chuyện nào</p>
          ) : (
            filteredChats.map((chat, idx) => (
              <div key={chat.maCuocTroChuyen || idx}>
                <div
                  className={`chatlist-item ${chat.isBlocked ? "blocked" : ""} ${
                    chat.maCuocTroChuyen === selectedChatId ? "chatlist-item-selected" : ""
                  }`}
                  onClick={() => {
                    if (!isHideMode) {
                      setShowFriendList(false);
                      // ✅ NEW: Mark as read when clicking chat
                      if (chat.hasUnreadMessages) {
                        console.log(`📌 Clicking chat ${chat.maCuocTroChuyen}, marking as read...`);
                        // Update UI immediately
                        setChatList(prev => prev.map(c => 
                          c.maCuocTroChuyen === chat.maCuocTroChuyen 
                            ? { ...c, hasUnreadMessages: false } 
                            : c
                        ));
                        
                        // Call API to persist to backend
                        markConversationAsRead(chat.maCuocTroChuyen, userId)
                          .then((success) => {
                            if (success) {
                              window.dispatchEvent(new Event("refreshChatList"));
                            }
                          })
                          .catch((err) => console.error("Error marking chat as read:", err));
                      }
                      
                      onSelectChat(chat.maCuocTroChuyen);
                    }
                  }}
                >
                  {/* Checkbox khi chế độ ẩn hiện */}
                  {(isHideMode && (filterMode === "all" || filterMode === "hidden")) && (
                      <input
                        type="checkbox"
                        checked={selectedToHide.includes(chat.maCuocTroChuyen)}
                        onChange={(e) => onCheckboxChange(chat.maCuocTroChuyen, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="chatlist-hide-checkbox"
                        title={filterMode === "all" ? "Chọn để ẩn" : "Chọn để gỡ ẩn"}
                        style={{ pointerEvents: "auto" }}
                      />
                  )}

                 {/* Avatar: nếu là AI thì dùng ảnh Uni.AI, còn lại dùng ảnh tin đăng */}
                  {String(chat.maCuocTroChuyen).startsWith('ai-assistant-') ? (
                    <img src={'/images/uni-ai-avatar.png'} alt="Uni.AI" className="chatlist-item-image ai-avatar" />
                  ) : (
                    <img src={getFullImageUrl(chat.anhDaiDienTinDang)} alt="Ảnh tin đăng" className="chatlist-item-image" />
                  )}

                  {/* Nội dung hội thoại */}
                  <div className="chatlist-item-content">
                    <div className="chatlist-item-title"><span className="chatlist-item-title-text">{chat.tieuDeTinDang}</span></div>
                    {/* Không hiển thị giá cho chat AI */}
                    {!String(chat.maCuocTroChuyen).startsWith('ai-assistant-') && (
                      <div className="chatlist-item-price">
                        Giá:{" "}
                        {chat.giaTinDang?.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </div>
                    )}
                      <div
  className="chatlist-item-info"
  style={{ fontWeight: chat.hasUnreadMessages ? "bold" : "normal" }}
>
  {chat.maNguoiGuiCuoi === userId ? "Bạn" : (String(chat.maCuocTroChuyen).startsWith('ai-assistant-') ? 'Uni.AI' : chat.tenNguoiConLai)}{" "} - {" "}
  {chat.isEmpty
    ? "Chưa có tin nhắn"
    : chat.isRecalled ? (
        <span className="recalled-preview">Đã thu hồi tin nhắn</span>
      )
    : chat.loaiTinNhanCuoi === "image" ? (
        <span className="icon-indicator">
          <Camera size={14} /> Ảnh
        </span>
      )
    : chat.loaiTinNhanCuoi === "video" ? (
        <span className="icon-indicator">
          <Video size={14} /> Video
        </span>
      )
    : formatChatPreview(chat.tinNhanCuoi, String(chat.maCuocTroChuyen).startsWith('ai-assistant-'))}
</div>
                  </div>

                  {/* Menu tuỳ chọn (nút 3 chấm + popover) */}
                  {!chat.isBlocked && !isHideMode && (
                    <div className="chatlist-menu-wrapper" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="chatlist-menu-btn"
                        onClick={(e) => handleMenuClick(e, chat.maCuocTroChuyen)}
                        title="Tùy chọn"
                        ref={(el) => (menuButtonRefs.current[chat.maCuocTroChuyen] = el)}
                      >
                        <FiMoreVertical size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>

    {/* Modal xác nhận xoá (giữ nguyên) */}
    {showDeleteConfirm && (
      <div className="chatlist-delete-confirm-overlay">
        <div className="chatlist-delete-confirm-modal">
          <div className="chatlist-delete-confirm-content">
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?</p>
            <p className="chatlist-delete-note">
              Lưu ý: Cuộc trò chuyện chỉ bị xóa ở phía bạn.
            </p>
          </div>
          <div className="chatlist-delete-confirm-buttons">
            <button
              className="chatlist-btn-delete-confirm"
              onClick={handleConfirmDelete}
            >
              Xóa
            </button>
            <button
              className="chatlist-btn-delete-cancel"
              onClick={handleCancelDelete}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Quick Message Modal */}
    <QuickMessageModal
      show={showQuickMessageModal}
      quickMessages={quickMessages}
      editingId={editingId}
      editingContent={editingContent}
      onClose={() => setShowQuickMessageModal(false)}
      onContentChange={setEditingContent}
      onSave={saveQuickMessages}
      onDelete={deleteQuickMessage}
      onEdit={startEditMessage}
      onCancelEdit={cancelEdit}
      isLoading={isLoadingQuickMessages}
      isSaving={isSavingQuickMessages}
    />

    {/* Portal popover: render outside list so it won't be clipped */}
    <ChatListPopoverPortal
      expandedChatId={expandedChatId}
      popoverStyle={popoverStyle}
      onToggleHide={handleToggleHide}
      handleShowDeleteConfirm={handleShowDeleteConfirm}
      combinedChats={[...chatList, ...hiddenChatList]}
      filterMode={filterMode}
      setFilterMode={setFilterMode}
      toggleHideMode={toggleHideMode}
      chatList={chatList}
      hiddenChatList={hiddenChatList}
      setShowQuickMessageModal={setShowQuickMessageModal}
      setExpandedChatId={setExpandedChatId}
    />

    {/* ==================================================================== */}
    {/* ✨ THANH XÁC NHẬN CHỈ HIỂN THỊ KHI ĐANG Ở CHẾ ĐỘ CHỌN ✨ */}
    {/* ==================================================================== */}
    {!showFriendList && isHideMode && (
      <div className={`chatlist-hide-button-container`}>
        {filterMode === "all" ? (
          <>
            <button
              onClick={confirmHideChats}
              disabled={selectedToHide.length === 0}
              className="chatlist-btn-hide-chat chatlist-btn-confirm"
            >
              Xác nhận ẩn ({selectedToHide.length})
            </button>
            <button
              onClick={cancelHideChats}
              className="chatlist-btn-hide-chat chatlist-btn-cancel"
            >
              Hủy
            </button>
          </>
        ) : (
          <>
            <button
              onClick={confirmUnhideChats}
              disabled={selectedToHide.length === 0}
              className="chatlist-btn-hide-chat chatlist-btn-confirm"
            >
              Xác nhận gỡ ẩn ({selectedToHide.length})
            </button>
            <button
              onClick={cancelHideChats}
              className="chatlist-btn-hide-chat chatlist-btn-cancel"
            >
              Hủy
            </button>
          </>
        )}
      </div>
    )}
  </div>
);
};

export default ChatList;

// Render popover as portal so it can overlay other UI (hide bar) without being clipped.
function ChatListPopoverPortal({ expandedChatId, popoverStyle, onClose, onDelete, onToggleHide, combinedChats, handleShowDeleteConfirm, filterMode, setFilterMode, toggleHideMode, chatList, hiddenChatList, setShowQuickMessageModal, setExpandedChatId }) {
  if (!expandedChatId) return null;

  // Luôn lấy chat mới nhất từ combinedChats để đảm bảo realtime
  const getLatestChat = () => {
    return combinedChats.find(c => c.maCuocTroChuyen === expandedChatId);
  };
  
  // Check trực tiếp xem chat này ở tab nào để biết trạng thái isHidden
  const getIsHiddenState = () => {
    const inChatList = chatList.find(c => c.maCuocTroChuyen === expandedChatId);
    if (inChatList) return false; // Nằm trong danh sách chính => không bị ẩn
    
    const inHiddenList = hiddenChatList.find(c => c.maCuocTroChuyen === expandedChatId);
    if (inHiddenList) return true; // Nằm trong danh sách ẩn => đã bị ẩn
    
    // Fallback: lấy từ chat object
    const chat = getLatestChat();
    return chat?.isHidden || false;
  };

  // If it's the header filter menu
  if (expandedChatId === 'header-filter') {
    return createPortal(
      <div
        className="chatlist-menu-popover"
        style={{ ...popoverStyle, position: popoverStyle?.position || 'fixed' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="chatlist-menu-group">
          <button 
            className={`chatlist-menu-popover-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={(e) => { 
              e.stopPropagation(); 
              setFilterMode('all');
            }}
          >
            <FiList size={18} className="menu-icon-svg" />
            <span>Tất cả</span>
          </button>
          <button 
            className={`chatlist-menu-popover-btn ${filterMode === 'hidden' ? 'active' : ''}`}
            onClick={(e) => { 
              e.stopPropagation(); 
              setFilterMode('hidden');
            }}
          >
            <FiHidden size={18} className="menu-icon-svg" />
            <span>Tin đã ẩn</span>
          </button>
        </div>
        <div className="chatlist-menu-divider"></div>
        <button 
          className="chatlist-menu-popover-btn"
          onClick={(e) => { 
            e.stopPropagation(); 
            toggleHideMode();
          }}
        >
          <FiCheckSquare size={18} className="menu-icon-svg" />
          <span>Chọn nhiều hội thoại</span>
        </button>
        <div className="chatlist-menu-divider"></div>
        <button 
          className="chatlist-menu-popover-btn"
          onClick={(e) => { 
            e.stopPropagation(); 
            console.log('[ChatList] Opening quick message modal');
            setShowQuickMessageModal(true);
            try {
              // expandedChatId should already be null from parent
              // but just in case we're in a context where it's needed
            } catch(err) {
              console.warn('Note about state:', err);
            }
          }}
        >
          <FiMessageSquare size={18} className="menu-icon-svg" />
          <span>Quản lý tin nhắn nhanh</span>
        </button>
      </div>,
      document.body
    );
  }

  // If it's a chat item menu
  const chat = getLatestChat();
  if (!chat) return null;
  
  const isCurrentlyHidden = getIsHiddenState();

  return createPortal(
    <div
      className="chatlist-menu-popover"
      style={{ ...popoverStyle, position: popoverStyle?.position || 'fixed' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="chatlist-menu-popover-btn chatlist-delete-btn-expanded" onClick={(e) => { e.stopPropagation(); handleShowDeleteConfirm(chat.maCuocTroChuyen); }}>
        <FiTrash2 size={16} />
        <span style={{marginLeft:8}}>Xóa cuộc trò chuyện</span>
      </button>
      <button className="chatlist-menu-popover-btn chatlist-hide-btn-expanded" onClick={(e) => { e.stopPropagation(); onToggleHide(chat.maCuocTroChuyen, isCurrentlyHidden); }}>
        {isCurrentlyHidden ? (
          <>
            <FiEye size={16} />
            <span style={{marginLeft:8}}>Gỡ ẩn hội thoại</span>
          </>
        ) : (
          <>
            <FiEyeOff size={16} />
            <span style={{marginLeft:8}}>Ẩn hội thoại</span>
          </>
        )}
      </button>
    </div>,
    document.body
  );
}
