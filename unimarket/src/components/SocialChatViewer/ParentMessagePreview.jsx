import React from "react";
import { Video, Image, FileText } from "lucide-react";
import './ParentMessagePreview.css'
// 🔹 Rút gọn nội dung tin nhắn để preview
const truncate = (str, len = 50) => {
  if (!str) return "";
  const cleanStr = str.replace(/\[ShareId:.*?\]/g, "").trim();
  if (cleanStr.length === 0) return "[Nội dung được chia sẻ]";
  return cleanStr.length > len ? cleanStr.substring(0, len) + "..." : cleanStr;
};

const ParentMessagePreview = ({ message, onJump }) => {
  if (!message) return null;

  let previewContent = null;

  // =========================
  // 1️⃣ Trường hợp tin nhắn bị thu hồi
  // =========================
  if (message.isRecalled) {
    previewContent = <em>[Tin nhắn đã thu hồi]</em>;
  }

  // =========================
  // 2️⃣ Ưu tiên hiển thị SHARE (TikTok, Link, v.v.)
  // =========================
  else if (message.share && (message.share.previewImage || message.share.previewVideo)) {
    const thumbnail = message.share.previewImage || message.share.previewVideo;
    previewContent = (
      <div className="parent-share-preview video-preview">
        <img
          src={thumbnail}
          alt="thumbnail"
          className="parent-share-thumbnail"
          loading="lazy"
        />
        <span>{message.share.previewTitle || "Nội dung chia sẻ"}</span>
      </div>
    );
  }

  // =========================
  // 3️⃣ Nếu không có share → kiểm tra mediaUrl (ảnh hoặc video upload)
  // =========================
  else if (message.mediaUrl) {
    const isVideo = message.mediaUrl.toLowerCase().includes(".mp4");
    previewContent = (
      <div className="parent-share-preview">
        {isVideo ? <Video size={14} /> : <Image size={14} />}
        <span>{isVideo ? "Video" : "Ảnh"}</span>
      </div>
    );
  }

  // =========================
  // 4️⃣ Cuối cùng fallback: hiển thị text
  // =========================
  else {
    const textContent = truncate(message.noiDung);
    previewContent = textContent.includes("[Nội dung được chia sẻ]") ? (
      <em className="flex items-center gap-1 text-gray-600">
        <FileText size={14} /> {textContent}
      </em>
    ) : (
      <span>{textContent}</span>
    );
  }

  // =========================
  // 5️⃣ Trả về UI cuối cùng + xử lý click onJump
  // =========================
  return (
    <div
      className="parent-message-preview cursor-pointer hover:bg-gray-50 transition rounded-lg p-2"
      onClick={() => onJump && onJump(message.maTinNhan)}
    >
      <div className="parent-message-sender text-sm font-medium text-gray-700">
        Trả lời {message.senderFullName || "..."}
      </div>
      <div className="parent-message-content text-sm text-gray-800 flex items-center gap-1">
        {previewContent}
      </div>
    </div>
  );
};

export default ParentMessagePreview;
