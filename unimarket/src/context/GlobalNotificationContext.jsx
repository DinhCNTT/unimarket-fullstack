import React, { createContext, useState, useEffect, useContext } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import api from "../services/api"; 
import { AuthContext } from "./AuthContext"; // Import AuthContext để lấy token chuẩn

export const GlobalNotificationContext = createContext();

export const GlobalNotificationProvider = ({ children }) => {
  const { token } = useContext(AuthContext); // Lấy token từ Context quản lý Auth
  const [connection, setConnection] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- 1. Hàm gọi API lấy số lượng chưa đọc ---
  const fetchUnreadCount = async () => {
    try {
      // Gọi API endpoint lấy số lượng (Backend cần trả về { count: 5 } ví dụ vậy)
      const res = await api.get("/usernotification/unread-count");
      // Đảm bảo data trả về đúng format, fallback về 0 nếu lỗi
      setUnreadCount(res.data?.count || 0);
    } catch (err) {
      console.error("❌ Lỗi lấy badge thông báo:", err);
    }
  };

  // --- 2. Xử lý logic Kết nối & Lấy dữ liệu khi Token thay đổi ---
  useEffect(() => {
    // QUAN TRỌNG: Nếu không có token (chưa đăng nhập), DỪNG LẠI NGAY.
    // Điều này ngăn chặn lỗi 401 khi đang ở trang Login.
    if (!token) {
      setUnreadCount(0); // Reset số lượng khi logout
      return;
    }

    // A. Gọi API lấy số lượng cũ ngay khi có token
    fetchUnreadCount();

    // B. Khởi tạo kết nối SignalR
    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5133/userNotificationHub", {
        accessTokenFactory: () => token, // Tự động gửi token vào header
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None) // Giảm log rác
      .build();

    setConnection(newConnection);

    // C. Start kết nối
    newConnection
      .start()
      .then(() => {
        // console.log("🔔 Connected to Notification Hub");

        // D. Lắng nghe sự kiện từ Backend gửi về
        // Tên sự kiện "ReceiveNotification" phải khớp với Backend
        newConnection.on("ReceiveNotification", (notification) => {
          console.log("🔔 Có thông báo mới:", notification);
          // Tăng số lượng chưa đọc lên 1
          setUnreadCount((prev) => prev + 1);
        });
      })
      .catch((err) => console.error("❌ Lỗi kết nối SignalR Notification:", err));

    // Cleanup: Ngắt kết nối khi component unmount hoặc token thay đổi (logout)
    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [token]); // Chỉ chạy lại khi token thay đổi

  // --- 3. Các hàm bổ trợ ---

  // Hàm reload lại số lượng (dùng khi mở menu thông báo)
  const fetchNotifications = () => {
    if (token) fetchUnreadCount();
  };

  // Hàm giảm số badge (dùng khi người dùng click vào 1 thông báo để đọc)
  const markAsReadGlobal = () => {
    setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Hàm reset badge về 0 (dùng khi bấm "Đánh dấu tất cả là đã đọc")
  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  return (
    <GlobalNotificationContext.Provider
      value={{
        connection,       // Trả về instance connection nếu cần dùng ở nơi khác
        unreadCount,      // Số lượng tin chưa đọc
        fetchNotifications, // Hàm refresh
        markAsReadGlobal,   // Hàm giảm 1 đơn vị
        clearUnreadCount,   // Hàm reset về 0
      }}
    >
      {children}
    </GlobalNotificationContext.Provider>
  );
};