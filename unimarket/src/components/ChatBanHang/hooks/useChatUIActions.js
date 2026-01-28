//src/components/ChatBanHang/hooks/useChatUIActions.js
//Quản lý các tương tác người dùng (Mở Modal, Sidebar, Input) và các hành động quan trọng (Chặn user, Xóa chat).
import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../../services/api";
import { deleteConversationForMe, setChatState } from "../../../services/chatService";

export const useChatUIActions = (user, maCuocTroChuyen, maNguoiConLai) => {
  const navigate = useNavigate();

  // UI States
  const [modalImage, setModalImage] = useState(null);
  const [videoModalUrl, setVideoModalUrl] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tinNhan, setTinNhan] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showQuickMsgModal, setShowQuickMsgModal] = useState(false);
  const inputRef = useRef(null);

  // --- Handlers ---
  const handleBlockUser = useCallback(async () => {
    const result = await Swal.fire({
      title: "Chặn người dùng?", text: "Người này sẽ không thể gửi tin nhắn cho bạn nữa.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Chặn", cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try { await api.post("/chat/block-user", { BlockerId: user.id, BlockedId: maNguoiConLai }); } 
      catch (error) { Swal.fire("Lỗi", "Không thể chặn người dùng.", "error"); }
    }
  }, [user?.id, maNguoiConLai]);

  const handleUnblockUser = useCallback(async () => {
    const result = await Swal.fire({
      title: "Gỡ chặn?", text: "Bạn sẽ nhận được tin nhắn từ người này.", icon: "question", showCancelButton: true, confirmButtonText: "Gỡ chặn",
    });
    if (result.isConfirmed) {
      try { await api.post("/chat/unblock-user", { BlockerId: user.id, BlockedId: maNguoiConLai }); } 
      catch (error) { Swal.fire("Lỗi", "Không thể gỡ chặn.", "error"); }
    }
  }, [user?.id, maNguoiConLai]);

  const handleDeleteConversation = useCallback(async () => {
    if (!maCuocTroChuyen || !user?.id) return;
    const result = await Swal.fire({
      title: "Xác nhận xóa cuộc trò chuyện", text: "Cuộc trò chuyện sẽ bị xóa ở phía bạn.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Xóa",
    });

    if (result.isConfirmed) {
      try {
        const deleteRes = await deleteConversationForMe(maCuocTroChuyen, user.id);
        try { await setChatState(maCuocTroChuyen, false, true, user.id); } catch (e) {}
        window.dispatchEvent(new Event("refreshChatList"));

        // Update LocalStorage logic
        try {
          const raw = localStorage.getItem("deletedConversations");
          const map = raw ? JSON.parse(raw) : {};
          const serverHidden = deleteRes && (deleteRes.hidden || deleteRes.Hidden);
          const thoiGianAn = serverHidden && (serverHidden.ThoiGianAn || serverHidden.thoiGianAn) 
             ? new Date(serverHidden.ThoiGianAn || serverHidden.thoiGianAn).toISOString() : new Date().toISOString();
          map[maCuocTroChuyen] = thoiGianAn;
          localStorage.setItem("deletedConversations", JSON.stringify(map));
        } catch (e) { console.warn("LocalStorage error", e); }

        await Swal.fire("Thành công", "Đã xóa cuộc trò chuyện.", "success");
        navigate("/chat");
      } catch (err) {
        console.error("Lỗi xóa:", err);
        Swal.fire("Lỗi", "Không thể xóa cuộc trò chuyện.", "error");
      }
    }
  }, [maCuocTroChuyen, user?.id, navigate]);

  return {
    modalImage, setModalImage, openImageModal: setModalImage, closeImageModal: () => setModalImage(null),
    videoModalUrl, setVideoModalUrl, openVideoModal: setVideoModalUrl, closeVideoModal: () => setVideoModalUrl(null),
    isSidebarOpen, toggleSidebar: () => setIsSidebarOpen(p => !p), closeSidebar: () => setIsSidebarOpen(false),
    tinNhan, setTinNhan,
    isUploading, setIsUploading,
    showQuickMsgModal, setShowQuickMsgModal,
    inputRef,
    handleBlockUser, handleUnblockUser, handleDeleteConversation
  };
};