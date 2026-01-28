import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaVideo, FaRegImage, FaPlay } from "react-icons/fa";
import { IoFlameSharp } from "react-icons/io5";
import styles from "./NhaTroPostCard.module.css";
import { formatRelativeTime } from "../../utils/dateUtils";

const NhaTroPostCard = ({ post, isSaved, onToggleSave, isLoggedIn }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const BASE_URL = "http://localhost:5133";

  const firstImageUrl =
    post.images && post.images.length > 0
      ? post.images[0].startsWith("http")
        ? post.images[0]
        : `${BASE_URL}${post.images[0]}`
      : null;

  const videoUrl = post.videoUrl
    ? post.videoUrl.startsWith("http")
      ? post.videoUrl
      : `${BASE_URL}${post.videoUrl}`
    : null;

  const imageCount = post.images ? post.images.length : 0;
  const hasVideo = !!videoUrl;

  // --- 2. Hàm lấy dữ liệu an toàn (Fix lỗi mất m2) ---
  const getDetail = (key) => {
    // 1. Ưu tiên tìm trong chiTietObj/ChiTietObj từ MongoDB (dữ liệu mới)
    const details = post.chiTietObj || post.ChiTietObj || {};
    const foundKey = Object.keys(details).find(k => k.toLowerCase().includes(key.toLowerCase()));
    if (foundKey) return details[foundKey];
    
    // 2. Fallback: Tìm trực tiếp trong post object (dữ liệu cũ/từ SQL)
    if (key.toLowerCase().includes('dientich') || key.toLowerCase().includes('dt')) {
      return post.dienTichPhong || post.DienTichPhong || null;
    }
    if (key.toLowerCase().includes('succhua') || key.toLowerCase().includes('nguoi')) {
      return post.sucChua || post.SucChua || null;
    }
    
    return null;
  };

  const dienTich = getDetail('dientich') || getDetail('dt');
  const sucChua = getDetail('sucChua') || getDetail('nguoi');

  // --- 3. Hàm Format Giá (2.000.000 -> 2 tr/tháng) ---
  const formatPriceNhaTro = (price) => {
    if (!price) return "Thỏa thuận";
    if (price >= 1000000) {
      const millions = price / 1000000;
      return `${parseFloat(millions.toFixed(2))} tr/tháng`;
    }
    return `${(price / 1000).toLocaleString()} k/tháng`;
  };

  const handleMouseEnter = () => {
    if (videoUrl && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }
  };

  const handleMouseLeave = () => {
    if (videoUrl && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // --- LƯU TIN ---
  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave(post.maTinDang, isSaved);
  };

  return (
    <div className={styles.postItem}>
      {post.savedCount >= 2 && (
        <div className={styles.hotBadge}>
          <IoFlameSharp size={14} style={{ marginRight: 4 }} />
          HOT
        </div>
      )}

      {isLoggedIn && (
        <div
          className={`${styles.saveHeartBtn} ${
            isSaved ? styles.saved : styles.notSaved
          }`}
          onClick={handleSaveClick}
          title={isSaved ? "Bỏ lưu" : "Lưu tin"}
        >
          <FaHeart className={styles.heartIcon} />
        </div>
      )}

      <Link to={`/chi-tiet-tin-dang-nha-tro/${post.maTinDang}`} className={styles.postLink}>
        <div
          className={styles.postImageWrapper}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                className={styles.mediaContent}
                muted
                loop
                playsInline
                poster={firstImageUrl}
              />
              {!isPlaying && (
                <div className={styles.playOverlay}>
                  <FaPlay size={14} color="#fff" style={{ marginLeft: 2 }} />
                </div>
              )}
            </>
          ) : firstImageUrl ? (
            <img
              src={firstImageUrl}
              alt={post.tieuDe}
              className={styles.mediaContent}
              loading="lazy"
            />
          ) : (
            <div className={styles.noImage}>Không có ảnh</div>
          )}
          <span className={styles.timeOverlay}>
            {formatRelativeTime(post.ngayDang)}
          </span>
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
        <div className={styles.postInfo}>
          <h3 className={styles.title} title={post.tieuDe}>
            {post.tieuDe}
          </h3>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPriceNhaTro(post.gia)}</span>
            {dienTich && (
              <span className={styles.priceExtra}>
                {dienTich}m²
              </span>
            )}
          </div>

          <div className={styles.location}>
            <span>
              {post.quanHuyen}, {post.tinhThanh}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default NhaTroPostCard;
