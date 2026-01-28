// src/context/VideoContext.js
import React, { createContext, useState, useMemo } from "react";

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState("forYou");
  const [loading, setLoading] = useState(false);

  // ✅ CẬP NHẬT: Dùng biến đếm số (number) thay vì boolean
  // Mỗi lần gọi triggerReload, số này tăng lên 1 -> Hook useVideoFeed sẽ biết để reset lại từ đầu
  const [refreshSignal, setRefreshSignal] = useState(0);

  // 👇 State cho âm lượng chung (giữ nguyên)
  const [volume, setVolume] = useState(1); // mặc định max
  const [isMuted, setIsMuted] = useState(false);

  const triggerReload = () => {
    setLoading(true);
    // Tăng biến đếm để báo hiệu reload
    setRefreshSignal((prev) => prev + 1);

    // Giả lập delay nhẹ để UI hiển thị trạng thái loading (spinner)
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      
      // 👇 Xuất refreshSignal thay vì reloadFlag cũ
      refreshSignal, 
      triggerReload,
      
      loading,
      setLoading,

      // 👇 Context âm lượng
      volume,
      setVolume,
      isMuted,
      setIsMuted,
    }),
    [activeTab, refreshSignal, loading, volume, isMuted]
  );

  return (
    <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
  );
};