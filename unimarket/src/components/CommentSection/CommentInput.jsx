import React, { useState, useRef } from "react";
import styles from "./CommentInput.module.css";

export default function CommentInput({ onSubmit }) {
  const [newComment, setNewComment] = useState("");
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onSubmit(newComment, null).then((success) => {
      if (success) {
        setNewComment("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    });
  };

  const handleInput = (e) => {
    const text = e.target.value;
    if (text.length <= 150) {
      setNewComment(text);
    }
    // Auto resize height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className={styles.inputFixed}>
      <div className={styles.inputWrapper}>
        <div className={styles.textareaGroup}>
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleInput}
            placeholder="Thêm bình luận..."
            className={styles.commentInput}
            rows={1}
            onKeyDown={(e) => {
               if(e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleSubmit(e);
               }
            }}
          />
        </div>
        <button 
          onClick={handleSubmit} 
          className={styles.submitBtn}
          disabled={!newComment.trim()}
          style={{ opacity: newComment.trim() ? 1 : 0.5 }}
        >
          Đăng
        </button>
      </div>
      {newComment.length > 50 && (
          <div className={styles.charCounter}>{newComment.length}/150</div>
      )}
    </div>
  );
}