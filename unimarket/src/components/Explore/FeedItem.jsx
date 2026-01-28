import React from 'react';
import { FiHeart, FiMessageCircle, FiMoreHorizontal } from 'react-icons/fi';
import styles from './FeedItem.module.css';

// --- THÊM DÒNG NÀY: Import ảnh từ folder assets ---
import defaultAvatar from '../../assets/default-avatar.png'; 

const FeedItem = ({ video, onClick }) => {
  // Format thời gian giả lập
  const timeAgo = "2 giờ trước"; 

  return (
    <div className={styles.feedCard} onClick={() => onClick(video.maTinDang)}>
      {/* 1. Header: Avatar + Tên + Thời gian */}
      <div className={styles.header}>
        <img 
          // SỬA Ở ĐÂY: Nếu không có avatar người bán thì dùng defaultAvatar đã import
          src={video.avatarNguoiBan || defaultAvatar} 
          alt="avatar" 
          className={styles.avatar} 
        />
        <div className={styles.userInfo}>
          <h4 className={styles.userName}>{video.tenNguoiBan}</h4>
          <span className={styles.time}>{timeAgo}</span>
        </div>
        <button className={styles.moreBtn}><FiMoreHorizontal /></button>
      </div>

      {/* 2. Nội dung text */}
      <div className={styles.content}>
        <p className={styles.title}>{video.tieuDe}</p>
        {/* Nếu có giá tiền thì hiển thị ở đây */}
      </div>

      {/* 3. Ảnh/Video lớn */}
      <div className={styles.mediaWrapper}>
        <img src={video.thumbnailUrl} alt={video.tieuDe} className={styles.mainImage} />
        {/* Icon play giả ở giữa để biết là video */}
        <div className={styles.playIconOverlay}>▶</div>
      </div>

      {/* 4. Footer: Like/Comment */}
      <div className={styles.footer}>
        <div className={styles.stats}>
            <span>{video.soLuotTim} người thích</span>
            <span>{video.soLuotXem} lượt xem</span>
        </div>
        <hr className={styles.divider} />
        <div className={styles.actions}>
            <button className={styles.actionBtn}>
                <FiHeart size={20} /> Thích
            </button>
            <button className={styles.actionBtn}>
                <FiMessageCircle size={20} /> Bình luận
            </button>
        </div>
      </div>
    </div>
  );
};

export default FeedItem;