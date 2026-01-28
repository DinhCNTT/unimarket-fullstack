// src/components/TrangChuNav.jsx
import React from 'react';
import { NavLink, useLocation } from "react-router-dom";
import styles from "./TrangChuNav.module.css";

// ✅ SỬA: Nhận thêm prop showVideoTab (mặc định là true)
const TrangChuNav = ({ onTabChange, activeTab, showVideoTab = true }) => {
  const location = useLocation();
  
  const handleDanhChoBanClick = (e) => {
    e.preventDefault();
    if (onTabChange) {
      onTabChange('danhchoban');
    }
  };

  const handleMoiNhatClick = (e) => {
    e.preventDefault();
    if (onTabChange) {
      onTabChange('moinhat');
    }
  };

  const isDanhChoBanActive = () => {
    if (activeTab !== undefined) {
      return activeTab === 'danhchoban';
    }
    return location.pathname === "/market" || 
           location.pathname.includes("tin-dang-danh-cho-ban");
  };

  const isMoiNhatActive = () => {
    if (activeTab !== undefined) {
      return activeTab === 'moinhat';
    }
    return false;
  };

  // Mảng tabs gốc
  const allTabs = [
    { 
      key: "danhchoban",
      label: "Dành cho bạn", 
      onClick: handleDanhChoBanClick,
      isActive: isDanhChoBanActive()
    },
    { 
      key: "moinhat",
      label: "Mới nhất", 
      onClick: handleMoiNhatClick,
      isActive: isMoiNhatActive()
    },
    { 
      path: "/market/video", 
      label: "Video",
      // Đánh dấu tab này là loại video để dễ lọc
      isVideoTab: true 
    },
  ];

  // ✅ LOGIC MỚI: Lọc bỏ tab Video nếu showVideoTab = false
  const displayedTabs = showVideoTab 
    ? allTabs 
    : allTabs.filter(tab => !tab.isVideoTab); // Loại bỏ tab có cờ isVideoTab

  return (
    <div className={styles.container}>
      {displayedTabs.map((tab) => {
        if (tab.onClick) {
          // Các tab Button (Dành cho bạn, Mới nhất)
          return (
            <button
              key={tab.key}
              onClick={tab.onClick}
              className={`${styles.tab} ${tab.isActive ? styles.active : ""}`}
            >
              {tab.label}
            </button>
          );
        } else {
          // Tab Link (Video)
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `${styles.tab} ${isActive ? styles.active : ""}`
              }
            >
              {tab.label}
            </NavLink>
          );
        }
      })}
    </div>
  );
};

export default TrangChuNav;