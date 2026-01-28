import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaVideo, FaRegImage, FaHeart } from "react-icons/fa"; // Thêm FaHeart
import styles from "./SimilarPostsSection.module.css";
import { formatPrice, getMediaUrl } from "../utils/formatters";
import { formatRelativeTime } from "../utils/dateUtils";


/**
 * @param {string} mode - "grid" (Lưới) hoặc "carousel" (Trượt ngang)
 * @param {function} onViewShop - Hàm xử lý khi bấm nút "Xem trang cá nhân"
 * @param {boolean} isLoggedIn - Trạng thái đăng nhập
 * @param {Array} savedIds - Danh sách mảng ID các tin đã lưu
 * @param {function} onToggleSave - Hàm xử lý lưu/bỏ lưu tin
 */
const SimilarPostsSection = ({
  title,
  posts,
  mode = "carousel",
  onViewShop,
  isLoggedIn,
  savedIds = [],
  onToggleSave
}) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);


  // --- LOGIC CHO GRID MODE (Tin tương tự) ---
  const [visibleCount, setVisibleCount] = useState(10);


  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 10);
  };


  const handleCollapse = () => {
    setVisibleCount(10);
    const element = document.getElementById("grid-header");
    if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
  };


  // --- LOGIC CHO CAROUSEL MODE (Tin người bán) ---
  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };


  const handleSimilarPostClick = (postId) => {
    navigate(`/tin-dang/${postId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  if (!posts || posts.length === 0) return null;


  // 👇 Lọc danh sách hiển thị
  const displayPosts = mode === "carousel" ? posts.slice(0, 8) : posts.slice(0, visibleCount);


  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader} id={mode === "grid" ? "grid-header" : ""}>
        <h2 className={styles.title}>{title}</h2>
      </div>


      {/* ================= CASE 1: GRID MODE (Tin tương tự) ================= */}
      {mode === "grid" ? (
        <>
          <div className={styles.gridContainer}>
            {displayPosts.map((post) => (
              <PostCard
                key={post.maTinDang}
                post={post}
                onClick={handleSimilarPostClick}
                isGrid={true}
                isLoggedIn={isLoggedIn}
                isSaved={savedIds.includes(post.maTinDang)}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>


          <div className={styles.actionButtonsContainer}>
            {visibleCount < posts.length && (
              <button className={styles.actionBtn} onClick={handleShowMore}>Xem thêm</button>
            )}
            {visibleCount > 10 && (
              <button className={`${styles.actionBtn} ${styles.collapseBtn}`} onClick={handleCollapse}>Thu gọn</button>
            )}
          </div>
        </>
      ) : (
        /* ================= CASE 2: CAROUSEL MODE (Tin người bán) ================= */
        <div className={styles.carouselContainer}>
            <div className={styles.carouselWrapper}>
              <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={() => handleScroll("left")}>&#8249;</button>


              <div className={styles.postsTrack} ref={scrollRef}>
                  {displayPosts.map((post) => (
                  <PostCard
                      key={post.maTinDang}
                      post={post}
                      onClick={handleSimilarPostClick}
                      isGrid={false}
                      isLoggedIn={isLoggedIn}
                      isSaved={savedIds.includes(post.maTinDang)}
                      onToggleSave={onToggleSave}
                  />
                  ))}
              </div>


              <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={() => handleScroll("right")}>&#8250;</button>
            </div>


            <div className={styles.viewShopBtnContainer}>
                <button className={styles.viewShopBtn} onClick={onViewShop}>Xem thêm</button>
            </div>
        </div>
      )}
    </div>
  );
};


// ==========================================================
// COMPONENT CARD - TÍCH HỢP NÚT TRÁI TIM
// ==========================================================
const PostCard = ({ post, onClick, isGrid, isLoggedIn, isSaved, onToggleSave }) => {
  const [isHovering, setIsHovering] = useState(false);
  const imageCount = post.images ? post.images.length : 0;
  const hasVideo = !!post.videoUrl;


  // Logic xử lý khi click nút trái tim
  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn không cho nhảy vào link tin đăng
    if (onToggleSave) {
      onToggleSave(post.maTinDang, isSaved);
    }
  };


  return (
    <div
      className={`${styles.postCard} ${isGrid ? styles.cardGridItem : styles.cardCarouselItem}`}
      onClick={() => onClick(post.maTinDang)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={styles.cardImageWrapper}>
       
        {/* ⭐ NÚT TRÁI TIM: Nằm góc trên bên phải hình ảnh */}
        {isLoggedIn && (
          <div
            className={`${styles.saveHeartBtn} ${isSaved ? styles.saved : styles.notSaved}`}
            onClick={handleSaveClick}
          >
            <FaHeart className={styles.heartIcon} />
          </div>
        )}


        {hasVideo && isHovering ? (
            <video
                src={post.videoUrl}
                className={styles.previewVideo}
                autoPlay
                muted
                loop
                playsInline
            />
        ) : (
            <img src={getMediaUrl(post.images?.[0])} alt={post.tieuDe} loading="lazy" />
        )}
       
        {formatRelativeTime(post.ngayDang) && (
            <span className={styles.timeOverlay}>
                {formatRelativeTime(post.ngayDang)}
            </span>
        )}


        <div className={styles.mediaBadgesContainer}>
            {hasVideo && (
              <div className={`${styles.badgeItem} ${styles.videoBadge}`}>
                <FaVideo size={10} />
              </div>
            )}
            {imageCount > 0 && (
              <div className={styles.badgeItem}>
                <FaRegImage size={10} style={{ marginRight: 4 }} />
                <span>{imageCount}</span>
              </div>
            )}
        </div>
      </div>


      <div className={styles.cardContent}>
        <h3 className={styles.postTitle} title={post.tieuDe}>{post.tieuDe}</h3>
        <div className={styles.postPrice}>{formatPrice(post.gia)}</div>
        <div className={styles.postMeta}>
          <div className={styles.metaLocation}><span>{post.diaChi}</span></div>
        </div>
      </div>
    </div>
  );
};


export default SimilarPostsSection;