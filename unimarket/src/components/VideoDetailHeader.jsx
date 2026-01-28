import React, { useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoPhonePortraitOutline,
  IoDownloadOutline,
  IoPersonOutline,
  IoLogOutOutline,
  IoSettingsOutline
} from "react-icons/io5";

import { AuthContext } from "../context/AuthContext";
import styles from "./VideoDetailHeader.module.css";

// ✅ IMPORT ẢNH MẶC ĐỊNH
import defaultAvatar from "../assets/default-avatar.png";

const VideoDetailHeader = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const timeoutRef = useRef(null);

  // 1. Khi ấn nút Đăng xuất trong Menu -> Chỉ hiện Modal
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowMenu(false); // Đóng menu đi
  };

  // 2. Xác nhận Đăng xuất thật -> Gọi hàm logout và reload
  const handleConfirmLogout = () => {
    if (logout) logout();
    window.location.reload();
  };

  // 3. Hủy đăng xuất -> Đóng Modal
  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // --- Logic Menu Hover ---
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowMenu(false);
    }, 300);
  };

  // ✅ HÀM XỬ LÝ ẢNH ĐẠI DIỆN
  const getUserAvatar = () => {
    // Ưu tiên profilePicture, sau đó đến avatarUrl
    const src = user.profilePicture || user.avatarUrl;
    
    // Nếu không có link -> dùng ảnh mặc định
    if (!src) return defaultAvatar;

    // Nếu có link, kiểm tra http (nếu thiếu thì thêm localhost)
    return src.startsWith("http") ? src : `http://localhost:5133${src}`;
  };

  return (
    <>
      <div className={styles.wrapper}>
        {/* --- CÁC NÚT HEADER (Giữ nguyên) --- */}
        <button className={styles.btn}>
          <div className={styles.uLogoContainer}>
              <span className={styles.uLogoText}>U</span>
          </div>
          <span className={styles.text}>Get Coins</span>
        </button>

        <button className={styles.btn}>
          <IoPhonePortraitOutline className={styles.icon} />
          <span className={styles.text}>Get App</span>
        </button>

        <button className={styles.btn}>
          <IoDownloadOutline className={styles.icon} />
          <span className={styles.text}>PC App</span>
        </button>

        <div className={styles.divider}></div>

        {/* --- AVATAR USER --- */}
        {user ? (
          <div
              className={styles.userContainer}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
          >
            {/* ✅ CẬP NHẬT THẺ IMG: Dùng hàm getUserAvatar và thêm onError */}
            <img
              src={getUserAvatar()}       
              alt="Avatar"
              className={styles.avatar}
              onError={(e) => {
                // Nếu ảnh lỗi (404) -> chuyển về ảnh mặc định
                e.target.onerror = null;
                e.target.src = defaultAvatar;
              }}
            />

            {showMenu && (
              <div
                  className={styles.dropdown}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
              >
                  <div className={styles.menuItem} onClick={() => navigate(`/nguoi-dung/${user.id}`)}>
                    <IoPersonOutline /> Trang cá nhân
                  </div>
                  <div className={styles.menuItem} onClick={() => navigate('/cai-dat-tai-khoan')}>   
                    <IoSettingsOutline /> Cài đặt
                  </div>
                  {/* ✅ Ấn vào đây sẽ gọi Modal */}
                  <div className={`${styles.menuItem} ${styles.logout}`} onClick={handleLogoutClick}>
                    <IoLogOutOutline /> Đăng xuất
                  </div>
              </div>
            )}
          </div>
        ) : (
          <button className={styles.loginBtn} onClick={() => navigate("/login")}>
            Log in
          </button>
        )}
      </div>

      {/* --- ✅ MODAL XÁC NHẬN ĐĂNG XUẤT --- */}
      {showLogoutConfirm && (
        <div className={styles.logoutModalOverlay}>
            <div className={styles.logoutModalContent}>
                <h3 className={styles.logoutModalTitle}>
                    Bạn có chắc chắn muốn đăng xuất?
                </h3>
                <div className={styles.logoutModalActions}>
                    <button
                        className={`${styles.modalBtn} ${styles.btnCancel}`}
                        onClick={handleCancelLogout}
                    >
                        Hủy
                    </button>
                    <button
                        className={`${styles.modalBtn} ${styles.btnLogout}`}
                        onClick={handleConfirmLogout}
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default VideoDetailHeader;