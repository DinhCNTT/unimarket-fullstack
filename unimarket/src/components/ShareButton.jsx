import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Copy, Facebook, Twitter, Send, X, Link } from 'lucide-react';
import './ShareButton.css';
import { useTheme } from '../context/ThemeContext';

const ShareButton = ({ profileUser }) => {
  const { effectiveTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const buttonRef = useRef(null);

  // Tạo URL hiện tại
  const currentUrl = window.location.href;
  const shareTitle = `Trang cá nhân của ${profileUser?.fullName || 'Người dùng'}`;

  // Effect xử lý mở/đóng dropdown (Giữ nguyên logic cũ)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const portalElement = document.getElementById('UserProfile-ShareButton-dropdownPortal');
      if (buttonRef.current && !buttonRef.current.contains(event.target) &&
          portalElement && !portalElement.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Share functions
  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    const dropdownContent = (
      <div>
        {/* Overlay */}
        <div className="UserProfile-ShareButton-overlay" onClick={() => setIsOpen(false)} />
        
        {/* Dropdown - Giao diện mới */}
        <div 
          id="UserProfile-ShareButton-dropdownPortal" 
          className="UserProfile-ShareButton-dropdown"
          data-theme={effectiveTheme}
        >
          {/* Header */}
          <div className="UserProfile-ShareButton-header">
            <h4 className="UserProfile-ShareButton-title">Chia sẻ đến</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="UserProfile-ShareButton-closeBtn"
            >
              <X size={20} />
            </button>
          </div>

          {/* Grid chứa các icon tròn */}
          <div className="UserProfile-ShareButton-grid">
            
            {/* Nút Copy Link */}
            <button onClick={copyToClipboard} className="UserProfile-ShareButton-item">
              <div className={`UserProfile-ShareButton-iconCircle copy ${copySuccess ? 'success' : ''}`}>
                {copySuccess ? <Copy size={24} /> : <Link size={24} />}
              </div>
              <span className="UserProfile-ShareButton-label">
                {copySuccess ? 'Đã copy' : 'Sao chép'}
              </span>
            </button>

            {/* Facebook */}
            <button onClick={shareToFacebook} className="UserProfile-ShareButton-item">
              <div className="UserProfile-ShareButton-iconCircle facebook">
                <Facebook size={24} fill="white" />
              </div>
              <span className="UserProfile-ShareButton-label">Facebook</span>
            </button>

            {/* Telegram */}
            <button onClick={shareToTelegram} className="UserProfile-ShareButton-item">
              <div className="UserProfile-ShareButton-iconCircle telegram">
                <Send size={24} />
              </div>
              <span className="UserProfile-ShareButton-label">Telegram</span>
            </button>

            {/* Twitter / X */}
            <button onClick={shareToTwitter} className="UserProfile-ShareButton-item">
              <div className="UserProfile-ShareButton-iconCircle twitter">
                <Twitter size={24} fill="white" />
              </div>
              <span className="UserProfile-ShareButton-label">Twitter</span>
            </button>

          </div>
        </div>
      </div>
    );

    return createPortal(dropdownContent, document.body);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="UserProfile-ShareButton-container">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="UserProfile-ShareButton-mainButton"
        aria-label="Chia sẻ trang"
      >
        <Share2 size={16} />
      </button>

      {renderDropdown()}
    </div>
  );
};

export default ShareButton;