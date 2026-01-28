// File: src/components/SocialChatViewer/ReplyPreview.jsx
import React from 'react';
import { X } from 'lucide-react';
import './ReplyPreview.css'
// Rút gọn nội dung (giống ParentMessagePreview)
const truncate = (str, len = 50) => {
    if (!str) return "";
    return str.length > len ? str.substring(0, len) + "..." : str;
};

const ReplyPreview = ({ message, onClearReply }) => {
    if (!message) return null;

    let previewContent = message.mediaUrl 
        ? (message.mediaUrl.includes('.mp4') ? "[Video]" : "[Ảnh]") 
        : truncate(message.noiDung);

    if (message.isRecalled) previewContent = "[Tin nhắn đã thu hồi]";
    
    return (
        <div className="reply-preview-container">
            <div className="reply-preview-border"></div>
            <div className="reply-preview-content">
                <span className="reply-preview-title">
                    Đang trả lời {message.sender?.fullName || '...'}
                </span>
                <span className="reply-preview-text">{previewContent}</span>
            </div>
            <button className="reply-preview-close" onClick={onClearReply}>
                <X size={18} />
            </button>
        </div>
    );
};

export default ReplyPreview;
