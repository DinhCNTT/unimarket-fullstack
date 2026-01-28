import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaHeart, FaVideo, FaBookmark } from "react-icons/fa"; // Cần cài: npm install react-icons
import defaultAvatar from "../../assets/default-avatar.png"; // Đảm bảo đường dẫn đúng
import styles from "./UserRow.module.css";

const UserRow = ({ user }) => {
  const navigate = useNavigate();

  // State quản lý trạng thái follow tại chỗ (để UI phản hồi nhanh)
  const [isFollowed, setIsFollowed] = useState(user.isFollowed);
  const [followersCount, setFollowersCount] = useState(user.followersCount || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Hàm format số lượng hiển thị cho đẹp (VD: 1.5M, 10K)
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Xử lý sự kiện click Follow/Unfollow
  const handleFollowClick = async (e) => {
    e.stopPropagation(); // Ngăn chặn click lan ra ngoài (để không nhảy vào trang cá nhân)
    
    // Kiểm tra token đăng nhập
    const token = localStorage.getItem("token"); // Hoặc lấy từ Context/Redux
    if (!token) {
      alert("Bạn cần đăng nhập để thực hiện chức năng này.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    // --- OPTIMISTIC UPDATE: Cập nhật giao diện trước khi gọi API (giúp cảm giác mượt) ---
    const previousState = isFollowed;
    const previousCount = followersCount;

    if (isFollowed) {
      // Nếu đang follow -> Unfollow (giảm số)
      setIsFollowed(false);
      setFollowersCount((prev) => prev - 1);
    } else {
      // Nếu chưa follow -> Follow (tăng số)
      setIsFollowed(true);
      setFollowersCount((prev) => prev + 1);
    }

    try {
      // Xác định endpoint dựa trên trạng thái HIỆN TẠI (trước khi click)
      // Nếu đang follow (previousState = true) -> Gọi API Unfollow
      // Nếu chưa follow (previousState = false) -> Gọi API Follow
      const action = previousState ? "unfollow" : "follow";
      
      const response = await fetch(
        `http://localhost:5133/api/Follow/${action}?followingId=${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi kết nối server");
      }
      
      // Nếu thành công thì không cần làm gì thêm vì đã cập nhật Optimistic ở trên rồi

    } catch (error) {
      console.error("Follow error:", error);
      // Nếu lỗi -> Hoàn tác lại trạng thái cũ
      setIsFollowed(previousState);
      setFollowersCount(previousCount);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Click vào dòng user -> Chuyển trang cá nhân
  const handleRowClick = () => {
    navigate(`/nguoi-dung/${user.id}`);
  };

  return (
    <div className={styles.userRow} onClick={handleRowClick}>
      {/* --- PHẦN TRÁI: AVATAR & INFO --- */}
      <div className={styles.leftSection}>
        {/* Avatar */}
        <div className={styles.avatarWrapper}>
          <img
            src={user.avatarUrl?.trim() ? user.avatarUrl : defaultAvatar}
            alt={user.fullName}
            className={styles.avatar}
          />
        </div>

        {/* Thông tin chi tiết */}
        <div className={styles.info}>
          {/* Tên & Tích xanh */}
          <div className={styles.nameRow}>
            <h4 className={styles.name}>{user.fullName}</h4>
            {/* Logic hiển thị tích xanh: Ví dụ có > 1K follow hoặc backend trả về isVerified */}
            {followersCount >= 1000 && <FaCheckCircle className={styles.checkIcon} />}
          </div>

          {/* ID hoặc SĐT */}
          <div className={styles.subInfo}>
            {user.phoneNumber 
              ? `SĐT: ${user.phoneNumber}` 
              : `@${user.id.substring(0, 8)}...` // Fallback nếu không có SĐT
            }
          </div>

          {/* Thống kê (Smart Stats) */}
          <div className={styles.statsRow}>
            {/* Followers */}
            <span className={styles.statItem} title="Người theo dõi">
              <strong>{formatNumber(followersCount)}</strong> Follower
            </span>
            
            <span className={styles.dot}>•</span>

            {/* Total Likes */}
            <span className={styles.statItem} title="Tổng lượt thích">
              <strong>{formatNumber(user.totalLikes)}</strong> <FaHeart size={10} />
            </span>

            <span className={styles.dot}>•</span>

            {/* Total Videos */}
            <span className={styles.statItem} title="Tổng video">
              <strong>{user.totalVideos}</strong> <FaVideo size={10} />
            </span>

            {/* Hiển thị thêm lượt Save nếu có không gian hoặc số lượng lớn */}
            {user.totalSaves > 0 && (
              <>
                <span className={styles.dot}>•</span>
                <span className={styles.statItem} title="Lượt lưu video">
                  <strong>{formatNumber(user.totalSaves)}</strong> <FaBookmark size={10} />
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- PHẦN PHẢI: NÚT FOLLOW --- */}
      <div className={styles.actionSection}>
        <button
          className={`${styles.followBtn} ${
            isFollowed ? styles.followed : styles.notFollowed
          }`}
          onClick={handleFollowClick}
          disabled={isLoading}
        >
          {isFollowed ? "Following" : "Follow"}
        </button>
      </div>
    </div>
  );
};

export default UserRow;