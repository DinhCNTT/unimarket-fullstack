// ChatBanHang/hooks/useAiChat.js - DÀNH RIÊNG CHO AI CHAT
import { useState, useEffect, useCallback } from "react";
import { callAiApi, injectChatMessage } from "../../AI/AiHelpers";
import api from "../../../services/api";
import Swal from "sweetalert2";

const PAGE_SIZE = 30;

// ✅ FIX: Hàm map message thông minh, tự động "bóc" JSON bất kể ID người gửi
const mapAiMessage = (msg) => {
  // 1. Xử lý thời gian (Giữ nguyên logic cũ của bạn)
  let timeStr = msg.thoiGianGui || msg.thoiGian;
  if (timeStr && typeof timeStr === "string" && !timeStr.endsWith("Z")) {
    timeStr += "Z";
  }

  const base = {
    ...msg,
    thoiGian: timeStr
      ? new Date(timeStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    thoiGianGui: timeStr || new Date().toISOString(),
    daXem: msg.daXem || false,
    // Logic cũ: base.isAi phụ thuộc vào ID -> Dễ sai nếu ID thay đổi
    isAi: msg.maNguoiGui === "uni.ai" || msg.maNguoiGui === "ai-assistant", 
  };

  // 2. Logic mới: Cố gắng parse nội dung bất kể là ai gửi
  let parsedContent = null;
  let rawContent = msg.noiDung;

  try {
    // Trường hợp 1: Nội dung đã là Object (do axios tự parse)
    if (typeof rawContent === "object" && rawContent !== null) {
      parsedContent = rawContent;
    } 
    // Trường hợp 2: Nội dung là String JSON (thường gặp nhất)
    else if (typeof rawContent === "string") {
      const trimmed = rawContent.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        parsedContent = JSON.parse(trimmed);
      }
    }
  } catch (e) {
    // Parse lỗi thì thôi, coi như tin nhắn thường
  }

  // 3. Nếu Parse thành công và tìm thấy các key đặc trưng của AI
  if (parsedContent) {
    const replyText =
      parsedContent.replyText ||
      parsedContent.ReplyText ||
      parsedContent.reply ||
      parsedContent.message ||
      parsedContent.text ||
      parsedContent.content; // Thêm vài case dự phòng

    // Nếu tìm thấy text sạch -> Đây chắc chắn là tin nhắn AI (hoặc hệ thống)
    if (replyText) {
      return {
        ...base,
        noiDung: replyText, // ✅ Lấy nội dung sạch
        isAi: true, // ✅ Force set là AI để hiển thị icon Bot
        aiSuggestions: parsedContent.suggestedProducts || parsedContent.SuggestedProducts || parsedContent.suggestions || null,
        clarifyingQuestion: parsedContent.clarifyingQuestion || parsedContent.ClarifyingQuestion || null,
      };
    }
  }

  // Trả về mặc định nếu không phải JSON đặc biệt
  return base;
};

export const useAiChat = (maCuocTroChuyen, user) => {
  const [danhSachTin, setDanhSachTin] = useState([]);
  const [isSending, setIsSending] = useState(false); // Chống spam gửi
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 1. Listen Injected Messages (Optimistic UI)
  useEffect(() => {
    const handleInjectMessage = (event) => {
      const msg = event.detail;
      if (!msg || msg.maCuocTroChuyen !== maCuocTroChuyen) return;

      const mapped = mapAiMessage({
        ...msg,
        thoiGianGui: msg.thoiGianGui || new Date().toISOString(),
      });

      setDanhSachTin((prev) => {
        if (prev.some(p => p.maTinNhan === mapped.maTinNhan)) return prev;
        return [...prev, mapped];
      });
    };

    window.addEventListener('InjectSampleMessage', handleInjectMessage);
    return () => window.removeEventListener('InjectSampleMessage', handleInjectMessage);
  }, [maCuocTroChuyen]);

  // 2. Fetch History (1 lần)
  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;

    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
          params: { userId: user.id, page: 1, pageSize: PAGE_SIZE },
        });
        if (response.data) {
          const messages = response.data.map(mapAiMessage).reverse();
          setDanhSachTin(messages);
          setPage(1);
          setHasMore(messages.length >= PAGE_SIZE);
        }
      } catch (error) {
        console.error("Lỗi lấy lịch sử AI Chat:", error);
      }
    };
    fetchHistory();
  }, [maCuocTroChuyen, user?.id]);

  // 3. Send Message (AI Logic)
  const sendMessageService = useCallback(async (text, type = "text") => {
    if (!maCuocTroChuyen || !user?.id) return;
    if (isSending) return; // Chặn spam nút gửi

    setIsSending(true);
    try {
      // a. User message (optimistic)
      const userMsg = {
        maTinNhan: `local-${Date.now()}`,
        maCuocTroChuyen,
        noiDung: text,
        maNguoiGui: user.id,
        loaiTinNhan: type,
        thoiGianGui: new Date().toISOString(),
        daXem: false,
      };
      injectChatMessage(userMsg);

      // b. Gọi AI API với context history
      const historyContext = danhSachTin.slice(-7).map((m) => ({
        role: m.maNguoiGui === user.id ? "user" : "assistant",
        content: typeof m.noiDung === "string" ? m.noiDung : JSON.stringify(m.noiDung),
      }));
      historyContext.push({ role: "user", content: text });

      const res = await callAiApi(text, user.id, historyContext);

      console.log("[AI] Full Response:", res);
      console.log("[AI] Response Type:", typeof res);
      console.log("[AI] Response Keys:", res ? Object.keys(res) : "null");

      if (!res) {
        throw new Error("AI API returned empty response");
      }

      // Tìm text response từ nhiều format có thể
      const aiReplyText = res?.replyText || 
                         res?.ReplyText || 
                         res?.reply ||
                         res?.Reply ||
                         res?.message ||
                         res?.Message ||
                         (typeof res === 'string' ? res : null) ||
                         "Uni.AI: ...";

      console.log("[AI] Using reply text:", aiReplyText);

      // c. Inject AI response
      const aiMsg = {
        maTinNhan: `ai-${Date.now()}`,
        maCuocTroChuyen,
        noiDung: aiReplyText,
        maNguoiGui: "uni.ai",
        loaiTinNhan: "text",
        thoiGianGui: new Date().toISOString(),
        daXem: false,
        isAi: true,
        aiSuggestions: res?.suggestedProducts || res?.SuggestedProducts || null,
        clarifyingQuestion: res?.clarifyingQuestion || res?.ClarifyingQuestion || null,
      };

      console.log("[AI] Injecting AI message:", aiMsg);
      injectChatMessage(aiMsg);

      // d. (Optional) Refresh history từ server để đồng bộ real ID
      try {
        const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
          params: { userId: user.id, page: 1, pageSize: PAGE_SIZE },
        });
        if (response.data) {
          const messages = response.data.map(mapAiMessage).reverse();
          setDanhSachTin(messages);
        }
      } catch (err) {
        console.warn("[AI] Could not refresh history:", err?.message);
      }
    } catch (err) {
      console.error("[AI] Send error:", err);
      Swal.fire("Lỗi", "AI không phản hồi, vui lòng thử lại.", "error");
    } finally {
      setIsSending(false);
    }
  }, [maCuocTroChuyen, user?.id, danhSachTin]);

  // 4. Load More
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    await new Promise((r) => setTimeout(r, 500));

    try {
      const response = await api.get(`/chat/history/${maCuocTroChuyen}`, {
        params: { userId: user.id, page: nextPage, pageSize: PAGE_SIZE },
      });
      const newMessages = response.data.map(mapAiMessage).reverse();

      if (newMessages.length === 0) {
        setHasMore(false);
      } else {
        setDanhSachTin((prev) => {
          const existingIds = new Set(prev.map((m) => m.maTinNhan));
          const unique = newMessages.filter(m => !existingIds.has(m.maTinNhan));
          return [...unique, ...prev];
        });
        setPage(nextPage);
        setHasMore(newMessages.length >= PAGE_SIZE);
      }
    } catch (e) {
      console.error("[AI] Load more error:", e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, maCuocTroChuyen, user?.id]);

  // ✅ Đánh dấu cuộc trò chuyện là đã đọc
  const markAsRead = useCallback(async () => {
    if (!maCuocTroChuyen || !user?.id) return;
    
    try {
      const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5119";
      const endpoint = `${API_BASE.replace(/\/$/, "")}/api/chat/mark-read`;
      
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maCuocTroChuyen,
          maNguoiXem: user.id,
        }),
        credentials: "include",
      });
      
      console.log("[AI] ✅ Marked conversation as read:", maCuocTroChuyen);
    } catch (err) {
      console.warn("[AI] ⚠️ Failed to mark as read:", err);
      // Silent fail - not critical
    }
  }, [maCuocTroChuyen, user?.id]);

  return {
    danhSachTin,
    isConnected: true, // AI chat luôn coi là connected (dùng REST)
    sendMessageService,
    loadMoreMessages,
    isLoadingMore,
    hasMore,
    markAsRead, // ✅ Now functional instead of dummy
    // Các hàm này AI không dùng nhưng return dummy để tránh lỗi UI
    recallMessage: () => {},
    recallMedia: () => {},
    deleteLocalMessage: () => {},
  };
};
  