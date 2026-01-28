// src/components/PostCommentModal.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom'; // 👈 1. Import ReactDOM
import styles from './PostCommentModal.module.css'; 

// Icon đóng (X)
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const PostCommentModal = ({ isOpen, onClose, totalComments, commentListContent, inputAreaContent }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // 👈 2. Sử dụng ReactDOM.createPortal để đẩy Modal ra ngoài cùng (vào document.body)
  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Bình luận ({totalComments})</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {commentListContent}
        </div>

        <div className={styles.modalFooter}>
          {inputAreaContent}
        </div>
      </div>
    </div>,
    document.body // 👈 Tham số thứ 2: Nơi render Modal (Thẻ body của HTML)
  );
};

export default PostCommentModal;