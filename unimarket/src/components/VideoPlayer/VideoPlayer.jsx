import React, { useState, useRef, useEffect } from "react";
import { FaHeart, FaPlay } from "react-icons/fa";
import VideoVolumeControl from "./VideoVolumeControl";
import VideoProgressControl from "./VideoProgressControl"; // Import component mới
import styles from "./VideoPlayer.module.css";

export default function VideoPlayer({
  videoUrl,
  playerRef,
  bgPlayerRef,
  audioRef,
  isPlaying,
  isMuted,
  volume,
  showHeartEffect,
  setIsPlaying,
  toggleMute,
  handleVolumeChange,
}) {
  // --- STATE QUẢN LÝ TIẾN ĐỘ ---
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- STATE QUẢN LÝ HIỂN THỊ CONTROL ---
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef(null); // Dùng để lưu timeout ẩn control

  if (!videoUrl) {
    return <p style={{ color: "#fff" }}>Không tìm thấy video</p>;
  }

  // Cập nhật thời gian khi video chạy
  const handleTimeUpdate = () => {
    if (playerRef.current) {
      setCurrentTime(playerRef.current.currentTime);
    }
  };

  // Lấy tổng thời gian khi video load xong metadata
  const handleLoadedMetadata = () => {
    if (playerRef.current) {
      setDuration(playerRef.current.duration);
    }
  };

  // Xử lý tua video
  const handleSeek = (newTime) => {
    if (playerRef.current) {
      playerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // --- LOGIC ẨN/HIỆN THÔNG MINH ---
  const handleMouseMove = () => {
    setShowControls(true); // Hiện control ngay lập tức

    // Xóa timeout cũ nếu người dùng vẫn đang di chuột
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Đặt timeout mới: Sau 2.5 giây không di chuột -> Ẩn
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  const handleMouseLeave = () => {
    // Ra khỏi video -> Ẩn ngay (hoặc delay xíu tùy thích)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(false);
  };

  // Cleanup timeout khi unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* Video nền mờ */}
      <video
        ref={bgPlayerRef}
        className={styles.bgBlur}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Wrapper chính: Bắt sự kiện chuột ở đây */}
      <div
        className={styles.videoWrapper}
        onMouseMove={handleMouseMove} // Di chuột -> Hiện + Reset timer
        onMouseLeave={handleMouseLeave} // Rời chuột -> Ẩn
        onClick={() => setIsPlaying(!isPlaying)} // Click toggle Play/Pause
      >
        <video
          ref={playerRef}
          src={videoUrl}
          autoPlay
          loop
          playsInline
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          
          // Thêm 2 sự kiện này để cập nhật thanh tiến độ
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          
          style={{ width: "100%", height: "100%" }}
        />

        {showHeartEffect && <FaHeart className={styles.heartEffect} />}

        {!isPlaying && (
          <div className={styles.playIcon}>
            <FaPlay size={48} color="#fff" />
          </div>
        )}

        {/* Thanh điều chỉnh âm lượng (Giữ nguyên hoặc chỉnh vị trí tùy ý) */}
        <div className={styles.volumeContainer}> 
           <VideoVolumeControl
            volume={volume}
            toggleMute={toggleMute}
            handleVolumeChange={handleVolumeChange}
           />
        </div>

        {/* --- THANH ĐIỀU KHIỂN TIẾN ĐỘ MỚI --- */}
        <VideoProgressControl
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          isVisible={showControls} // Truyền state ẩn/hiện xuống
        />

        <audio
          ref={audioRef}
          src="/audio/background-music.mp3"
          autoPlay
          loop
          muted={isMuted}
          style={{ display: "none" }}
        />
      </div>
    </>
  );
}