import React from "react";
import { useChat } from "./context/ChatContext";
import { FaTimes } from "react-icons/fa";
import styles from './ModuleChatCss/ImageModal.module.css';

const ImageModal = () => {
  // Lấy state và hàm từ ChatBox (thông qua Context)
  const { modalImage, closeImageModal } = useChat();

  if (!modalImage) return null;

  return (
    <div className={styles.mediaModalOverlay} onClick={closeImageModal}>
      <div
        className={styles.mediaModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.mediaModalClose} onClick={closeImageModal}>
          <FaTimes size={20} />
        </button>
        <img
          src={modalImage}
          alt="Phóng to ảnh"
          className={styles.mediaModalImage}
        />
      </div>
    </div>
  );
};

export default ImageModal;