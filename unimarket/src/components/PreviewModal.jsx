import React, { useState, useRef, useEffect } from "react";
import styles from "./PreviewModal.module.css";

const PreviewModal = ({
  showPreview,
  previewData,
  activePreviewMedia,
  setActivePreviewMedia,
  onClose,
}) => {
  if (!showPreview || !previewData) return null;

  const listRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Hàm kiểm tra trạng thái cuộn để ẩn/hiện mũi tên
  const checkScroll = () => {
    if (listRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
      setShowLeftArrow(scrollLeft > 0);
      // Thêm 1px buffer nhỏ để xử lý sai số
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Chạy khi component mount, resize, hoặc khi data thay đổi
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    // Kiểm tra ban đầu
    checkScroll();

    // Thêm listener cho sự kiện cuộn (khi ta bấm nút)
    listEl.addEventListener("scroll", checkScroll);
    // Thêm listener cho sự kiện resize cửa sổ
    window.addEventListener("resize", checkScroll);

    // Cleanup listeners
    return () => {
      listEl.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [previewData]); // Re-check nếu dữ liệu preview thay đổi

  // Hàm xử lý cuộn
  const handleScroll = (direction) => {
    if (listRef.current) {
      const scrollAmount = 200; // Cuộn 200px mỗi lần click
      listRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={styles.previewBackdrop} onClick={onClose}>
      <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng modal */}
        <button type="button" className={styles.previewCloseBtn} onClick={onClose}>
          &times;
        </button>

        {/* Layout 2 cột */}
        <div className={styles.previewLayout}>
          {/* Cột 1: Media (Ảnh/Video) */}
          <div className={styles.previewMedia}>
            <div className={styles.previewHeroContainer}>
              {previewData.images[activePreviewMedia]?.type.startsWith("video") ? (
                <video
                  src={previewData.images[activePreviewMedia].url}
                  controls
                  autoPlay
                  muted
                  className={styles.previewHeroMedia}
                />
              ) : (
                <img
                  src={
                    previewData.images[activePreviewMedia]?.url ||
                    "https://via.placeholder.com/600x400?text=No+Image"
                  }
                  alt="Preview chính"
                  className={styles.previewHeroMedia}
                />
              )}
            </div>

            {/* Danh sách thumbnail */}
            {previewData.images.length > 1 && (
              <div className={styles.thumbnailContainer}>
                {/* NÚT TRÁI */}
                {showLeftArrow && (
                  <button
                    type="button"
                    className={`${styles.thumbArrow} ${styles.thumbArrowLeft}`}
                    onClick={() => handleScroll("left")}
                  >
                    &lt;
                  </button>
                )}

                {/* List ảnh nhỏ */}
                <div className={styles.previewThumbnailList} ref={listRef}>
                  {previewData.images.map((media, idx) => (
                    <div
                      key={idx}
                      className={`${styles.previewThumbnailWrapper} ${
                        idx === activePreviewMedia ? styles.active : ""
                      }`}
                      onClick={() => setActivePreviewMedia(idx)}
                    >
                      {media.type.startsWith("video") ? (
                        <video
                          src={media.url}
                          className={styles.previewThumbnail}
                        />
                      ) : (
                        <img
                          src={media.url}
                          alt={`thumbnail ${idx}`}
                          className={styles.previewThumbnail}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* NÚT PHẢI */}
                {showRightArrow && (
                  <button
                    type="button"
                    className={`${styles.thumbArrow} ${styles.thumbArrowRight}`}
                    onClick={() => handleScroll("right")}
                  >
                    &gt;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cột 2: Thông tin chi tiết */}
          <div className={styles.previewMainInfo}>
            <h2 className={styles.previewTitle}>{previewData.title}</h2>
            <p className={styles.previewPrice}>
              {previewData.price} VNĐ
              {previewData.canNegotiate && (
                <span className={styles.negotiateTag}> (Có thương lượng)</span>
              )}
            </p>

            <h3 className={styles.previewSectionTitle}>Mô tả chi tiết</h3>
            <div
              className={styles.previewDescription}
              dangerouslySetInnerHTML={{
                __html: previewData.description.replace(/\n/g, "<br>"),
              }}
            />

            <h3 className={styles.previewSectionTitle}>Thông tin thêm</h3>
            <div className={styles.previewDetailGrid}>
              {/* Các thông tin cơ bản */}
              <div className={styles.previewDetailItem}>
                <span className={styles.previewDetailKey}>Danh mục:</span>
                <span className={styles.previewDetailValue}>
                  {previewData.categoryName}
                </span>
              </div>
              <div className={styles.previewDetailItem}>
                <span className={styles.previewDetailKey}>Tình trạng:</span>
                <span className={styles.previewDetailValue}>
                  {previewData.condition}
                </span>
              </div>
              <div className={styles.previewDetailItem}>
                <span className={styles.previewDetailKey}>Khu vực:</span>
                <span className={styles.previewDetailValue}>{`${previewData.district}, ${previewData.province}`}</span>
              </div>

              {/* 👇👇👇 PHẦN MỚI: Hiển thị thông tin động (Hãng, Màu, v.v...) 👇👇👇 */}
              {previewData.details &&
                Object.entries(previewData.details).map(([key, value]) => (
                  value ? (
                    <div className={styles.previewDetailItem} key={key}>
                      <span className={styles.previewDetailKey}>{key}:</span>
                      <span className={styles.previewDetailValue}>{value}</span>
                    </div>
                  ) : null
                ))}
              {/* 👆👆👆 KẾT THÚC PHẦN MỚI 👆👆👆 */}
            </div>

            <div className={styles.previewContactInfo}>
              <h3 className={styles.previewSectionTitle}>Thông tin liên hệ</h3>
              <p>{previewData.contactInfo}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;