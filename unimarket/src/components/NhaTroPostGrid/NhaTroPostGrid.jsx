// src/components/NhaTroPostGrid/NhaTroPostGrid.jsx
import React, { useState, useMemo } from "react";
import { FaTh, FaList } from "react-icons/fa";
import styles from "./NhaTroPostGrid.module.css";
import NhaTroPostCard from "../NhaTroPostCard/NhaTroPostCard";
import NhaTroPostCardList from "../NhaTroPostCard/NhaTroPostCardList";

// ── Skeleton Card ─────────────────────────────────────────────
const SkeletonGrid = () => (
    <div className={styles.skeletonCard}>
        <div className={styles.skeletonImg} />
        <div className={styles.skeletonLine} style={{ width: "80%" }} />
        <div className={styles.skeletonLine} style={{ width: "55%" }} />
        <div className={styles.skeletonLine} style={{ width: "40%" }} />
    </div>
);

// ── Skeleton List ─────────────────────────────────────────────
const SkeletonList = () => (
    <div className={styles.skeletonListCard}>
        <div className={styles.skeletonListImg} />
        <div className={styles.skeletonListBody}>
            <div className={styles.skeletonLine} style={{ width: "70%" }} />
            <div className={styles.skeletonLine} style={{ width: "40%" }} />
            <div className={styles.skeletonLine} style={{ width: "30%" }} />
        </div>
    </div>
);

// ── Main Component ────────────────────────────────────────────
/**
 * @param {object[]} posts         - Danh sách tin đăng
 * @param {Set}      savedIds      - Set mã tin đã lưu
 * @param {boolean}  isLoggedIn
 * @param {Function} onToggleSave
 * @param {boolean}  loading
 * @param {string}   sortBy        - Sort hiện tại (từ filters)
 */
const NhaTroPostGrid = ({
    posts = [],
    savedIds = [],
    isLoggedIn = false,
    onToggleSave,
    loading = false,
    sortBy = "newest",
}) => {
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
    const [visibleCount, setVisibleCount] = useState(20);

    // ── Client-side sort ──────────────────────────────────────
    const sortedPosts = useMemo(() => {
        if (!Array.isArray(posts)) return [];
        const copy = [...posts];
        if (sortBy === "price_asc") copy.sort((a, b) => (a.gia || 0) - (b.gia || 0));
        if (sortBy === "price_desc") copy.sort((a, b) => (b.gia || 0) - (a.gia || 0));
        if (sortBy === "newest") copy.sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang));
        return copy;
    }, [posts, sortBy]);

    const displayed = sortedPosts.slice(0, visibleCount);
    const hasMore = visibleCount < sortedPosts.length;

    // ── Skeleton count per view ───────────────────────────────
    const skeletonCount = viewMode === "grid" ? 10 : 5;

    return (
        <div className={styles.wrapper}>

            {/* ── Toolbar: count + toggle ── */}
            <div className={styles.toolbar}>
                <span className={styles.resultCount}>
                    {loading
                        ? "Đang tải..."
                        : `${sortedPosts.length.toLocaleString()} tin đăng`}
                </span>

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === "grid" ? styles.toggleActive : ""}`}
                        onClick={() => setViewMode("grid")}
                        title="Dạng lưới"
                    >
                        <FaTh size={14} />
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === "list" ? styles.toggleActive : ""}`}
                        onClick={() => setViewMode("list")}
                        title="Dạng danh sách"
                    >
                        <FaList size={14} />
                    </button>
                </div>
            </div>

            {/* ── Post Grid / List ── */}
            {loading ? (
                <div className={viewMode === "grid" ? styles.grid : styles.list}>
                    {Array.from({ length: skeletonCount }).map((_, i) =>
                        viewMode === "grid" ? <SkeletonGrid key={i} /> : <SkeletonList key={i} />
                    )}
                </div>
            ) : displayed.length === 0 ? (
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>🏠</span>
                    <p className={styles.emptyText}>Không tìm thấy tin đăng phù hợp.</p>
                    <p className={styles.emptyHint}>Thử thay đổi bộ lọc hoặc khu vực tìm kiếm.</p>
                </div>
            ) : (
                <div className={viewMode === "grid" ? styles.grid : styles.list}>
                    {displayed.map((post) =>
                        viewMode === "grid" ? (
                            <NhaTroPostCard
                                key={post.maTinDang}
                                post={post}
                                isLoggedIn={isLoggedIn}
                                isSaved={Array.isArray(savedIds) && savedIds.includes(post.maTinDang)}
                                onToggleSave={onToggleSave}
                            />
                        ) : (
                            <NhaTroPostCardList
                                key={post.maTinDang}
                                post={post}
                                isLoggedIn={isLoggedIn}
                                isSaved={Array.isArray(savedIds) && savedIds.includes(post.maTinDang)}
                                onToggleSave={onToggleSave}
                            />
                        )
                    )}
                </div>
            )}

            {/* ── Load More ── */}
            {!loading && hasMore && (
                <button
                    className={styles.loadMoreBtn}
                    onClick={() => setVisibleCount(prev => prev + 20)}
                >
                    Xem thêm {Math.min(20, sortedPosts.length - visibleCount)} tin
                </button>
            )}
        </div>
    );
};

export default NhaTroPostGrid;
