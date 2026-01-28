import React, { forwardRef } from 'react';
import { PlayCircle } from 'lucide-react';
import ParentMessagePreview from './ParentMessagePreview';
import MessageActions from './MessageActions';
import './VideoMessage.css'
// ✅ Dùng forwardRef để cha (SocialChatViewer) có thể "scroll tới" tin nhắn này
const VideoMessage = forwardRef(
  (
    {
      message,
      currentUserId,
      onStartReply,
      onOpenDeleteModal,
      onJumpToMessage,
      onPreviewVideo, // ✅ Tên prop này phải khớp với bên SocialChatViewer
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
          className={`video-message-wrapper ${isSender ? 'sent' : 'received'}`}
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
    // 2️⃣ Trường hợp tin nhắn video bình thường
    // =========================
    const shareInfo = message.share;
    // Kiểm tra dữ liệu hợp lệ
    if (!shareInfo || !shareInfo.previewImage) {
      return null;
    }

    // Tách text phụ đi kèm (nếu có regex khớp)
    const parts = message.noiDung.match(/\[ShareId:\d+.*?\]\s*(.*)/);
    const extraText = parts ? parts[1].trim() : '';

    const tinDangId = shareInfo.tinDangId || shareInfo.shareId;
    const videoUrl = shareInfo.previewVideo;

    // ✅ Tạo object dữ liệu video rút gọn để gửi lên cha (cho Overlay)
    const shallowVideoData = {
      maTinDang: tinDangId,
      tieuDe: shareInfo.previewTitle,
      thumbnail: shareInfo.previewImage,
      videoUrl: videoUrl,
    };

    // =========================
    // 3️⃣ Giao diện chính
    // =========================
    return (
      <div
        ref={ref}
        className={`video-message-wrapper ${isSender ? 'sent' : 'received'}`}
      >
        {!isSender && (
          <img
            src={message.sender?.avatarUrl || '/default-avatar.png'}
            alt="avatar"
            className="message-avatar"
          />
        )}

        <div className="video-content-container">
          {/* Preview tin nhắn cha (nếu có - trường hợp reply) */}
          {message.parentMessage && (
            <div className="text-message-bubble parent-in-video">
              <ParentMessagePreview
                message={message.parentMessage}
                onJump={onJumpToMessage}
              />
            </div>
          )}

          {/* ✅ THẺ VIDEO CARD
             - Dùng thẻ div thay vì Link
             - Có sự kiện onClick gọi onPreviewVideo
          */}
          <div
            className="video-message-card"
            style={{ 
              backgroundImage: `url(${shareInfo.previewImage})`,
              cursor: 'pointer' // Hiển thị con trỏ tay để biết click được
            }}
            onClick={(e) => {
              e.stopPropagation(); // Ngăn sự kiện nổi bọt
              
              // Gọi hàm từ cha để mở Overlay Video
              if (onPreviewVideo) {
                console.log("Opening video overlay:", shallowVideoData); // Debug log
                onPreviewVideo(shallowVideoData);
              } else {
                console.error("onPreviewVideo prop is missing!");
              }
            }}
          >
            <div className="video-play-icon">
              <PlayCircle size={52} strokeWidth={1.6} color="#ffffffcc" />
            </div>
            <div className="video-message-content">
              <div className="video-message-title">
                {shareInfo.previewTitle}
              </div>
            </div>
          </div>

          {/* Text phụ (lời nhắn kèm theo video) */}
          {extraText && (
            <div className="text-message-bubble extra-text-bubble">
              {extraText}
            </div>
          )}
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
);

export default VideoMessage;