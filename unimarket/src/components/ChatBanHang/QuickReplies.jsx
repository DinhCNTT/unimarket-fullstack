import React, { useCallback, useEffect } from "react";
import Swal from "sweetalert2";
import styles from "./ModuleChatCss/QuickReplies.module.css"; 

const QUICK_REPLIES_LIST = [
  "Bạn có ship hàng không?",
  "Sản phẩm còn bảo hành không?",
  "Sản phẩm này đã qua sửa chữa chưa?",
  "Có phụ kiện đi kèm theo sản phẩm?",
  "Sản phẩm có lỗi gì không?",
  "Đây là hàng chính hãng hay xách tay?",
  "Sản phẩm này còn không ạ?",
  "Tôi muốn mua sản phẩm này.",
];

const QuickReplies = ({
  isDisabled,
  isConnected,
  sendMessageService,
  onQuickReplySent,
  customQuickMessages = [],
  onOpenSettings,
}) => {

  const handleQuickReply = useCallback(async (text) => {
      // ... giữ nguyên logic gửi tin
      if (!text) return;
      if (isDisabled) return;
      try {
        await sendMessageService(text, "text");
        if (onQuickReplySent) onQuickReplySent(text);
      } catch (err) {
        console.error("Quick reply error:", err);
      }
    }, [isDisabled, sendMessageService, onQuickReplySent]
  );

  return (
    <div className={styles.quickReplies} aria-hidden={isDisabled}>
      {/* 1. Render Custom Messages */}
      {customQuickMessages && customQuickMessages.map((msg, index) => {
         // Debug render từng dòng
         const safeKey = msg.id ? `msg-${msg.id}` : `custom-idx-${index}`;
         return (
          <button
            key={safeKey} 
            type="button"
            className={styles.quickReplyBtn}
            onClick={() => handleQuickReply(msg.content)}
            disabled={isDisabled}
          >
            {msg.content}
          </button>
         )
      })}

      {/* 2. Render Default Messages */}
      {QUICK_REPLIES_LIST.map((q, idx) => (
        <button
          key={`qr-${idx}`}
          type="button"
          className={styles.quickReplyBtn}
          onClick={() => handleQuickReply(q)}
          disabled={isDisabled}
        >
          {q}
        </button>
      ))}
    </div>
  );
};

// Tạm thời bỏ React.memo để test
export default QuickReplies;