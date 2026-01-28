import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiIdCard } from "react-icons/bi";
import { FaSignOutAlt } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { FiUser } from "react-icons/fi"; // ✅ Icon đăng nhập mới
import { AuthContext } from "../context/AuthContext";
import defaultAvatar from '../assets/default-avatar.png';
import './UserAuthButton.css';
import { useTheme } from '../context/ThemeContext';
import { MdHistory } from "react-icons/md"; // ✅ Icon lịch sử
const UserAuthButton = () => {
  const { user, logout } = useContext(AuthContext);
  const { effectiveTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  // --- HANDLERS ---
  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleAvatarClick = () => {
    setShowDropdown(prev => !prev);
  };

  const handleProfileClick = () => {
    if (user?.id) {
      navigate(`/nguoi-dung/${user.id}`);
    } else {
      console.error('User ID not found:', user);
    }
    setShowDropdown(false);
  };

  const handleSettingsClick = () => {
    navigate('/cai-dat-tai-khoan');
    setShowDropdown(false);
  };
  const handleViewHistoryClick = () => {
    navigate('/view-history');
    setShowDropdown(false);
  };

  const handleLogoutClick = () => {
    logout();
    window.location.reload();
  };

  // --- RENDER LOGIN BUTTON ---
  if (!user) {
    return (
      <div className="userauthbutton-container">
        <button className="userauthbutton-login-btn" onClick={handleLoginClick}>
          <FiUser className="userauthbutton-login-icon" />
          Đăng nhập
        </button>
      </div>
    );
  }

  // --- RENDER USER DROPDOWN ---
  return (
    <div className="userauthbutton-container">
      <div className="userauthbutton-avatar-wrapper" onClick={handleAvatarClick}>
        <img
          src={user.avatarUrl || defaultAvatar}
          alt="Avatar"
          className="userauthbutton-user-avatar"
        />
        <div className="userauthbutton-avatar-ring"></div>
        {user.daXacMinhEmail && (
          <div className="userauthbutton-verification-badge">✓</div>
        )}
      </div>

      {showDropdown && (
        <div className="userauthbutton-dropdown" data-theme={effectiveTheme}>
          <div className="userauthbutton-dropdown-header">
            <img
              src={user.avatarUrl || defaultAvatar}
              alt="Avatar"
              className="userauthbutton-dropdown-avatar"
            />
            <div className="userauthbutton-dropdown-info">
              <div className="userauthbutton-dropdown-name">{user.fullName || user.hoTen}</div>
              <div className="userauthbutton-dropdown-email">{user.email}</div>
            </div>
          </div>

          <div className="userauthbutton-dropdown-divider"></div>

          <button className="userauthbutton-dropdown-item" onClick={handleProfileClick}>
            <BiIdCard className="userauthbutton-dropdown-icon" />
            Trang cá nhân
          </button>

          <button className="userauthbutton-dropdown-item" onClick={handleSettingsClick}>
            <IoSettingsOutline className="userauthbutton-dropdown-icon" />
            Cài đặt tài khoản
          </button>
          <button className="userauthbutton-dropdown-item" onClick={handleViewHistoryClick}>
            <MdHistory className="userauthbutton-dropdown-icon" />
            Lịch sử xem
          </button>
          <div className="userauthbutton-dropdown-divider"></div>

          <button
            className="userauthbutton-dropdown-item userauthbutton-logout"
            onClick={handleLogoutClick}
          >
            <FaSignOutAlt className="userauthbutton-dropdown-icon" />
            Đăng xuất
          </button>
        </div>
      )}

      {showDropdown && (
        <div
          className="userauthbutton-dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default UserAuthButton;