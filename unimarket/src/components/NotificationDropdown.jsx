import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NotificationDropdown.module.css";
import api from "../services/api"; 
import { GlobalNotificationContext } from "../context/GlobalNotificationContext";

// --- 🔥 COMPONENT MỚI: SafeAvatar ---
// Giúp xử lý ảnh lỗi an toàn, tránh vòng lặp nháy ảnh (flickering) khi onError
const SafeAvatar = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Reset lại state nếu src từ props thay đổi (dùng khi list re-render)
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback về ảnh mặc định
      setImgSrc("/images/default-avatar.png"); 
    }
  };

  return (
    <img 
      src={imgSrc || "/images/default-avatar.png"} 
      alt={alt} 
      className={className} 
      onError={handleError}
    />
  );
};
// ----------------------------------------

// Cấu hình các bộ lọc
const FILTERS = [
  { id: "all", label: "All activity" },
  { id: "likes", label: "Likes" },
  { id: "comments", label: "Comments" },
  { id: "followers", label: "Followers" }, 
];

export default function NotificationDropdown({ onClose }) {
  // --- 1. STATE & HOOKS ---

  // Khởi tạo state từ localStorage để nhớ Tab cũ (mặc định là 'all')
  const [activeFilter, setActiveFilter] = useState(() => {
    return localStorage.getItem("notification_filter_tab") || "all";
  });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State lưu danh sách ID những người mình đang follow để hiển thị nút đúng
  const [myFollowingIds, setMyFollowingIds] = useState(new Set()); 
  const [myPendingIds, setMyPendingIds] = useState(new Set());
  const navigate = useNavigate();
  const { socket, markAsReadGlobal } = useContext(GlobalNotificationContext);

  // --- 2. EFFECTS ---

  // Helper: Map loại thông báo từ Backend sang ID của Filter Tab
  const mapTypeToFilter = (backendType) => {
    switch (backendType) {
      case "Like": return "likes";
      case "Comment": 
      case "Reply": return "comments";
      case "Follow": 
      case "FollowRequest": 
      case "FollowAccepted": 
        return "followers";
      case "Mention": return "mentions";
      default: return "all";
    }
  };

  // Effect phụ: Lưu activeFilter vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem("notification_filter_tab", activeFilter);
  }, [activeFilter]);

  // Effect chính: Gọi API lấy danh sách thông báo & danh sách Following
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Chạy song song 2 API để tối ưu tốc độ
        const [notiRes, followingRes] = await Promise.all([
          api.get(`/usernotification?filter=${activeFilter}&page=1`),
          api.get(`/follow/following`) // API lấy danh sách người mình follow
        ]);

        setNotifications(notiRes.data);

        // Lưu các ID mình đang follow vào Set để tra cứu cho nhanh (O(1))
        const ids = new Set(followingRes.data.map(item => item.followingId));
        setMyFollowingIds(ids);

      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeFilter]);

  // Effect Socket: Lắng nghe thông báo Realtime
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (newNoti) => {
      const currentFilterMap = mapTypeToFilter(newNoti.type);
      // Chỉ thêm vào list nếu đang ở tab All hoặc tab tương ứng với loại thông báo
      if (activeFilter === 'all' || activeFilter === currentFilterMap) {
        setNotifications((prev) => [newNoti, ...prev]);
      }
    };
    socket.on("ReceiveNotification", handleNewNotification);
    return () => socket.off("ReceiveNotification", handleNewNotification);
  }, [socket, activeFilter]);

  // --- 3. HANDLERS ---

  // Xử lý Toggle Follow (Cho loại thông báo 'Follow' công khai)
  const handleFollowAction = async (e, targetUserId) => {
    e.stopPropagation(); 

    try {
      const res = await api.post(`/follow/toggle?targetUserId=${targetUserId}`);
      
      if (res.data.success) {
        // 1. Cập nhật danh sách Following (Đã chấp nhận)
        setMyFollowingIds(prev => {
          const newSet = new Set(prev);
          if (res.data.isFollowed) {
            newSet.add(targetUserId); 
          } else {
            newSet.delete(targetUserId); 
          }
          return newSet;
        });

        // 2. 🔥 MỚI: Cập nhật danh sách Pending (Đang chờ)
        setMyPendingIds(prev => {
            const newSet = new Set(prev);
            if (res.data.isPending) {
                newSet.add(targetUserId);
            } else {
                newSet.delete(targetUserId);
            }
            return newSet;
        });
      }
    } catch (err) {
      console.error("Lỗi follow:", err);
    }
  };

  // Xử lý CHẤP NHẬN yêu cầu (Cho loại 'FollowRequest')
  const handleConfirmRequest = async (e, noti) => {
    e.stopPropagation();
    try {
      await api.post(`/follow/accept-request?requesterId=${noti.senderId}`);
      
      // Update UI: Xóa thông báo yêu cầu khỏi list vì đã xử lý xong
      setNotifications(prev => prev.filter(n => n.id !== noti.id));
    } catch (err) {
      console.error("Lỗi chấp nhận:", err);
    }
  };

  // Xử lý TỪ CHỐI / XÓA yêu cầu (Cho loại 'FollowRequest')
  const handleDeleteRequest = async (e, noti) => {
    e.stopPropagation();
    try {
      await api.post(`/follow/decline-request?requesterId=${noti.senderId}`);
      setNotifications(prev => prev.filter(n => n.id !== noti.id));
    } catch (err) {
      console.error("Lỗi từ chối:", err);
    }
  };

  // Xử lý khi click vào 1 thông báo (Điều hướng & Đọc)
  const handleNotificationClick = async (noti) => {
    // 1. Đánh dấu đã đọc
    if (!noti.isRead) {
      try {
        await api.post(`/usernotification/${noti.id}/read`);
        setNotifications((prev) => 
          prev.map((n) => n.id === noti.id ? { ...n, isRead: true } : n)
        );
        if (markAsReadGlobal) markAsReadGlobal();
      } catch (err) { console.error(err); }
    }

    // 2. Điều hướng
    if (noti.type === "Follow" || noti.type === "FollowRequest" || noti.type === "FollowAccepted") {
      navigate(`/nguoi-dung/${noti.senderId}`);
      if (onClose) onClose(); 
    } 
    // Kiểm tra referenceId cho Video (Like, Comment, Reply, Mention)
    else if (noti.referenceId || noti.refId) {
      const videoId = noti.referenceId || noti.refId;
      
      let targetUrl = `/video-standalone/${videoId}`;
      
      // Nếu là thông báo Comment/Reply và có ID cụ thể, thêm vào URL để scroll tới
      if ((noti.type === 'Comment' || noti.type === 'Reply') && noti.entityId) {
          targetUrl += `?commentId=${noti.entityId}`;
      }

      navigate(targetUrl);
      
      if (onClose) onClose(); 
    }
  };

  // Helper: Render nội dung chữ
  const renderContentText = (noti) => {
    switch (noti.type) {
      case 'Like': 
        return <span>đã thích video của bạn.</span>;
      case 'Comment': 
        return <span>đã bình luận: "{noti.content}"</span>;
      case 'Reply': 
        return <span>đã trả lời bình luận của bạn: "{noti.content}"</span>;
      case 'Follow': 
        return <span>đã bắt đầu follow bạn.</span>;
      case 'FollowRequest': 
        return <span>đã gửi yêu cầu theo dõi bạn.</span>;
      case 'FollowAccepted': 
        return <span>đã chấp nhận yêu cầu theo dõi của bạn.</span>;
      case 'Mention': 
        return <span>đã nhắc đến bạn trong một bình luận.</span>;
      default: 
        return <span>{noti.content}</span>;
    }
  };

  // Ngăn cuộn trang cha khi cuộn trong dropdown
  const stopScrollPropagation = (e) => { e.stopPropagation(); };

  // --- 4. RENDER ---
  return (
    <div 
      className={styles.container}
      id="notification-dropdown-container" 
      onWheel={stopScrollPropagation}
      onTouchStart={stopScrollPropagation}
      onTouchMove={stopScrollPropagation}
      onTouchEnd={stopScrollPropagation}
    >
      {/* HEADER & FILTER */}
      <div className={styles.header}>
        <h3 className={styles.title}>Thông báo</h3>
        <div className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`${styles.pill} ${activeFilter === f.id ? styles.active : ""}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIST NOTIFICATIONS */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.centerMessage}>Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.centerMessage}>Chưa có thông báo nào.</div>
        ) : (
          notifications.map((noti) => {
            // Kiểm tra xem mình đã follow người này chưa
            const isFollowing = myFollowingIds.has(noti.senderId);

            return (
              <div 
                key={noti.id} 
                className={`${styles.item} ${!noti.isRead ? styles.unread : ""}`}
                onClick={() => handleNotificationClick(noti)}
              >
                {/* --- 🔥 SỬA: Thay img bằng SafeAvatar --- */}
                <SafeAvatar 
                  src={noti.senderAvatarUrl} 
                  alt="avatar" 
                  className={styles.avatar}
                />
                {/* --------------------------------------- */}
                
                {/* Nội dung */}
                <div className={styles.contentWrapper}>
                  <div>
                    <span className={styles.username}>{noti.senderName} </span>
                    {renderContentText(noti)}
                  </div>
                  <span className={styles.time}>{noti.timeAgo}</span>
                </div>

                {/* Thumbnail Video (nếu có) */}
                {(noti.type === 'Like' || noti.type === 'Comment' || noti.type === 'Reply') && noti.postThumbnailUrl && (
                    <img src={noti.postThumbnailUrl} className={styles.postThumb} alt="post thumbnail" />
                )}
                
                {/* --- ACTION BUTTONS --- */}

                {/* CASE 1: Yêu cầu theo dõi (FollowRequest) -> Hiện nút Xác nhận / Xóa */}
                {noti.type === 'FollowRequest' && (
                    <div className={styles.actionButtons}>
                        <button 
                            className={styles.confirmBtn} 
                            onClick={(e) => handleConfirmRequest(e, noti)}
                        >
                            Xác nhận
                        </button>
                        <button 
                            className={styles.deleteBtn}
                            onClick={(e) => handleDeleteRequest(e, noti)}
                        >
                            Xóa
                        </button>
                    </div>
                )}

                {/* CASE 2: Follow công khai (Follow) -> Hiện nút Follow Back / Friends */}
                {/* CASE 2: Follow công khai (Follow) -> Hiện nút Follow Back / Friends / Pending */}
                {noti.type === 'Follow' && (
                  (() => {
                    const isFollowing = myFollowingIds.has(noti.senderId);
                    const isPending = myPendingIds.has(noti.senderId); // 🔥 Check Pending

                    if (isFollowing) {
                        // Trạng thái: Đã follow nhau -> Hiện nút Friends
                        return (
                            <button 
                              className={styles.friendBtn}
                              onClick={(e) => handleFollowAction(e, noti.senderId)} 
                            >
                              <svg className={styles.friendIcon} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 25.5H8.5V11.5H14.5V25.5Z" fill="currentColor" /><path d="M39.5 25.5H33.5V11.5H39.5V25.5Z" fill="currentColor" /><path d="M22.5 35.5H28.5V21.5H22.5V35.5Z" fill="currentColor" transform="rotate(90 25.5 28.5)" /><path fillRule="evenodd" clipRule="evenodd" d="M11.5 13.5H11.5V13.5Z" fill="currentColor"/></svg>
                              Friends
                            </button>
                        );
                    } else if (isPending) {
                        // 🔥 MỚI: Trạng thái chờ xác nhận -> Hiện nút Đã gửi yêu cầu
                        return (
                            <button 
                              className={styles.friendBtn} // Dùng style xám giống Friend
                              style={{ padding: '0 10px', fontSize: '12px' }} // Tinh chỉnh style nếu cần
                              onClick={(e) => handleFollowAction(e, noti.senderId)} 
                            >
                              Đã gửi yêu cầu
                            </button>
                        );
                    } else {
                        // Trạng thái: Chưa follow lại -> Hiện nút Follow Back
                        return (
                            <button 
                              className={styles.followBtn}
                              onClick={(e) => handleFollowAction(e, noti.senderId)}
                            >
                              Follow back
                            </button>
                       );
                    }
                  })()
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}