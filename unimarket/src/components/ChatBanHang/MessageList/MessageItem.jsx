import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useChat } from "../context/ChatContext";
import api from "../../../services/api";
import styles from "../ModuleChatCss/MessageItem.module.css";
import aiSuggestionsStyles from "../../../components/AI/AISuggestions.module.css";
import Swal from "sweetalert2";
import useResizeObserver from "../../../hooks/useResizeObserver";
import { FaEllipsisV, FaTrash, FaUndo, FaExpand, FaMapMarkerAlt, FaDirections } from "react-icons/fa";

const MessageItem = ({ message, showSeenStatus, onResize, onMediaLoaded, isFirstMessage }) => {
  const { user, openImageModal, deleteLocalMessage, sendMessageService } = useChat();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const menuContainerRef = useRef(null);
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);

  useResizeObserver(wrapperRef, onResize);

  const isSentByMe = message.maNguoiGui === user?.id;

  const handleMediaLoad = () => {
    try {
      if (typeof onMediaLoaded === "function") onMediaLoaded(message.maTinNhan);
    } catch (e) { /* ignore */ }

    try {
      if (typeof onResize === "function") onResize();
    } catch (e) { /* ignore */ }
  };

  // Giữ lại effect này để layout update nếu nội dung thay đổi
  useEffect(() => {
    try {
      if (typeof onResize === "function") onResize();
    } catch (e) { /* ignore */ }
  }, [message.isRecalled, message.noiDung, message.loaiTinNhan, onResize]);

  const formatTime = (time) => {
    return (
      time ||
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // ✅ Đã xóa toàn bộ hàm canRecallMessage, getRecallTimeRemaining và useEffect đếm giờ

  const handleVideoFullscreen = () => {
    if (videoRef.current) {
      try {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        } else if (videoRef.current.webkitRequestFullscreen) {
          videoRef.current.webkitRequestFullscreen();
        } else if (videoRef.current.msRequestFullscreen) {
          videoRef.current.msRequestFullscreen();
        }
      } catch (err) {
        console.error("Lỗi khi bật toàn màn hình:", err);
      }
    }
  };

  const toggleMessageMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => {
      const next = !prev;
      if (next && isFirstMessage && menuTriggerRef.current) {
        try {
          const rect = menuTriggerRef.current.getBoundingClientRect();
          const MENU_W = 200;
          const padding = 8;
          let left = rect.right - MENU_W - padding;
          left = Math.min(Math.max(left, padding), window.innerWidth - MENU_W - padding);
          const top = rect.bottom + 6;
          setMenuStyle({ position: "fixed", left: `${left}px`, top: `${top}px` });
        } catch (err) {
          setMenuStyle(null);
        }
      } else {
        setMenuStyle(null);
      }
      return next;
    });
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Xóa tin nhắn?",
      text: "Tin nhắn sẽ bị xóa ở phía bạn.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) {
      closeMenu();
      return;
    }

    try {
      const response = await api.delete(
        `/chat/delete-for-me/${message.maTinNhan}`,
        {
          params: { userId: user.id },
        }
      );

      try {
        deleteLocalMessage(message.maTinNhan);
      } catch (e) { /* ignore */ }

      if (response.data?.lastMessage) {
        window.dispatchEvent(
          new CustomEvent("messageDeleted", {
            detail: {
              lastMessage: response.data.lastMessage,
              maCuocTroChuyen: message.maCuocTroChuyen,
            },
          })
        );
      }

      Swal.fire({
        icon: "success",
        title: "Đã xóa",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Lỗi xóa tin nhắn:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể xóa tin nhắn. Vui lòng thử lại.",
      });
    }

    closeMenu();
  };

  // ✅ Đã xóa hàm handleRecall

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event) => {
      const t = event.target;
      if (menuRef.current && menuRef.current.contains(t)) return;
      if (menuContainerRef.current && menuContainerRef.current.contains(t)) return;
      if (menuTriggerRef.current && menuTriggerRef.current.contains(t)) return;
      closeMenu();
    };
    document.addEventListener("click", handleClickOutside);
    const handleResize = () => {
      if (isFirstMessage) closeMenu();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  // --- Hàm tách tọa độ từ link google map ---
  const extractCoords = (url) => {
    if (!url) return null;
    try {
      const regex = /([-+]?\d{1,2}\.\d+),\s*([-+]?\d{1,3}\.\d+)/;
      const match = url.match(regex);
      if (match) {
        return { lat: match[1], lng: match[2] };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`${styles.messageWrapper} ${
        isSentByMe ? styles.sentWrapper : styles.receivedWrapper
      }`}
    >
      <div
        className={`${styles.message} ${
          isSentByMe ? styles.sent : styles.received
        } ${message.isRecalled ? styles.recalled : ""}`}
      >
        {!message.isRecalled && (
          <div className={styles.menuContainer} ref={menuContainerRef}>
            <button
              ref={menuTriggerRef}
              className={`${styles.menuTrigger} ${
                isMenuOpen ? styles.menuActive : ""
              }`}
              onClick={toggleMessageMenu}
              aria-label="Message options"
            >
              <FaEllipsisV />
            </button>

            {isMenuOpen && (() => {
              const menu = (
                <div
                  ref={menuRef}
                  className={`${styles.messageMenu} ${isFirstMessage ? styles.menuBelow : ""}`}
                  style={menuStyle || undefined}
                >
                  {/* ✅ MENU ĐÃ ĐƯỢC LÀM GỌN: CHỈ CÒN NÚT XÓA */}
                  <button
                    className={`${styles.menuItem} ${styles.deleteItem}`}
                    onClick={handleDelete}
                  >
                    <FaTrash className={styles.menuIcon} />
                    <span className={styles.menuText}>
                        {isSentByMe ? "Xóa" : "Xóa tin nhắn"}
                    </span>
                  </button>
                </div>
              );

              if (isFirstMessage && typeof document !== "undefined") {
                return ReactDOM.createPortal(menu, document.body);
              }

              return menu;
            })()}
          </div>
        )}

        <div className={styles.messageContent}>
          {message.isRecalled ? (
            <p className={styles.recalledText}>
              <FaUndo size={12} />
              Tin nhắn đã được thu hồi
            </p>
          ) : message.loaiTinNhan === "image" ? (
            <div className={styles.mediaWrapper}>
              <img
                src={message.noiDung}
                alt="img-chat"
                className={styles.mediaContent}
                onLoad={handleMediaLoad}
                onClick={() => openImageModal(message.noiDung)}
              />
              <div className={styles.mediaOverlay}>
                <span className={styles.zoomIcon}>
                  <FaExpand />
                </span>
              </div>
            </div>
          ) : message.loaiTinNhan === "location" ? (
            /* ✅ GIAO DIỆN MAP CARD */
            (() => {
              const coords = extractCoords(message.noiDung);
              return (
                <div className={styles.locationCard}>
                  <div className={styles.mapPreview}>
                    {coords ? (
                      <iframe
                        title="location-preview"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=14&output=embed`}
                        style={{ border: 0, pointerEvents: "none" }}
                      />
                    ) : (
                      <div className={styles.mapPlaceholder}>
                        <FaMapMarkerAlt size={32} color="#ea4335" />
                      </div>
                    )}
                  </div>
                  <div
                    className={styles.locationFooter}
                    onClick={() => window.open(message.noiDung, "_blank")}
                  >
                    <div className={styles.locationInfoText}>
                      <span className={styles.locationTitle}>Vị trí hiện tại</span>
                      <span className={styles.locationCoords}>
                        {coords ? `${coords.lat}, ${coords.lng}` : "Nhấn để xem bản đồ"}
                      </span>
                    </div>
                    <button className={styles.directionBtn}>
                      <FaDirections size={18} />
                    </button>
                  </div>
                </div>
              );
            })()
          ) : message.loaiTinNhan === "video" ? (
            <div className={styles.mediaWrapper} onClick={handleVideoFullscreen}>
              <video
                ref={videoRef}
                src={message.noiDung}
                className={styles.mediaContent}
                onLoadedData={handleMediaLoad}
              />
              <div className={styles.mediaOverlay}>
                <span className={styles.zoomIcon}>
                  <FaExpand />
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className={styles.textContent}>{message.noiDung}</p>

              {message.isAi && Array.isArray(message.aiSuggestions) && message.aiSuggestions.length > 0 && (
                <div className={aiSuggestionsStyles.aiSuggestions}>
                  {message.aiSuggestions.slice(0, 8).map((s, idx) => {
                    const title = s?.ten || s?.Ten || s?.title || s?.name || "Sản phẩm";
                    const price = s?.gia || s?.Gia || s?.price || null;
                    const image = s?.anhDaiDien || s?.AnhDaiDien || s?.image || s?.Anh || null;
                    const isHot = s?.isHot || s?.IsHot || false;
                    const views = s?.soLuotXem || s?.SoLuotXem || 0;
                    const likes = s?.soLike || s?.SoLike || 0;
                    const productId = s?.id || s?.Id || s?.maTinDang || s?.MaTinDang;

                    return (
                      <div key={idx} className={aiSuggestionsStyles.aiCard} onClick={() => {
                        if (productId) {
                          window.location.href = `/tin-dang/${productId}`;
                        }
                      }}>
                        <div style={{ position: 'relative' }}>
                          {image ? <img src={image} alt={title} className={aiSuggestionsStyles.aiCardImage} /> : <div className={aiSuggestionsStyles.aiCardImagePlaceholder}></div>}
                          {isHot && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              zIndex: 10
                            }}>
                              🔥 HOT
                            </div>
                          )}
                        </div>
                        <div className={aiSuggestionsStyles.aiCardBody}>
                          <div className={aiSuggestionsStyles.aiCardTitle}>{title}</div>
                          {price != null && <div className={aiSuggestionsStyles.aiCardPrice}>{typeof price === 'number' ? price.toLocaleString('vi-VN') + ' đ' : price}</div>}
                          {(views > 0 || likes > 0) && (
                            <div style={{
                              fontSize: '11px',
                              color: '#64748b',
                              marginTop: '4px',
                              display: 'flex',
                              gap: '8px'
                            }}>
                              {views > 0 && <span>👁 {views}</span>}
                              {likes > 0 && <span>❤️ {likes}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {message.isAi && message.clarifyingQuestion && (
                <div className={aiSuggestionsStyles.aiClarify}>
                  <div className={aiSuggestionsStyles.aiClarifyText}>{message.clarifyingQuestion}</div>
                  <div className={aiSuggestionsStyles.aiClarifyActions}>
                    <button
                      className={aiSuggestionsStyles.aiQuickReply}
                      onClick={() => sendMessageService(message.clarifyingQuestion, 'text')}
                    >
                      Trả lời
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.messageInfo}>
          <span className={styles.messageTime}>
            {formatTime(message.thoiGian)}
          </span>
          {isSentByMe && showSeenStatus && !message.isRecalled && (
            <span className={styles.seenStatus}>Đã xem</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageItem);