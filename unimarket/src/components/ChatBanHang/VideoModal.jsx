// VideoModal.jsx
import React, { useEffect, useRef } from 'react';
import styles from './ModuleChatCss/VideoModal.module.css';
import { FaTimes } from 'react-icons/fa';

const VideoModal = ({ url, onClose }) => {
  const modalRef = useRef(null);

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className={styles.modalBackdrop} 
      ref={modalRef} 
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContent}>
        
        {/* Đây là vị trí mới của nút "X" */}
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        
        <video
          src={url}
          controls
          autoPlay
          controlsList="nofullscreen" // 👈 THÊM DÒNG NÀY ĐỂ ẨN NÚT FULLSCREEN
          className={styles.videoPlayer}
          style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
    </div>
  );
};

export default VideoModal;