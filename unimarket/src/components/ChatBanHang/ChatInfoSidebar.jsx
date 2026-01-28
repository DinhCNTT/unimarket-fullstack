// ChatInfoSidebar.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useChat } from "./context/ChatContext";
import styles from "./ModuleChatCss/ChatInfoSidebar.module.css";
import { FaBan, FaUnlock } from "react-icons/fa";
import { BsFlag, BsImage } from "react-icons/bs";
import { FiPlayCircle } from "react-icons/fi";
import api from "../../services/api"; // Đảm bảo đường dẫn này đúng
import AllMediaModal from "./AllMediaModal"; // Import modal mới

const ChatInfoSidebar = () => {
  const {
    isSidebarOpen,
    displayAvatar,
    displayTen,
    displayIsOnline,
    displayUserId,
    isBlockedByMe,
    isBlockedByOther,
    handleBlockUser,
    handleUnblockUser,
    maCuocTroChuyen,
    user,
    openImageModal, // Lấy từ context
    openVideoModal, // Lấy từ context
    danhSachTin, // Dùng để theo dõi tin nhắn mới
  } = useChat();

  // State riêng cho media
  const [mediaList, setMediaList] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  
  // State để quản lý modal "Xem tất cả"
  const [isAllMediaModalOpen, setIsAllMediaModalOpen] = useState(false);

  // Lấy số lượng tin nhắn làm biến phụ thuộc
  const messageCount = danhSachTin.length;

  // Effect để tải media
  useEffect(() => {
    // Chỉ tải khi sidebar mở, có mã chat, và có user
    if (isSidebarOpen && maCuocTroChuyen && user?.id) {
      const fetchMedia = async () => {
        setIsLoadingMedia(true);
        try {
          const response = await api.get(
            `/chat/media/${maCuocTroChuyen}`,
            {
              params: {
                userId: user.id,
                page: 1,
                pageSize: 8, // SỬA: Tải 8 media mới nhất cho preview
              },
            }
          );
          setMediaList(response.data || []);
        } catch (error) {
          console.error("Lỗi tải media cho sidebar:", error);
          setMediaList([]);
        } finally {
          setIsLoadingMedia(false);
        }
      };

      fetchMedia();
    }

    // Nếu sidebar đóng, reset danh sách media
    if (!isSidebarOpen) {
      setMediaList([]);
    }
    // Phụ thuộc vào: sidebar mở/đóng, mã chat, user, và SỐ LƯỢNG TIN NHẮN
  }, [isSidebarOpen, maCuocTroChuyen, user?.id, messageCount]);

  return (
    <> {/* BỌC TRONG FRAGMENT */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
        {/* Nội dung */}
        <div className={styles.sidebarContent}>
          {/* Thông tin người dùng */}
          <div className={styles.userInfoSection}>
            <div className={styles.avatarWrapper}>
              <img
                src={displayAvatar || "/src/assets/default-avatar.png"}
                alt="avatar"
                className={styles.avatar}
              />
              <span
                className={`${styles.statusDot} ${
                  displayIsOnline ? styles.online : styles.offline
                }`}
              ></span>
            </div>
            <h4 className={styles.userName}>{displayTen}</h4>
            {displayUserId && (
              <Link
                to={`/nguoi-dung/${displayUserId}`}
                className={styles.profileButton}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Xem trang</span>
              </Link>
            )}
          </div>

          <hr className={styles.divider} />

          {/* Các hành động: Chặn, Báo xấu */}
          <div className={styles.actionsSection}>
            {!isBlockedByMe && !isBlockedByOther ? (
              <button
                className={`${styles.actionButton} ${styles.blockButton}`}
                onClick={handleBlockUser}
              >
                <FaBan />
                <span>Chặn người dùng</span>
              </button>
            ) : isBlockedByMe ? (
              <button
                className={`${styles.actionButton} ${styles.unblockButton}`}
                onClick={handleUnblockUser}
              >
                <FaUnlock />
                <span>Gỡ chặn</span>
              </button>
            ) : (
              <div className={styles.isBlockedNotice}>
                <FaBan />
                <p>Bạn đã bị người này chặn.</p>
              </div>
            )}
            <button className={`${styles.actionButton} ${styles.reportButton}`}>
              <BsFlag />
              <span>Báo xấu</span>
            </button>
          </div>

          {/* Phần Media (Ảnh & Video) */}
          <hr className={styles.divider} />
          <div className={styles.mediaSection}>
            <h5 className={styles.mediaSectionTitle}>Ảnh và video</h5>

            {isLoadingMedia ? (
              <p className={styles.mediaLoading}>Đang tải...</p>
            ) : mediaList.length > 0 ? (
              // Bọc grid và nút bằng Fragment
              <>
                <div className={styles.mediaGrid}>
                  {mediaList.map((media) => (
                    <div
                      key={media.maTinNhan}
                      className={styles.mediaItem}
                      onClick={() =>
                        media.loaiTinNhan === "image"
                          ? openImageModal(media.noiDung) // Gọi modal ảnh
                          : openVideoModal(media.noiDung) // Gọi modal video
                      }
                    >
                      {media.loaiTinNhan === "image" ? (
                        <img
                          src={media.noiDung}
                          alt="media"
                          className={styles.mediaItemImage}
                        />
                      ) : (
                        <div className={styles.mediaItemVideo}>
                          <video
                            src={media.noiDung}
                            className={styles.mediaItemImage}
                            muted
                            playsInline
                          />
                          <FiPlayCircle className={styles.videoIcon} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* THÊM NÚT XEM TẤT CẢ */}
                <button
                  className={styles.viewAllButton}
                  onClick={() => setIsAllMediaModalOpen(true)}
                >
                  Xem tất cả
                </button>
              </>
            ) : (
              <div className={styles.mediaEmpty}>
                <BsImage />
                <p>Hình, video mới nhất của trò chuyện sẽ xuất hiện tại đây</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* THÊM MODAL (Nó sẽ chỉ render khi state là true) */}
      {isAllMediaModalOpen && (
        <AllMediaModal
          isOpen={isAllMediaModalOpen}
          onClose={() => setIsAllMediaModalOpen(false)}
          maCuocTroChuyen={maCuocTroChuyen}
          openImageModal={openImageModal}
          openVideoModal={openVideoModal}
        />
      )}
    </>
  );
};

export default ChatInfoSidebar;