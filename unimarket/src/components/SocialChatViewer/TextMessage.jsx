// File: src/components/SocialChatViewer/TextMessage.jsx
import React, { forwardRef } from 'react';
import ParentMessagePreview from './ParentMessagePreview';
import MessageActions from './MessageActions';
import './TextMessage.css'
// ✅ Dùng forwardRef để cha có thể truy cập DOM của tin nhắn
const TextMessage = forwardRef(
  (
    {
      message,
      currentUserId,
      onStartReply,
      onOpenDeleteModal,
      onJumpToMessage, // ✅ Thêm prop mới
    },
    ref
  ) => {
    const isSender = message.maNguoiGui === currentUserId;

    // =========================
    // 1️⃣ Trường hợp tin nhắn bị thu hồi
    // =========================
    if (message.isRecalled) {
      return (
        <div
          ref={ref}
          className={`text-message-wrapper ${isSender ? 'sent' : 'received'}`}
        >
          {!isSender && (
            <img
              src={message.sender?.avatarUrl || '/default-avatar.png'}
              alt="avatar"
              className="message-avatar"
            />
          )}

          <div className="text-message-bubble recalled-bubble">
            <em>
              {isSender
                ? 'Bạn đã thu hồi một tin nhắn'
                : 'Tin nhắn đã được thu hồi'}
            </em>
          </div>

          {isSender && (
            <img
              src={message.sender?.avatarUrl || '/default-avatar.png'}
              alt="avatar"
              className="message-avatar"
            />
          )}

          <MessageActions
            message={message}
            isSender={isSender}
            onStartReply={onStartReply}
            onOpenDeleteModal={onOpenDeleteModal}
          />
        </div>
      );
    }

    // =========================
    // 2️⃣ Tin nhắn bình thường (text)
    // =========================
    const content = message.noiDung ? message.noiDung.trim() : '';

    // Ẩn tin nhắn placeholder video (ví dụ: “đã gửi 1 video”) nếu không có dữ liệu share
    if (
      (content === 'đã gửi 1 video' || content === 'đã chia sẻ 1 video') &&
      !message.share
    ) {
      return null;
    }

    // =========================
    // 3️⃣ Giao diện tin nhắn text
    // =========================
    return (
      <div
        ref={ref}
        className={`text-message-wrapper ${isSender ? 'sent' : 'received'}`}
      >
        {/* Avatar bên trái nếu là người nhận */}
        {!isSender && (
          <img
            src={message.sender?.avatarUrl || '/default-avatar.png'}
            alt="avatar"
            className="message-avatar"
          />
        )}

        {/* Bong bóng tin nhắn */}
        <div className="text-message-bubble">
          {message.parentMessage && (
            <ParentMessagePreview
              message={message.parentMessage}
              onJump={onJumpToMessage} // ✅ Truyền hàm “nhảy đến tin nhắn gốc”
            />
          )}
          {message.noiDung}
        </div>

        {/* Avatar bên phải nếu là người gửi */}
        {isSender && (
          <img
            src={message.sender?.avatarUrl || '/default-avatar.png'}
            alt="avatar"
            className="message-avatar"
          />
        )}

        {/* Menu hành động (reply, xóa, v.v.) */}
        <MessageActions
          message={message}
          isSender={isSender}
          onStartReply={onStartReply}
          onOpenDeleteModal={onOpenDeleteModal}
        />
      </div>
    );
  }
);

export default TextMessage;
