// src/pages/UserProfilePage/UserProfileTabs.jsx
import React, { useEffect, useRef } from "react";
import styles from "./UserProfileTabs.module.css";
import { IoNewspaperOutline } from "react-icons/io5";
import { MdOutlineOndemandVideo } from "react-icons/md";
import { CiBookmark, CiHeart } from "react-icons/ci";

const UserProfileTabs = ({ activeTab, onTabClick, isOwner }) => {
  const tabsWrapperRef = useRef(null);

  useEffect(() => {
    const tabsWrapper = tabsWrapperRef.current;
    if (!tabsWrapper) return;

    const tabs = tabsWrapper.querySelectorAll(`.${styles.tab}`);
    if (tabs.length === 0) return;

    const handleMouseEnter = (e) => {
      const rect = e.target.getBoundingClientRect();
      const parentRect = tabsWrapper.getBoundingClientRect();
      tabsWrapper.style.setProperty(
        "--underline-left",
        rect.left - parentRect.left + "px"
      );
      tabsWrapper.style.setProperty("--underline-width", rect.width + "px");
    };

    tabs.forEach((tab) =>
      tab.addEventListener("mouseenter", handleMouseEnter)
    );

    // Set vị trí underline cho tab active ban đầu
    const activeTabElement = tabsWrapper.querySelector(`.${styles.active}`);
    if (activeTabElement) {
      const rect = activeTabElement.getBoundingClientRect();
      const parentRect = tabsWrapper.getBoundingClientRect();
      tabsWrapper.style.setProperty(
        "--underline-left",
        rect.left - parentRect.left + "px"
      );
      tabsWrapper.style.setProperty("--underline-width", rect.width + "px");
    }

    return () => {
      tabs.forEach((tab) =>
        tab.removeEventListener("mouseenter", handleMouseEnter)
      );
    };
  }, [activeTab, isOwner]);

  return (
    <div className={styles.tabsContainer} ref={tabsWrapperRef}>
      {/* Tab 1: Tin đăng - CÔNG KHAI */}
      <button
        className={`${styles.tab} ${activeTab === "posts" ? styles.active : ""}`}
        onClick={() => onTabClick("posts")}
      >
        <IoNewspaperOutline size={18} /> Tin đăng
      </button>

      {/* Tab 2: Video - CÔNG KHAI */}
      <button
        className={`${styles.tab} ${
          activeTab === "videos" ? styles.active : ""
        }`}
        onClick={() => onTabClick("videos")}
      >
        <MdOutlineOndemandVideo size={20} /> Video
      </button>

      {/* Tab 3: Đã thích - CÔNG KHAI (Đã dời ra ngoài isOwner) */}
      {/* Bây giờ ai vào cũng thấy nút này */}
      <button
        className={`${styles.tab} ${
          activeTab === "liked" ? styles.active : ""
        }`}
        onClick={() => onTabClick("liked")}
      >
        <CiHeart size={20} strokeWidth={0.5} /> Đã thích
      </button>

      {/* Tab 4: Yêu thích (Đã lưu) - RIÊNG TƯ */}
      {/* Cái này vẫn nên giữ riêng tư vì là video người ta bookmark */}
      {isOwner && (
        <button
          className={`${styles.tab} ${
            activeTab === "favorites" ? styles.active : ""
          }`}
          onClick={() => onTabClick("favorites")}
        >
          <CiBookmark size={20} strokeWidth={0.5} /> Yêu thích
        </button>
      )}
    </div>
  );
};

export default UserProfileTabs;