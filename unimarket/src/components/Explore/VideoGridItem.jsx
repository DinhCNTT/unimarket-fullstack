import React, { useRef } from 'react';
import { FiHeart, FiPlay } from 'react-icons/fi';
import styles from './VideoGridItem.module.css';
import defaultAvatar from '../../assets/default-avatar.png'; // Đường dẫn avatar mặc định của bạn

const VideoGridItem = ({ video, onClick }) => {
  const videoRef = useRef(null);

  // Sự kiện hover để phát video preview (tuỳ chọn)
  const handleMouseEnter = () => {
    if (videoRef.current) {
        videoRef.current.play().catch(e => {/* Bỏ qua lỗi auto-play */});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className={styles.cardContainer} onClick={() => onClick(video.maTinDang)}>
      {/* Phần Video/Ảnh */}
      <div 
        className={styles.mediaWrapper}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video 
            ref={videoRef}
            src={video.videoUrl} 
            className={styles.video}
            muted 
            loop
            poster={video.thumbnailUrl} // Hiển thị ảnh bìa trước
        />

        {/* Overlay số tim ở góc trái ảnh */}
        <div className={styles.overlayInfo}>
            <FiHeart className={styles.heartIcon} />
            <span className={styles.heartCount}>{video.soLuotTim}</span>
        </div>
      </div>

      {/* Phần thông tin người dùng bên dưới */}
      <div className={styles.metaInfo}>
        <div className={styles.title}>{video.tieuDe}</div>
        <div className={styles.userInfo}>
            <img 
                src={video.avatarNguoiBan || defaultAvatar} 
                alt="avatar" 
                className={styles.avatar} 
            />
            <span className={styles.username}>{video.tenNguoiBan}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoGridItem;