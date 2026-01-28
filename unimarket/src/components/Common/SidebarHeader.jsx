import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IoPhonePortraitOutline,
    IoDownloadOutline,
    IoPersonOutline,
    IoLogOutOutline,
    IoSettingsOutline
} from 'react-icons/io5';

// Import Context
import { AuthContext } from "../../context/AuthContext";
import styles from './SidebarHeader.module.css';

// ✅ IMPORT ẢNH MẶC ĐỊNH
import defaultAvatar from '../../assets/default-avatar.png';

const SidebarHeader = () => {
    const { token, user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // State quản lý hiển thị menu
    const [showUserMenu, setShowUserMenu] = useState(false);

    // State quản lý hiển thị Modal xác nhận đăng xuất
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const timeoutRef = useRef(null);

    // --- 1. LOGIC ĐIỀU HƯỚNG ---

    const handleViewProfile = () => {
        if (user?.id) {
            navigate(`/nguoi-dung/${user.id}`);
        } else {
            console.error("Không tìm thấy ID người dùng");
        }
        setShowUserMenu(false);
    };

    const handleSettingsClick = () => {
        navigate('/cai-dat-tai-khoan');
        setShowUserMenu(false);
    };

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    // --- 2. LOGIC ĐĂNG XUẤT ---

    // Mở modal hỏi
    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
        setShowUserMenu(false);
    };

    // Xác nhận đăng xuất
    const handleConfirmLogout = () => {
        // 1. Gọi hàm logout (xóa token)
        if (logout) logout();

        // 2. Tải lại trang ngay lập tức
        window.location.reload();
    };

    const handleCancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    // --- 3. LOGIC HOVER MENU ---
    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowUserMenu(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowUserMenu(false);
        }, 300);
    };

    // ✅ HÀM LẤY ẢNH ĐẠI DIỆN AN TOÀN
    const getUserAvatar = () => {
        // Ưu tiên profilePicture, sau đó đến avatarUrl
        const src = user.profilePicture || user.avatarUrl;
        
        // Nếu không có ảnh nào -> trả về mặc định
        if (!src) return defaultAvatar;

        // Nếu có ảnh, kiểm tra xem là link online hay link nội bộ server
        // (Nếu link nội bộ server thường thiếu http://localhost...)
        return src.startsWith("http") ? src : `http://localhost:5133${src}`;
    };

    return (
        <>
            <div className={styles.userHeaderWrapper}>
                <div className={styles.userHeaderContainer}>

                    {/* Các icon tiện ích bên trái */}
                    <div className={styles.headerIcons}>
                        <div className={styles.customULogoWrapper} title="UniMarket">
                            <span className={styles.uLogo}>U</span>
                        </div>
                        <div className={styles.iconBtn} title="Ứng dụng Mobile">
                            <IoPhonePortraitOutline />
                        </div>
                        <div className={styles.iconBtn} title="Tải xuống">
                            <IoDownloadOutline />
                        </div>
                    </div>

                    <div className={styles.headerSeparator}></div>

                    {/* --- PHẦN HIỂN THỊ USER HOẶC NÚT LOGIN --- */}
                    {token && user ? (
                        // TRƯỜNG HỢP: ĐANG ĐĂNG NHẬP
                        <div
                            className={styles.userInfoArea}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            {/* ✅ CẬP NHẬT THẺ IMG */}
                            <img
                                src={getUserAvatar()}
                                alt="Avatar"
                                className={styles.currentUserAvatar}
                                onError={(e) => {
                                    // Nếu ảnh bị lỗi (404), tự động chuyển về ảnh mặc định
                                    e.target.onerror = null;
                                    e.target.src = defaultAvatar;
                                }}
                            />

                            {/* Menu thả xuống */}
                            {showUserMenu && (
                                <div className={styles.userDropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <span className={styles.dropdownUserName}>
                                            {user.fullName || user.hoTen || "Người dùng"}
                                        </span>
                                    </div>

                                    {/* Trang cá nhân */}
                                    <div className={styles.dropdownItem} onClick={handleViewProfile}>
                                        <IoPersonOutline />
                                        <span>Trang cá nhân</span>
                                    </div>

                                    {/* Cài đặt */}
                                    <div className={styles.dropdownItem} onClick={handleSettingsClick}>
                                        <IoSettingsOutline />
                                        <span>Cài đặt tài khoản</span>
                                    </div>

                                    {/* Đăng xuất */}
                                    <div className={styles.dropdownItem} onClick={handleLogoutClick}>
                                        <IoLogOutOutline />
                                        <span>Đăng xuất</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // TRƯỜNG HỢP: CHƯA ĐĂNG NHẬP
                        <div className={styles.authButtons}>
                            <button className={styles.loginBtnSmall} onClick={handleLoginRedirect}> 
                                Log in
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL XÁC NHẬN */}
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

export default SidebarHeader;