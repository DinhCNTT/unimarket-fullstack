import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "./PostImageCarousel.module.css";
import { getMediaUrl } from "../utils/formatters";

const PostImageCarousel = ({ images = [], onImageClick }) => {
  const [current, setCurrent] = useState(0);
  const videoRef = useRef(null);
  const galleryRef = useRef(null);

  // State quản lý ẩn/hiện nút mũi tên thumbnail
  const [showPrevThumbBtn, setShowPrevThumbBtn] = useState(false);
  const [showNextThumbBtn, setShowNextThumbBtn] = useState(false);

  // 1. BỎ slice(0, 8) -> Có bao nhiêu hiển thị bấy nhiêu, đảm bảo trên dưới khớp nhau 100%
  const validMedia = images?.filter((img) => img) || [];

  // Nếu không có media thì báo lỗi hoặc ẩn
  if (!validMedia.length) return <div className={styles.noMedia}>Không có media.</div>;

  const prevMedia = () => setCurrent((prev) => (prev === 0 ? validMedia.length - 1 : prev - 1));
  const nextMedia = () => setCurrent((prev) => (prev === validMedia.length - 1 ? 0 : prev + 1));
  
  const isVideo = (url) => url.match(/\.(mp4|mov|avi|webm|ogg)$/i);
  const mediaSrc = getMediaUrl(validMedia[current]);
  const isCurrentVideo = isVideo(mediaSrc);

  const handleVideoClick = (e) => {
    e.preventDefault();
    if (videoRef.current) videoRef.current.pause();
    onImageClick(current);
  };

  // Hàm cuộn thumbnail bằng nút mũi tên
  const scrollThumbs = (direction) => {
    if (galleryRef.current) {
      const scrollAmount = 200; 
      galleryRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 2. TỐI ƯU hàm kiểm tra nút cuộn để tránh lag (Khựng)
  const checkScrollButtons = useCallback(() => {
    if (galleryRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = galleryRef.current;
      // Chỉ update state khi giá trị thay đổi để tránh re-render thừa
      const canScrollLeft = scrollLeft > 2; // Sai số nhỏ
      const canScrollRight = scrollLeft + clientWidth < scrollWidth - 2;

      setShowPrevThumbBtn((prev) => (prev !== canScrollLeft ? canScrollLeft : prev));
      setShowNextThumbBtn((prev) => (prev !== canScrollRight ? canScrollRight : prev));
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const galleryElement = galleryRef.current;
    if (galleryElement) {
      galleryElement.addEventListener("scroll", checkScrollButtons);
      return () => galleryElement.removeEventListener("scroll", checkScrollButtons);
    }
  }, [checkScrollButtons, validMedia]);

  // 3. TỰ ĐỘNG CUỘN MƯỢT thumbnail vào giữa khi đổi ảnh lớn
  useEffect(() => {
    if (galleryRef.current) {
      const selectedThumb = galleryRef.current.children[current];
      if (selectedThumb) {
        // Dùng scrollIntoView native của trình duyệt -> Cực mượt
        selectedThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center", // Canh giữa
        });
      }
    }
  }, [current]); // Chỉ chạy khi 'current' thay đổi

  return (
    <div className={styles.carouselWrapper}>
      {/* --- PHẦN ẢNH LỚN --- */}
      <div className={styles.carouselImgbox}>
        {isCurrentVideo ? (
          <video
            ref={videoRef}
            src={mediaSrc}
            controls
            className={styles.carouselImg}
            onClick={handleVideoClick}
          />
        ) : (
          <img
            src={mediaSrc}
            alt={`Media ${current + 1}`}
            className={styles.carouselImg}
            onClick={() => onImageClick(current)}
          />
        )}
        
        {/* Chỉ hiện số trang và nút điều hướng lớn khi có > 1 ảnh */}
        <div className={styles.carouselIndex}>
          {current + 1} / {validMedia.length}
        </div>
        
        {validMedia.length > 1 && (
          <>
            <button onClick={prevMedia} className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}>{'<'}</button>
            <button onClick={nextMedia} className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}>{'>'}</button>
          </>
        )}
      </div>

      {/* --- PHẦN THUMBNAIL --- */}
      {/* Chỉ hiển thị dải thumbnail nếu có nhiều hơn 1 ảnh */}
      {validMedia.length > 1 && (
        <div className={styles.thumbGalleryContainer}>
          {showPrevThumbBtn && (
            <button 
              className={`${styles.thumbScrollBtn} ${styles.thumbScrollBtnLeft}`} 
              onClick={() => scrollThumbs("left")}
            >
              {'<'}
            </button>
          )}

          <div className={styles.multiImageGallery} ref={galleryRef}>
            {validMedia.map((media, idx) => {
              const thumbSrc = getMediaUrl(media);
              const thumbIsVideo = isVideo(thumbSrc);
              return (
                <div 
                  key={idx} 
                  className={`${styles.thumbItemWrapper} ${current === idx ? styles.activeThumb : ""}`}
                  onClick={() => setCurrent(idx)}
                >
                  {thumbIsVideo ? (
                    <video src={thumbSrc} className={styles.carouselThumb} />
                  ) : (
                    <img src={thumbSrc} alt={`Thumb ${idx}`} className={styles.carouselThumb} />
                  )}
                </div>
              );
            })}
          </div>

          {showNextThumbBtn && (
            <button 
              className={`${styles.thumbScrollBtn} ${styles.thumbScrollBtnRight}`} 
              onClick={() => scrollThumbs("right")}
            >
              {'>'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PostImageCarousel;