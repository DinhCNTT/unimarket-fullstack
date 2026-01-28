import React from 'react';
import './DeleteMessageModal.css';
const DeleteMessageModal = ({ message, currentUserId, onConfirm, onClose, type = 'message' }) => {
  
  if (type === 'message' && !message) return null;

  let title = "";
  let bodyText = "";
  let confirmButtonText = "";


  if (type === 'conversation') {
    title = "Xóa cuộc trò chuyện?";
    bodyText = "Bạn có chắc chắn muốn xóa cuộc trò chuyện này không? Bạn sẽ không còn nhìn thấy nó trong danh sách tin nhắn.";
    confirmButtonText = "Xóa";
  } 

  else {
    const isMyMessage = message?.maNguoiGui === currentUserId;
    title = isMyMessage ? "Thu hồi tin nhắn?" : "Gỡ tin nhắn ở phía bạn?";
    bodyText = isMyMessage
      ? "Tin nhắn này sẽ bị thu hồi với mọi người trong đoạn chat."
      : "Tin nhắn này sẽ bị gỡ khỏi thiết bị của bạn, nhưng vẫn hiển thị với người khác.";
    confirmButtonText = isMyMessage ? "Thu hồi" : "Gỡ";
  }

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-message-box" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{bodyText}</p>
        <div className="delete-modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            Hủy
          </button>
          <button className="modal-btn confirm-delete" onClick={onConfirm}>
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;