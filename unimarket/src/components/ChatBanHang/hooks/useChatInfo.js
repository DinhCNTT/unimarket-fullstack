import { useState, useEffect, useMemo, useRef } from "react";
import api from "../../../services/api";

const DEFAULT_USER_STATE = {
  id: "",
  avatar: "",
  ten: "",
  isOnline: false,
  lastOnlineTime: null,
  formattedLastSeen: null,
};

const DEFAULT_POST_STATE = {
  tieuDe: "",
  gia: 0,
  anh: "",
  maTinDang: null,
  avatarChuSanPham: "",
  tenChuSanPham: "",
  isOnline: false,
  lastOnlineTime: null,
  formattedLastSeen: null,
  maChuSanPham: null,
  isPostDeleted: false,
};

export const useChatInfo = (maCuocTroChuyen, user, isConnected) => {
  const [infoTinDang, setInfoTinDang] = useState(DEFAULT_POST_STATE);
  const [infoNguoiConLai, setInfoNguoiConLai] = useState(DEFAULT_USER_STATE);
  const [maNguoiConLai, setMaNguoiConLai] = useState(null);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [loadedChatId, setLoadedChatId] = useState(null);

  // --- Helpers ---
  const fetchUserStatus = async (userId, type) => {
    if (!userId) return null;
    try {
      // console.log(`[API CALL] Checking status for ${type}: ${userId}`);
      const response = await api.get(`/User/status/${userId}`);
      return response.data
        ? {
            isOnline: response.data.isOnline,
            lastActive: response.data.lastActive,
            formattedLastSeen: response.data.formattedLastSeen,
          }
        : null;
    } catch (error) {
      console.error("Error fetching user status:", error);
      return null;
    }
  };

  // --- Effect 1: Fetch Chat Info ---
  useEffect(() => {
    if (!maCuocTroChuyen || !user?.id) return;
    setLoadedChatId(null); 

    const fetchChatInfo = async () => {
      // (Logic AI Chat cũ giữ nguyên...)
      if (String(maCuocTroChuyen).startsWith("ai-assistant-")) {
        setInfoTinDang({ ...DEFAULT_POST_STATE, tieuDe: "Uni.AI", anh: "/images/uni-ai-avatar.png", avatarChuSanPham: "/images/uni-ai-avatar.png", tenChuSanPham: "Uni.AI", isOnline: true });
        setMaNguoiConLai("uni.ai");
        setInfoNguoiConLai({ ...DEFAULT_USER_STATE, id: "uni.ai", avatar: "/images/uni-ai-avatar.png", ten: "Uni.AI", isOnline: true });
        setLoadedChatId(maCuocTroChuyen);
        return;
      }

      try {
        const res = await api.get(`/chat/info/${maCuocTroChuyen}`);
        const data = res.data;

        // Set state ban đầu...
        setInfoTinDang({
          tieuDe: data.tieuDeTinDang,
          gia: data.giaTinDang,
          anh: data.anhDaiDienTinDang,
          maTinDang: data.maTinDang,
          avatarChuSanPham: data.avatarChuSanPham || "",
          tenChuSanPham: data.tenChuSanPham || "",
          isOnline: data.trangThaiChuSanPham?.isOnline || false,
          lastOnlineTime: data.trangThaiChuSanPham?.lastActive || null,
          formattedLastSeen: data.trangThaiChuSanPham?.formattedLastSeen || null,
          maChuSanPham: data.maChuSanPham || null,
          isPostDeleted: data.isPostDeleted || false,
        });

        const resParticipants = await api.get(`/chat/user/${user.id}`);
        const chats = resParticipants.data;
        const currentChat = Array.isArray(chats) ? chats.find((c) => c.maCuocTroChuyen === maCuocTroChuyen) : null;

        if (currentChat) {
          const otherUserId = currentChat.maNguoiConLai;
          setMaNguoiConLai(otherUserId);
          setInfoNguoiConLai({
            id: otherUserId,
            avatar: data.avatarNguoiConLai || "",
            ten: data.tenNguoiConLai || "",
            isOnline: data.trangThaiNguoiConLai?.isOnline || false,
            lastOnlineTime: data.trangThaiNguoiConLai?.lastActive || null,
            formattedLastSeen: data.trangThaiNguoiConLai?.formattedLastSeen || null,
          });

          // (Logic Check Block cũ...)
          Promise.all([
            api.get(`/chat/check-block/${user.id}/${otherUserId}`),
            api.get(`/chat/check-block/${otherUserId}/${user.id}`),
          ]).then(([resMe, resOther]) => {
            setIsBlockedByMe(resMe.data.isBlocked || resMe.data.IsBlocked);
            setIsBlockedByOther(resOther.data.isBlocked || resOther.data.IsBlocked);
          });
        }
        setLoadedChatId(maCuocTroChuyen);
      } catch (error) {
        if (error?.response?.status === 404 && String(maCuocTroChuyen).startsWith("ai-assistant-")) return;
        console.error("Lỗi chat info:", error);
      }
    };
    fetchChatInfo();
  }, [maCuocTroChuyen, user?.id]);


  // --- Effect 2: Polling Status (DEBUG MODE) ---
  useEffect(() => {
    if (!user?.id) return;

    const refreshStatus = async () => {
      if (loadedChatId !== maCuocTroChuyen) return;

      // 1. Refresh User
      if (infoNguoiConLai.id && infoNguoiConLai.id !== "uni.ai") {
        const status = await fetchUserStatus(infoNguoiConLai.id, "User");
        if (status) {
          setInfoNguoiConLai((prev) => {
            // LOG LOGIC
            const willOverwrite = isConnected && !prev.isOnline && status.isOnline;
            
            if (willOverwrite) {
                console.warn(`🛑 [BLOCKED] API muốn set Online nhưng SignalR đang nối!`);
                console.log({
                    isConnected: isConnected,
                    "Current Local": prev.isOnline ? "Online" : "Offline",
                    "API Says": status.isOnline ? "Online" : "Offline",
                    "Action": "BỎ QUA API"
                });
                return prev; // Giữ nguyên
            } else if (!prev.isOnline && status.isOnline) {
                // Trường hợp này API set Online thành công (do isConnected = false hoặc logic khác)
                console.log(`⚠️ [ALLOWED] API set User thành Online. Lý do: isConnected = ${isConnected}`);
            }

            return {
              ...prev,
              isOnline: status.isOnline,
              lastOnlineTime: status.lastActive,
              formattedLastSeen: status.formattedLastSeen,
            };
          });
        }
      }

      // 2. Refresh Chủ SP (Tương tự)
      if (infoTinDang.maChuSanPham && infoTinDang.maChuSanPham !== "uni.ai") {
        const status = await fetchUserStatus(infoTinDang.maChuSanPham, "ChuSP");
        if (status) {
          setInfoTinDang((prev) => {
            const willOverwrite = isConnected && !prev.isOnline && status.isOnline;
            if (willOverwrite) return prev; 
            return {
              ...prev,
              isOnline: status.isOnline,
              lastOnlineTime: status.lastActive,
              formattedLastSeen: status.formattedLastSeen,
            };
          });
        }
      }
    };

    const interval = setInterval(refreshStatus, 10000); // Test nhanh 10s một lần
    return () => clearInterval(interval);
  }, [user?.id, infoNguoiConLai.id, infoTinDang.maChuSanPham, loadedChatId, maCuocTroChuyen, isConnected]);

  // Display Logic
  const isStaleData = maCuocTroChuyen !== loadedChatId;
  const displayInfoTinDang = isStaleData ? DEFAULT_POST_STATE : infoTinDang;
  const displayInfoNguoiConLai = isStaleData ? DEFAULT_USER_STATE : infoNguoiConLai;
  
  const isChuSanPham = useMemo(() => displayInfoTinDang && user && user.id === displayInfoTinDang.maChuSanPham, [displayInfoTinDang, user]);

  return {
    infoTinDang: displayInfoTinDang, setInfoTinDang,
    infoNguoiConLai: displayInfoNguoiConLai, setInfoNguoiConLai,
    maNguoiConLai: isStaleData ? null : maNguoiConLai, setMaNguoiConLai,
    isBlockedByMe: isStaleData ? false : isBlockedByMe, setIsBlockedByMe,
    isBlockedByOther: isStaleData ? false : isBlockedByOther, setIsBlockedByOther,
    displayAvatar: isChuSanPham ? displayInfoNguoiConLai.avatar : displayInfoTinDang.avatarChuSanPham,
    displayTen: isChuSanPham ? displayInfoNguoiConLai.ten : displayInfoTinDang.tenChuSanPham,
    displayIsOnline: isChuSanPham ? displayInfoNguoiConLai.isOnline : displayInfoTinDang.isOnline,
    displayLastOnline: isChuSanPham ? displayInfoNguoiConLai.lastOnlineTime : displayInfoTinDang.lastOnlineTime,
    displayFormattedLastSeen: isChuSanPham ? displayInfoNguoiConLai.formattedLastSeen : displayInfoTinDang.formattedLastSeen,
    displayUserId: isChuSanPham ? displayInfoNguoiConLai.id : displayInfoTinDang.maChuSanPham,
    shouldShowStatus: !!(isChuSanPham ? (displayInfoNguoiConLai.id && displayInfoNguoiConLai.ten) : (displayInfoTinDang.maChuSanPham && displayInfoTinDang.tenChuSanPham)),
  };
};