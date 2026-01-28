import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./VideoGrid.module.css";
import EmptyState from "../../components/Common/EmptyState/EmptyState";
import { CiVideoOff } from "react-icons/ci";
import { IoPlayOutline } from "react-icons/io5";

const VideoGrid = ({ videos }) => {
  const [showMoreVideos, setShowMoreVideos] = useState(false);
  const navigate = useNavigate();
  const videoRefs = useRef([]);

  const formatViewCount = (count) => {
    if (!count) return "0";
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  // --- XỬ LÝ HOVER VIDEO ---
  const handleMouseEnter = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      // Promise để tránh lỗi "The play() request was interrupted"
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play was prevented (thường do chưa mute hoặc trình duyệt chặn)
          console.log("Auto-play prevented");
        });
      }
    }
  };

  const handleMouseLeave = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.pause();
      video.currentTime = 0; // Reset về đầu khi chuột rời đi
    }
  };

  const handleVideoClick = (clickedVideo, videoIndex) => {
    navigate(`/video-search-detail/${clickedVideo.maTinDang}`, {
      state: {
        videoList: videos,
        initialIndex: videoIndex,
        from: "userProfile",
      },
    });
  };

  if (!videos || videos.length === 0) {
    return (
      <EmptyState
        icon={<CiVideoOff />}
        title="Chưa có video"
        subtitle="Người dùng này chưa đăng video nào"
      />
    );
  }

  const displayedVideos = showMoreVideos ? videos : videos.slice(0, 12);

  return (
    <div className={styles.tabContent}>
      <div className={styles.gridSection}>
        <div className={`${styles.gridContainer} ${showMoreVideos ? styles.showAll : ""}`}>
          <div className={styles.videosGrid}>
            {displayedVideos.map((video, index) => (
              <div
                key={video.maTinDang || index}
                className={styles.videoCard}
                onClick={() => handleVideoClick(video, index)}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={() => handleMouseLeave(index)}
              >
                <div className={styles.videoWrapper}>
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    // Ưu tiên dùng videoUrl hoặc videoDuongDan tùy API trả về
                    src={video.videoUrl || video.videoDuongDan} 
                    poster={video.anhBia}
                    loop
                    muted // Bắt buộc phải muted mới auto play được trên Chrome
                    preload="metadata" // Load frame đầu tiên để tránh màn hình đen
                    playsInline
                    className={styles.videoPlayer}
                  />
                  
                  <div className={styles.videoOverlay}>
                    <div className={styles.viewCountBadge}>
                      <IoPlayOutline className={styles.playIcon} />
                      <span>{formatViewCount(video.views || video.luotXem || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {videos.length > 12 && (
          <div className={styles.showMoreContainer}>
            <button
              className={styles.showMoreBtn}
              onClick={() => setShowMoreVideos(!showMoreVideos)}
            >
              {showMoreVideos ? "Thu gọn ↑" : `Xem thêm (${videos.length - 12} video) ↓`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;