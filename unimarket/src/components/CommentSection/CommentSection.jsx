import React from "react";
import CommentThread from "./CommentThread";
import CommentInput from "./CommentInput";
import styles from "./CommentSection.module.css";

export default function CommentSection({
  comments,
  totalCommentCount,
  currentUserId,
  submitComment,
  deleteComment,
  scrollRef, // Ref để scroll nếu cần (ví dụ scroll to bottom)
  children, // Chứa VideoInfo và VideoActions
}) {
  return (
    <div className={styles.section}>
      {/* Vùng cuộn: Chứa Info + Danh sách Comment */}
      <div className={styles.scrollable} ref={scrollRef}>
        
        {/* Render Info & Actions ở trên cùng */}
        <div>{children}</div>

        {/* Tiêu đề danh sách */}
        <div className={styles.titleHeader}>
          Bình luận ({totalCommentCount})
        </div>

        {/* Danh sách Comment */}
        <div className={styles.commentList}>
          {comments && comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReplySubmit={submitComment}
              onDelete={deleteComment}
              level={0}
            />
          ))}

          {(!comments || comments.length === 0) && (
            <div className={styles.emptyState}>
              Hãy là người đầu tiên bình luận!
            </div>
          )}
        </div>
      </div>

      {/* Input nằm ngoài vùng cuộn, sẽ dính ở đáy Sidebar */}
      <CommentInput onSubmit={submitComment} />
    </div>
  );
}