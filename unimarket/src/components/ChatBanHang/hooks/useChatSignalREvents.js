//src/components/ChatBanHang/hooks/useChatSignalREvents.js
//Lắng nghe sự kiện Realtime từ Server (Online/Offline, Đã xem, Block, Cập nhật tin đăng) để update UI tức thì.
import { useEffect } from "react";

export const useChatSignalREvents = ({
  connection,
  maCuocTroChuyen,
  user,
  maNguoiConLai,
  setInfoNguoiConLai,
  setInfoTinDang,
  setIsBlockedByMe,
  setIsBlockedByOther,
  setDanhSachTin
}) => {
  useEffect(() => {
    if (!connection || !user?.id || !maNguoiConLai) return;

    // 1. User Status Handler
    const userStatusHandler = (data) => {
      const userId = data.userId || data.userid || data.UserId;
      const isOnline = data.isOnline ?? data.IsOnline ?? false;
      const lastActive = data.lastSeen || data.lastActive || data.LastActive || null;
      const formattedLastSeen = data.formattedLastSeen || null;

      setInfoNguoiConLai((prev) => prev.id === userId ? { ...prev, isOnline, lastOnlineTime: isOnline ? null : lastActive, formattedLastSeen } : prev);
      setInfoTinDang((prev) => prev.maChuSanPham === userId ? { ...prev, isOnline, lastOnlineTime: isOnline ? null : lastActive, formattedLastSeen } : prev);
    };

    // 2. Post Update Handler
    const postUpdateHandler = (updatedPost) => {
      const maTinDangHT = maCuocTroChuyen.split("-").pop();
      if (updatedPost.MaTinDang?.toString() === maTinDangHT?.toString()) {
        setInfoTinDang((prev) => ({
          ...prev,
          tieuDe: updatedPost.TieuDe || prev.tieuDe,
          gia: updatedPost.Gia || prev.gia,
          anh: updatedPost.AnhDaiDien || prev.anh,
          maTinDang: updatedPost.MaTinDang || prev.maTinDang,
          isPostDeleted: updatedPost.IsDeleted || false,
        }));
      }
    };

    // 3. Block Handler
    const blockHandler = (data) => {
      const { blockedUserId, actionType } = data;
      if (actionType === "block" && blockedUserId === maNguoiConLai) setIsBlockedByMe(true);
      else if (actionType === "unblock" && blockedUserId === maNguoiConLai) setIsBlockedByMe(false);
      else if (actionType === "blocked_by" && blockedUserId === user.id) setIsBlockedByOther(true);
      else if (actionType === "unblocked_by" && blockedUserId === user.id) setIsBlockedByOther(false);
    };

    // 4. Chat Status Handler
    const chatStatusHandler = (data) => {
      if (data.chatId === maCuocTroChuyen) {
        setIsBlockedByMe(data.isBlocked && data.blockedByMe);
        setIsBlockedByOther(data.isBlocked && !data.blockedByMe);
      }
    };

    // 5. Read Status Handler
    const readStatusHandler = (data) => {
      if (data.maCuocTroChuyen === maCuocTroChuyen && setDanhSachTin) {
        console.log("👀 [ChatBox] Ai đó đã xem tin nhắn:", data);
        setDanhSachTin(prevMessages => 
           prevMessages.map(msg => 
               (msg.maNguoiGui === user.id && msg.maNguoiGui !== data.maNguoiDaXem)
               ? { ...msg, daXem: true, thoiGianXem: data.thoiGianXem }
               : msg
           )
        );
      }
    };

    connection.on("UserStatusChanged", userStatusHandler);
    connection.on("CapNhatTinDang", postUpdateHandler);
    connection.on("UserBlocked", blockHandler);
    connection.on("ChatStatusChanged", chatStatusHandler);
    connection.on("ReceiveReadStatus", readStatusHandler);

    return () => {
      connection.off("UserStatusChanged", userStatusHandler);
      connection.off("CapNhatTinDang", postUpdateHandler);
      connection.off("UserBlocked", blockHandler);
      connection.off("ChatStatusChanged", chatStatusHandler);
      connection.off("ReceiveReadStatus", readStatusHandler);
    };
  }, [connection, user?.id, maNguoiConLai, maCuocTroChuyen, setDanhSachTin, setInfoNguoiConLai, setInfoTinDang, setIsBlockedByMe, setIsBlockedByOther]);
};