import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Lock, XCircle, AlertTriangle, MessageCircle } from "lucide-react";
import React from "react";

export const useChatAction = () => {
  const navigate = useNavigate();

  const getUserId = (u) => u?.id ?? u?.maNguoiDung ?? u?.MaNguoiDung ?? u?.userId ?? u?._id ?? null;
  const getSellerId = (s) => s?.id ?? s?.maNguoiDung ?? s?.MaNguoiDung ?? s?._id ?? null;

  const handleChatWithSeller = async (user, data, onOpenChat) => {
    let effectiveUser = user;
    if (!effectiveUser) {
      try {
        const raw = localStorage.getItem("user") || localStorage.getItem("currentUser") || localStorage.getItem("authUser");
        if (raw) effectiveUser = JSON.parse(raw);
      } catch {}
    }

    const myId = getUserId(effectiveUser);
    const sellerId = getSellerId(data?.nguoiDang);

    // 1. Validate Login
    if (!myId) {
      toast.info("Vui lòng đăng nhập để bắt đầu cuộc trò chuyện.", {
        icon: <Lock size={20} />,
        className: "um-toast um-toast--info",
      });
      return;
    }

    // 2. Validate Seller
    if (!sellerId) {
      toast.error("Không tìm thấy thông tin người bán. Vui lòng thử lại.", {
        icon: <XCircle size={20} />,
        className: "um-toast um-toast--error",
      });
      return;
    }

    // 3. Validate Self-Chat
    if (myId === sellerId) {
      toast.warning("Bạn không thể chat với chính mình.", {
        icon: <AlertTriangle size={20} />,
        className: "um-toast um-toast--warning",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await axios.post(
        "http://localhost:5133/api/chat/start",
        {
          MaNguoiDung1: myId,
          MaNguoiDung2: sellerId,
          MaTinDang: data?.maTinDang,
        },
        { headers }
      );

      const maCuocTroChuyen = response.data?.maCuocTroChuyen ?? response.data?.MaCuocTroChuyen ?? null;

      if (maCuocTroChuyen) {
        toast.success("Đang mở cuộc trò chuyện...", {
          icon: <MessageCircle size={20} />,
          className: "um-toast um-toast--success",
        });

        setTimeout(async () => {
          if (window.location.pathname.includes("/chat")) {
            window.dispatchEvent(new CustomEvent("refreshChatList"));
          }

          if (typeof onOpenChat === "function") {
            onOpenChat(maCuocTroChuyen);
          } else {
            navigate(`/chat/${maCuocTroChuyen}`);
          }
        }, 1000);
      } else {
        throw new Error("No conversation ID returned");
      }
    } catch (error) {
      console.error("Lỗi tạo cuộc trò chuyện:", error);
      if (error?.response) {
        const { status, data: errData } = error.response;
        if (status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn.", { icon: <Lock size={20} /> });
        } else if (status === 403) {
           // Xử lý logic chặn
           let msg = "Bạn không thể nhắn tin với người này.";
           if (typeof errData === "object" && errData !== null) {
             const blocker = errData.blockerName || errData.BlockerName;
             const blocked = errData.blockedName || errData.BlockedName;
             if(blocker && blocked) msg = `${blocker} đã chặn ${blocked}.`;
           }
           toast.error(msg, { icon: <XCircle size={20} /> });
        } else if (status === 400) {
           toast.error("Yêu cầu không hợp lệ.", { icon: <AlertTriangle size={20} /> });
        } else {
           toast.error("Có lỗi xảy ra.", { icon: <XCircle size={20} /> });
        }
      } else {
        toast.error("Không thể tạo cuộc trò chuyện.", { icon: <XCircle size={20} /> });
      }
    }
  };

  return { handleChatWithSeller, getUserId, getSellerId };
};