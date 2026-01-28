// src/components/TinDangDCBNhaTro.jsx
import React, { useState } from "react";
import styles from "./TinDangDCBNhaTro.module.css";
import TrangChuNav from "./TrangChuNav";
import PostItemCard from "./PostItemCard";
import NhaTroPostCard from "./NhaTroPostCard/NhaTroPostCard";
import { useTinDangData } from "../hooks/useTinDangData";


// ✅ Component riêng cho trang nhà trọ - categoryGroup: "nhà trọ"
const TinDangDCBNhaTro = ({ showNavigation = true }) => {
  const [visiblePostsCount, setVisiblePostsCount] = useState(25);
  const [activeTab, setActiveTab] = useState("danhchoban");


  // ✅ Fixed categoryGroup = "nhà trọ"
  const { posts, savedIds, isLoggedIn, handleToggleSave } = useTinDangData(activeTab, "nhà trọ");
  

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setVisiblePostsCount(25);
  };


  const getSortedPosts = () => {
    // 1. Kiểm tra nếu posts bị null, undefined hoặc không phải mảy -> Trả về mảng rỗng ngay
    if (!posts || !Array.isArray(posts)) {
      return [];
    }

    // 2. Logic sắp xếp
    if (activeTab === "moinhat") {
      // Dùng [...posts] để copy ra mảng mới rồi mới sort, tránh lỗi mutate state
      return [...posts].sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang));
    }
    return posts;
  };


  const sortedPosts = getSortedPosts();
  const displayedPosts = sortedPosts.slice(0, visiblePostsCount);


  return (
    <div className={styles.container}>
     
      {/* Navigation */}
      {showNavigation && (
        <div className={styles.navContainer}>
          <TrangChuNav onTabChange={handleTabChange} activeTab={activeTab} />
        </div>
      )}


      {/* Post List - Horizontal Cards */}
      <div className={styles.postListBatDongSan}>
        {sortedPosts.length === 0 ? (
          <p style={{ textAlign: "center", width: "100%", color: "#666" }}>
            Không có tin đăng nhà trọ
          </p>
        ) : (
          displayedPosts.map((post) => (
            <NhaTroPostCard
              key={post.maTinDang || Math.random()}
              post={post}
              isLoggedIn={isLoggedIn}
              isSaved={Array.isArray(savedIds) && savedIds.includes(post.maTinDang)}
              onToggleSave={handleToggleSave}
            />
          ))
        )}
      </div>


      {/* Show More Button */}
      {visiblePostsCount < sortedPosts.length && (
        <button
          className={styles.viewMoreBtn}
          onClick={() => setVisiblePostsCount((prev) => prev + 25)}
        >
          Xem thêm
        </button>
      )}
    </div>
  );
};


export default TinDangDCBNhaTro;
