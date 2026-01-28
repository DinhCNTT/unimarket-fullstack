import React from "react";
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaRegComment } from "react-icons/fa";
import styles from "./VideoActions.module.css";

export default function VideoActions({
  video,
  isLiked,
  soTym,
  isSaved,
  soNguoiLuu,
  totalCommentCount,
  iconCircleRef,
  handleLike,
  handleToggleSave,
}) {
  return (
    <div className={styles.actions}>
      {/* --- NÚT LIKE --- */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleLike();
        }}
        // Giữ nguyên logic class liked
        className={`${styles.likeBtn} ${isLiked ? styles.liked : ""}`}
      >
        <span className={styles.iconCircle} ref={iconCircleRef}>
          {isLiked ? (
            // Bỏ color cứng ở đây, để CSS xử lý cho đồng bộ
            <FaHeart size={24} /> 
          ) : (
            <FaRegHeart size={24} />
          )}
        </span>
        <span className={styles.count}>{soTym}</span>
      </button>

      {/* --- NÚT SAVE --- */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggleSave();
        }}
        // ✅ SỬA: Thêm logic class 'saved' giống như like
        className={`${styles.saveBtn} ${isSaved ? styles.saved : ""}`}
      >
        <span className={styles.iconCircle}>
          {isSaved ? (
             // Bỏ color cứng ở đây, để CSS xử lý
            <FaBookmark size={24} />
          ) : (
            <FaRegBookmark size={24} />
          )}
        </span>
        <span className={styles.count}>{soNguoiLuu || 0}</span>
      </button>

      {/* --- NÚT COMMENT --- */}
      <button
        onClick={(e) => e.stopPropagation()}
        className={styles.commentToggleBtn}
      >
        <span className={styles.iconCircle}>
          <FaRegComment size={24} />
        </span>
        <span className={styles.commentCount}>{totalCommentCount}</span>
      </button>
    </div>
  );
}