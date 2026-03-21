// src/components/TinDangDCBNhaTro.jsx
import React, { useState } from "react";
import styles from "./TinDangDCBNhaTro.module.css";
import TrangChuNav from "./TrangChuNav";
import NhaTroPostCard from "./NhaTroPostCard/NhaTroPostCard";
import { useTinDangData } from "../hooks/useTinDangData";

// Component riêng cho trang nhà trọ – categoryGroup cố định: "nhà trọ"
const TinDangDCBNhaTro = ({ showNavigation = true, filters = {} }) => {
  const [visiblePostsCount, setVisiblePostsCount] = useState(25);
  const [activeTab, setActiveTab] = useState("danhchoban");

  const { posts, savedIds, isLoggedIn, handleToggleSave, loading } =
    useTinDangData(activeTab, "nhà trọ", filters);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setVisiblePostsCount(25);
  };

  // Sắp xếp bài đăng
  const getSortedPosts = () => {
    if (!posts || !Array.isArray(posts)) return [];
    if (activeTab === "moinhat") {
      return [...posts].sort(
        (a, b) => new Date(b.ngayDang) - new Date(a.ngayDang)
      );
    }
    return posts;
  };

  const sortedPosts = getSortedPosts();
  const displayedPosts = sortedPosts.slice(0, visiblePostsCount);

  // ── Skeleton khi đang load ─────────────────────────────────
  const SkeletonCard = () => (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonText} />
      <div className={styles.skeletonText} />
      <div className={styles.skeletonText} />
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Navigation tabs (sticky) */}
      {showNavigation && (
        <div className={styles.navContainer}>
          <TrangChuNav onTabChange={handleTabChange} activeTab={activeTab} />
        </div>
      )}

      {/* Post Grid */}
      <div className={styles.postListBatDongSan}>
        {loading ? (
          // Hiển thị 10 skeleton cards khi đang load
          Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : sortedPosts.length === 0 ? (
          // Empty state
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🏠</span>
            <p>Không tìm thấy tin đăng nhà trọ nào.</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              Thử thay đổi bộ lọc hoặc khu vực tìm kiếm.
            </p>
          </div>
        ) : (
          displayedPosts.map((post) => (
            <NhaTroPostCard
              key={post.maTinDang || Math.random()}
              post={post}
              isLoggedIn={isLoggedIn}
              isSaved={
                Array.isArray(savedIds) && savedIds.includes(post.maTinDang)
              }
              onToggleSave={handleToggleSave}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {!loading && visiblePostsCount < sortedPosts.length && (
        <button
          className={styles.viewMoreBtn}
          onClick={() => setVisiblePostsCount((prev) => prev + 25)}
        >
          Xem thêm tin đăng
        </button>
      )}
    </div>
  );
};

export default TinDangDCBNhaTro;
