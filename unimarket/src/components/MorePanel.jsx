// src/components/MorePanel.jsx
import React, { useState } from 'react';
import { IoClose, IoChevronBack, IoCheckmark } from 'react-icons/io5';
import { FaMoon } from "react-icons/fa";
import { useTheme } from '../context/ThemeContext';
import './MorePanel.css'; // Sẽ tạo ở bước 3

// Panel con để chọn Theme
const ThemeSwitcherPanel = ({ onBack }) => {
  const { theme, setTheme } = useTheme();

  // 'auto' hiện tại chưa có logic, nhưng vẫn hiển thị
  const themes = [
    { key: 'auto', name: 'Tự động' },
    { key: 'dark', name: 'Chế độ tối' },
    { key: 'light', name: 'Chế độ sáng' },
  ];

  return (
    <div className="um-mp-panel">
      <div className="um-mp-header">
        <button onClick={onBack} className="um-mp-back-btn">
          <IoChevronBack size={22} />
        </button>
        <h3 className="um-mp-title">Chế độ tối</h3>
      </div>
      <div className="um-mp-body">
        {themes.map((t) => (
          <div
            key={t.key}
            className={`um-mp-item ${theme === t.key ? 'active' : ''}`}
            onClick={() => setTheme(t.key)}
          >
            <span>{t.name}</span>
            {theme === t.key && <IoCheckmark size={20} className="um-mp-checkmark" />}
          </div>
        ))}
      </div>
    </div>
  );
};

// Panel chính "Thêm"
const MorePanel = ({ onClose }) => {
  const [activeSubPanel, setActiveSubPanel] = useState('main'); // 'main' or 'theme'

  // Nếu đang ở panel con, hiển thị nó
  if (activeSubPanel === 'theme') {
    return <ThemeSwitcherPanel onBack={() => setActiveSubPanel('main')} />;
  }

  // Mặc định, hiển thị menu chính
  return (
    <div className="um-mp-panel">
      <div className="um-mp-header">
        <h3 className="um-mp-title">Thêm</h3>
        <button onClick={onClose} className="um-mp-close-btn">
          <IoClose size={24} />
        </button>
      </div>
      <div className="um-mp-body">
        {/* Thêm các mục menu khác ở đây */}
        <div className="um-mp-item" onClick={() => setActiveSubPanel('theme')}>
          <FaMoon size={18} />
          <span>Chế độ tối</span>
        </div>
        <div className="um-mp-item">
          <span>Tiếng Việt</span>
        </div>
        <div className="um-mp-item">
          <span>Phản hồi và trợ giúp</span>
        </div>
        <div className="um-mp-item">
          <span>Đăng xuất</span>
        </div>
      </div>
    </div>
  );
};

export default MorePanel;