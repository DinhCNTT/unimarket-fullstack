import React, { useState, useEffect } from "react";
import styles from "./Lightbox.module.css"; // Tạo file CSS riêng
import { getMediaUrl } from "../utils/formatters";

const Lightbox = ({ images = [], startIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const validMedia = images?.filter((img) => img) || [];

  const prevMedia = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validMedia.length - 1 : prev - 1));
  };

  const nextMedia = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === validMedia.length - 1 ? 0 : prev + 1));
  };
  
  // Xử lý phím mũi tên
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevMedia(e);
      if (e.key === 'ArrowRight') nextMedia(e);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Chỉ chạy 1 lần

  if (!validMedia.length) return null;

  const currentMediaSrc = getMediaUrl(validMedia[currentIndex]);
  const isVideo = currentMediaSrc.match(/\.(mp4|mov|avi|webm|ogg)$/i);

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      {isVideo ? (
        <video
          src={currentMediaSrc}
          className={styles.lightboxImg}
          controls
          autoPlay
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={currentMediaSrc}
          alt={`Full ${currentIndex + 1}`}
          className={styles.lightboxImg}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <button className={`${styles.lightboxNav} ${styles.left}`} onClick={prevMedia}>←</button>
      <button className={`${styles.lightboxNav} ${styles.right}`} onClick={nextMedia}>→</button>
      <span className={styles.lightboxClose} onClick={onClose}>×</span>
      <div className={styles.lightboxCounter}>
        {currentIndex + 1} / {validMedia.length}
      </div>
    </div>
  );
};

export default Lightbox;