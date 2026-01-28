// AllMediaModal.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../services/api";
import { useChat } from "./context/ChatContext"; // Để lấy user.id
import styles from "./ModuleChatCss/AllMediaModal.module.css"; // CSS mới
import { IoMdClose } from "react-icons/io";
import { FiPlayCircle } from "react-icons/fi";
import { BsImage } from "react-icons/bs";

// Hàm helper để nhóm media theo ngày
const groupMediaByDate = (mediaList) => {
  const groups = new Map();
  mediaList.forEach(media => {
    const dateObj = new Date(media.thoiGianGui);
    // Format "Ngày D Tháng M"
    const displayDate = `Ngày ${dateObj.getDate()} Tháng ${dateObj.getMonth() + 1}`;
    
    if (!groups.has(displayDate)) {
      groups.set(displayDate, []);
    }
    groups.get(displayDate).push(media);
  });
  // Trả về mảng các [key, value]
  return Array.from(groups.entries());
};

const AllMediaModal = ({ isOpen, onClose, maCuocTroChuyen, openImageModal, openVideoModal }) => {
  const { user } = useChat();
  const [allMedia, setAllMedia] = useState([]);
  const [groupedMedia, setGroupedMedia] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observer = useRef();

  // Callback ref cho loader (phần tử cuối danh sách)
  const loaderRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      // Nếu loader hiển thị và còn media, tăng số trang
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  // Hàm fetch media (theo trang)
  const fetchMedia = async (pageNum) => {
    if (!user?.id || !maCuocTroChuyen) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/chat/media/${maCuocTroChuyen}`, {
        params: {
          userId: user.id,
          page: pageNum,
          pageSize: 21 // Tải 21 item (7 hàng x 3 cột) mỗi lần
        }
      });
      
      const newMedia = response.data || [];
      
      if (newMedia.length === 0) {
        setHasMore(false);
      } else {
        // Nối media mới vào list cũ
        setAllMedia(prevMedia => {
          // Tránh trùng lặp nếu API trả lại item cũ
          const mediaIds = new Set(prevMedia.map(m => m.maTinNhan));
          const uniqueNewMedia = newMedia.filter(m => !mediaIds.has(m.maTinNhan));
          return [...prevMedia, ...uniqueNewMedia];
        });
      }
    } catch (error) {
      console.error("Lỗi tải tất cả media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect fetch lần đầu khi modal mở
  useEffect(() => {
    if (isOpen) {
      // Reset state khi mở
      setAllMedia([]);
      setGroupedMedia([]);
      setPage(1);
      setHasMore(true);
      fetchMedia(1); // Fetch trang 1
    }
  }, [isOpen, maCuocTroChuyen, user?.id]);

  // Effect fetch khi page thay đổi (do infinite scroll)
  useEffect(() => {
    if (isOpen && page > 1) {
      fetchMedia(page);
    }
  }, [page, isOpen]);

  // Effect cập nhật danh sách đã nhóm khi allMedia thay đổi
  useEffect(() => {
    setGroupedMedia(groupMediaByDate(allMedia));
  }, [allMedia]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h4 className={styles.modalTitle}>Ảnh/Video</h4>
          <button className={styles.closeButton} onClick={onClose}>
            <IoMdClose />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {groupedMedia.length > 0 ? (
            groupedMedia.map(([date, mediaItems]) => (
              <div key={date} className={styles.dateGroup}>
                <h5 className={styles.dateHeader}>{date}</h5>
                <div className={styles.mediaGrid}>
                  {mediaItems.map(media => (
                    <div
                      key={media.maTinNhan}
                      className={styles.mediaItem}
                      onClick={() =>
                        media.loaiTinNhan === "image"
                          ? openImageModal(media.noiDung)
                          : openVideoModal(media.noiDung)
                      }
                    >
                      {media.loaiTinNhan === "image" ? (
                        <img src={media.noiDung} alt="media" className={styles.mediaItemImage} />
                      ) : (
                        <div className={styles.mediaItemVideo}>
                          <video src={media.noiDung} className={styles.mediaItemImage} muted playsInline />
                          <FiPlayCircle className={styles.videoIcon} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : !isLoading && hasMore ? ( // Chỉ hiện "empty" nếu load xong và không có gì
            <div className={styles.mediaEmpty}>
              <BsImage />
              <p>Chưa có ảnh hoặc video nào.</p>
            </div>
          ) : null}
          
          {/* Loader cho infinite scroll */}
          {isLoading && <p className={styles.mediaLoading}>Đang tải thêm...</p>}
          {/* Phần tử vô hình để kích hoạt loader */}
          <div ref={loaderRef} style={{ height: "1px", width: "100%" }} />
        </div>
      </div>
    </div>
  );
};

export default AllMediaModal;