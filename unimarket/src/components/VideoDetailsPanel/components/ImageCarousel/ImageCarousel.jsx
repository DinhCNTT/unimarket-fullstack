import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import styles from "./ImageCarousel.module.css";

const ImageCarousel = ({ images = [] }) => {
  const trackRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollStartRef = useRef(0);
  const candidateIndexRef = useRef(-1);

  const [showArrows, setShowArrows] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => setShowArrows(images.length > 5), [images]);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  const scrollByOneItem = (dir = "right") => {
    const el = trackRef.current;
    if (!el) return;
    const firstItem = el.querySelector(`.${styles.carouselItem}`);
    const gap = 12; 
    const itemWidth = firstItem ? firstItem.clientWidth + gap : Math.round(el.clientWidth * 0.5);
    el.scrollBy({ left: dir === "right" ? itemWidth : -itemWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const threshold = 6;

    const onPointerDown = (e) => {
      isPointerDownRef.current = true;
      isDraggingRef.current = false;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      scrollStartRef.current = el.scrollLeft;

      const item = e.target.closest(`.${styles.carouselItem}`);
      candidateIndexRef.current = item ? Number(item.dataset.index) : -1;

      el.classList.add(styles.dragging);
      try { el.setPointerCapture?.(e.pointerId); } catch {}
    };

    const onPointerMove = (e) => {
      if (!isPointerDownRef.current) return;
      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;
      if (!isDraggingRef.current && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
        isDraggingRef.current = true;
      }
      if (isDraggingRef.current) {
        el.scrollLeft = scrollStartRef.current - dx;
      }
    };

    const onPointerUp = (e) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;
      el.classList.remove(styles.dragging);
      try { el.releasePointerCapture?.(e.pointerId); } catch {}

      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;

      if (!isDraggingRef.current && candidateIndexRef.current >= 0 && Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
        setCurrentIndex(candidateIndexRef.current);
        setIsLightboxOpen(true);
      }
      isDraggingRef.current = false;
      candidateIndexRef.current = -1;
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    setTimeout(updateArrows, 50);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [images]);

  if (!images || images.length === 0) return null;

  const closeLightbox = () => setIsLightboxOpen(false);
  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const getImgSrc = (item) => (typeof item === "string" ? item : item.url ?? item.src);

  return (
    <>
      <div className={styles.carouselRoot}>
        {showArrows && (
          <button className={`${styles.carouselArrow} ${styles.left} ${!canScrollLeft ? styles.hidden : ""}`} onClick={() => scrollByOneItem("left")}>
            <FaChevronLeft />
          </button>
        )}
        <div className={styles.carouselViewport}>
          <div className={styles.carouselTrack} ref={trackRef} role="list" style={{ touchAction: "pan-y" }}>
            {images.map((src, i) => (
              <div key={i} data-index={i} className={styles.carouselItem} role="listitem">
                <img src={getImgSrc(src)} alt={`Ảnh ${i + 1}`} className={styles.carouselImg} draggable="false" />
              </div>
            ))}
          </div>
        </div>
        {showArrows && (
          <button className={`${styles.carouselArrow} ${styles.right} ${!canScrollRight ? styles.hidden : ""}`} onClick={() => scrollByOneItem("right")}>
            <FaChevronRight />
          </button>
        )}
      </div>

      {isLightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={closeLightbox}><IoClose size={28} /></button>
            <button className={styles.lightboxPrev} onClick={prevImage}><FaChevronLeft /></button>
            <img src={getImgSrc(images[currentIndex])} alt="Preview" className={styles.lightboxImg} />
            <button className={styles.lightboxNext} onClick={nextImage}><FaChevronRight /></button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCarousel;