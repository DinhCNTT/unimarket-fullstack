import React from "react";
import styles from "./VideoProgressControl.module.css";

// Hàm helper để format giây thành 00:00
const formatTime = (time) => {
  if (!time) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export default function VideoProgressControl({
  currentTime,
  duration,
  onSeek,
  isVisible, // Prop quyết định việc ẩn/hiện
}) {
  // Tính % để tô màu thanh slider
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`${styles.progressWrapper} ${isVisible ? styles.visible : ""}`}
      onClick={(e) => e.stopPropagation()} // Chặn click xuyên qua video gây pause
    >
      {/* Thanh Slider */}
      <div className={styles.sliderContainer}>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className={styles.progressBar}
          style={{
            backgroundSize: `${progressPercent}% 100%`, // Trick CSS để tô màu phần đã chạy
          }}
        />
      </div>

      {/* Thời gian hiển thị */}
      <div className={styles.timeDisplay}>
        <span>{formatTime(currentTime)}</span>
        <span> / </span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}