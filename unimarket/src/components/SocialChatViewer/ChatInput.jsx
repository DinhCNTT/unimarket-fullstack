// File: src/components/SocialChatViewer/ChatInput.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'; // ✨ [THÊM] useLayoutEffect
import { SendHorizonal } from 'lucide-react';
import { sendMessage } from '../../services/chatSocialService';
import ReplyPreview from './ReplyPreview';
import "./ChatInput.css";
// ✨ [MỚI] Giới hạn ký tự bạn yêu cầu
const MAX_CHARS = 500;

const ChatInput = ({ chatId, replyingTo, onClearReply }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null); // Bây giờ là ref cho <textarea>

  // (useEffect cho focus khi reply giữ nguyên)
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  // (useEffect cho quick-reply giữ nguyên)
  useEffect(() => {
    const onQuickReply = async (e) => {
      // ... (code của bạn giữ nguyên)
    };
    window.addEventListener('quick-reply', onQuickReply);
    return () => window.removeEventListener('quick-reply', onQuickReply);
  }, [chatId]);

  // ✨ [MỚI] Logic tự động dãn/co chiều cao <textarea>
  useLayoutEffect(() => {
    if (inputRef.current) {
      const { current } = inputRef;
      // 1. Reset chiều cao về 'auto' để nó co lại khi xóa chữ
      current.style.height = 'auto'; 

      // 2. Lấy chiều cao tối đa từ CSS (ví dụ 150px)
      const maxHeight = parseInt(getComputedStyle(current).maxHeight, 10) || 150;
      const scrollHeight = current.scrollHeight;

      // 3. Nếu chiều cao nội dung vượt quá max, bật thanh cuộn
      if (scrollHeight > maxHeight) {
        current.style.height = `${maxHeight}px`;
        current.style.overflowY = 'auto';
      } else {
        // 4. Nếu chưa, dãn chiều cao theo nội dung
        current.style.height = `${scrollHeight}px`;
        current.style.overflowY = 'hidden';
      }
    }
  }, [text]); // Chạy mỗi khi 'text' thay đổi

  const handleSend = async (e) => {
    e.preventDefault();
    if (text.trim() === '' || !chatId) return;

    try {
      const parentId = replyingTo ? replyingTo.maTinNhan : null;
      await sendMessage(chatId, text.trim(), null, parentId);
      setText(''); // Reset text
      onClearReply && onClearReply();
      // (useLayoutEffect sẽ tự động co <textarea> lại)
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  // ✨ [MỚI] Xử lý khi nhập text, kiểm tra giới hạn
  const handleChange = (e) => {
    const newText = e.target.value;
    // Không cho phép nhập quá giới hạn MAX_CHARS
    if (newText.length <= MAX_CHARS) {
      setText(newText);
    }
  };

  // ✨ [MỚI] Xử lý phím: Enter để gửi, Shift + Enter để xuống dòng
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Ngăn xuống dòng
      handleSend(e);      // Gửi tin nhắn
    }
    // Nếu là Shift + Enter, <textarea> sẽ tự động xuống dòng
  };

  return (
    <div className="chat-input-wrapper">
      {replyingTo && (
        <ReplyPreview message={replyingTo} onClearReply={onClearReply} />
      )}

      {/* ✨ [SỬA] Đổi tên class để CSS dễ hơn một chút */}
      <form className="chat-input-form-container" onSubmit={handleSend}>
        
        {/* ✨ [MỚI] Wrapper cho textarea và bộ đếm */}
        <div className="chat-input-field-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input-field" // Dùng chung class cũ, nhưng CSS sẽ sửa lại
            placeholder="Nhắn tin..."
            value={text}
            onChange={handleChange}     // ✨ Dùng handler mới
            onKeyDown={handleKeyDown}  // ✨ Dùng handler mới
            maxLength={MAX_CHARS}      // ✨ Giới hạn ký tự
            rows={1}                   // ✨ Bắt đầu với 1 dòng
          />
          
          {/* ✨ [MỚI] Bộ đếm ký tự (chỉ hiện khi bắt đầu nhập) */}
          {text.length > 0 && (
            <span className="chat-input-counter">
              {text.length}/{MAX_CHARS}
            </span>
          )}
        </div>

        <button
          type="submit"
          className={`chat-send-btn ${text.trim() ? 'active' : ''}`}
          disabled={!text.trim()}
          aria-label="Gửi tin nhắn"
        >
          <SendHorizonal size={22} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;