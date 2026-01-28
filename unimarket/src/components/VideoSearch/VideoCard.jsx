import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
// Import thêm các icon cho nhãn giá
import { FaRegHeart, FaTag, FaCheckCircle, FaFire } from "react-icons/fa"; 
import defaultAvatar from "../../assets/default-avatar.png";
import styles from "./VideoCard.module.css";

// Nhận thêm prop priceStats từ cha truyền xuống
const VideoCard = ({ video, allVideos, keyword, activeTab, priceStats }) => {
  const videoRef = useRef(null);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  // ==================================================================
  // 1. LOGIC CŨ: XỬ LÝ VIDEO & NAVIGATE (GIỮ NGUYÊN)
  // ==================================================================
  
  // Xử lý tự động phát video khi rê chuột vào
  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      // Dừng sau 3 giây để tránh load quá nhiều
      timeoutRef.current = setTimeout(() => {
        if (videoRef.current) videoRef.current.pause();
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) videoRef.current.pause();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Click vào card để xem chi tiết
  const handleCardClick = () => {
    navigate(`/video-viewer/${video.maTinDang}`, {
      state: {
        videos: allVideos,
        initialIndex: allVideos.findIndex((v) => v.maTinDang === video.maTinDang),
        returnPath: `/search/${encodeURIComponent(keyword)}?tab=${activeTab}`,
      },
    });
  };

  // Click vào avatar/tên để xem trang cá nhân
  const handleUserClick = (e) => {
    e.stopPropagation();
    navigate(`/nguoi-dung/${video.nguoiDang?.id}`);
  };

  // Format số like (VD: 1200 -> 1.2k)
  const formatLikes = (count) => {
    if (!count) return "0";
    if (count >= 1000) return (count / 1000).toFixed(1) + "k";
    return count;
  };

  // ==================================================================
  // 2. LOGIC MỚI: XỬ LÝ GIÁ VÀ NHÃN (THÊM VÀO)
  // ==================================================================

  // Hàm format giá hiển thị (VD: 10.500.000 ₫)
  const formatPrice = (price) => {
    if (!price) return "";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Logic hiển thị nhãn so sánh giá
  const renderPriceBadge = () => {
    // Kiểm tra dữ liệu đầu vào
    if (!video.gia || video.gia <= 0 || !priceStats) return null;

    const { maxPrice, averagePrice } = priceStats;
    const price = video.gia;

    // Trường hợp 1: Rẻ hơn hoặc bằng giá trung bình -> Giá Tốt (Highlight mạnh - Icon Lửa)
    if (price <= averagePrice) {
      return (
        <div className={`${styles.priceBadge} ${styles.badgeGood}`}>
          <FaFire className={styles.badgeIcon} />
          <span>Giá Tốt</span>
        </div>
      );
    }
    
    // Trường hợp 2: Cao hơn trung bình nhưng vẫn trong khoảng Max -> Hợp Lý (Icon Tích xanh)
    // (Cho phép chênh lệch 1 chút so với max, ví dụ 5%)
    if (price <= maxPrice * 1.05) {
      return (
        <div className={`${styles.priceBadge} ${styles.badgeReasonable}`}>
          <FaCheckCircle className={styles.badgeIcon} />
          <span>Hợp Lý</span>
        </div>
      );
    }

    return null; // Giá quá cao hoặc không xác định thì không hiện badge
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      {/* --- Phần Video Thumbnail --- */}
      <div
        className={styles.thumbnailWrapper}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            src={video.videoUrl}
            muted
            preload="metadata"
            playsInline
            loop
          />
        </div>
        
        {/* --- [MỚI] NHÃN ĐÁNH GIÁ GIÁ (Góc Trên Cùng Bên Phải) --- */}
        {renderPriceBadge()}

        {/* --- [MỚI] HIỂN THỊ GIÁ TIỀN (Góc Trên Cùng Bên Trái hoặc Đè lên) --- */}
        {video.gia > 0 && (
           <div className={styles.priceTagOverlay}>
             {formatPrice(video.gia)}
           </div>
        )}

        {/* Overlay Tim ở góc trái dưới (GIỮ NGUYÊN) */}
        <div className={styles.overlayBottomLeft}>
          <FaRegHeart className={styles.heartIcon} />
          <span className={styles.likeCount}>{formatLikes(video.soTym)}</span>
        </div>
      </div>

      {/* --- Phần Thông tin bên dưới (GIỮ NGUYÊN) --- */}
      <div className={styles.metaData}>
        {/* Hàng 1: Tiêu đề video */}
        <div className={styles.titleRow}>
          <p className={styles.videoTitle} title={video.tieuDe}>
            {video.tieuDe || "Không có tiêu đề"}
          </p>
        </div>

        {/* Hàng 2: Avatar + Tên + Thời gian */}
        <div className={styles.userRow}>
          {/* Bên trái: Avatar và Tên người đăng */}
          <div className={styles.userInfoLeft} onClick={handleUserClick}>
            <img
              src={video.nguoiDang?.avatarUrl?.trim() ? video.nguoiDang.avatarUrl : defaultAvatar}
              alt="avatar"
              className={styles.userAvatar}
            />
            <span className={styles.userName} title={video.nguoiDang?.fullName}>
              {video.nguoiDang?.fullName || "Người dùng"}
            </span>
          </div>
          
          {/* Bên phải: Thời gian đăng */}
          <span className={styles.postDate}>
            {video.thoiGianHienThi || "Mới đăng"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;