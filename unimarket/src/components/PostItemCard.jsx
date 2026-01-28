import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaVideo, FaRegImage, FaPlay } from "react-icons/fa";
import { IoFlameSharp } from "react-icons/io5"; 
import styles from "./PostItemCard.module.css";
import { formatCurrency, formatRelativeTime } from "../utils/dateUtils";

const PostItemCard = ({ post, isSaved, onToggleSave, isLoggedIn }) => {
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

      <Link to={`/tin-dang/${post.maTinDang}`} className={styles.postLink}>
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
            <span className={styles.price}>{formatCurrency(post.gia)}</span>
            {(post.chiTietObj?.dienTichPhong || post.ChiTietObj?.dienTichPhong) && (
              <span className={styles.priceExtra}>
                {post.chiTietObj?.dienTichPhong || post.ChiTietObj?.dienTichPhong}m²
              </span>
            )}
          </div>

          <p className={styles.description}>
            {post.moTa ? post.moTa : "Không có mô tả chi tiết."}
          </p>

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

export default PostItemCard;
