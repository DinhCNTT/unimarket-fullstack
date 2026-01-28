import React, { useState, useMemo, useEffect, useRef } from "react";
import styles from "./CommentItem.module.css";

// 🆕 Thêm icon
import { FaFlag, FaTrashAlt } from "react-icons/fa";

export default function CommentThread({
  comment,
  currentUserId,
  onReplySubmit,
  onDelete,
  level = 0,
  parentUserName = null,
}) {
  const [areRepliesExpanded, setAreRepliesExpanded] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const textareaRef = useRef(null);
  const MAX_LENGTH = 150;

  // ===== MENU =====
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // ================= Count replies ===================
  const countTotalReplies = (replies) => {
    if (!replies || replies.length === 0) return 0;
    return replies.reduce((total, item) => {
      return total + 1 + countTotalReplies(item.replies);
    }, 0);
  };

  const totalReplyCount = useMemo(
    () => countTotalReplies(comment.replies),
    [comment.replies]
  );

  const isLongContent = comment.content && comment.content.length > 150;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isOwnComment =
    currentUserId && String(comment.userId) === String(currentUserId);

  // ===== CLICK OUTSIDE =====
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== Auto resize khi mở reply =====
  useEffect(() => {
    if (isReplying && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, [isReplying]);

  const handleInputChange = (e) => {
    const val = e.target.value;

    if (val.length <= MAX_LENGTH) {
      setReplyContent(val);

      e.target.style.height = "auto";
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;

    onReplySubmit(replyContent, comment.id).then((success) => {
      if (success) {
        setReplyContent("");
        setIsReplying(false);
        if (level === 0) setAreRepliesExpanded(true);
      }
    });
  };

  const handleReport = () => setShowMenu(false);

  const handleDelete = () => {
    onDelete(comment.id);
    setShowMenu(false);
  };

  return (
    <div className={styles.item}>
      <div className={styles.mainContainer}>
        <img src={comment.avatarUrl} className={styles.avatar} alt="user" />

        <div className={styles.contentWrapper}>
          <span className={styles.username}>
            {comment.userName}
            {level > 0 && parentUserName && (
              <span className={styles.replyTo}>
                trả lời <b>{parentUserName}</b>
              </span>
            )}
          </span>

          {/* --- CONTENT --- */}
          <div
            className={`${styles.content} ${
              !isTextExpanded && isLongContent ? styles.contentCollapsed : ""
            }`}
          >
            {comment.content}
          </div>

          {isLongContent && (
            <button
              className={styles.readMoreBtn}
              onClick={() => setIsTextExpanded(!isTextExpanded)}
            >
              {isTextExpanded ? "Thu gọn" : "Xem thêm"}
            </button>
          )}

          {/* --- Meta --- */}
          <div className={styles.meta}>
            <span>
              {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
            </span>
            <button
              className={styles.replyActionBtn}
              onClick={() => setIsReplying(!isReplying)}
            >
              Trả lời
            </button>
          </div>

          {/* --- Reply Box --- */}
          {isReplying && (
            <div className={styles.replyInputContainer}>
              <div className={styles.replyInputWrapper}>
                <textarea
                  ref={textareaRef}
                  value={replyContent}
                  onChange={handleInputChange}
                  placeholder={`Trả lời ${comment.userName}...`}
                  className={styles.replyInput}
                  rows={1}
                />

                <div className={styles.inputFooter}>
                  <span
                    className={`${styles.charCounter} ${
                      replyContent.length === MAX_LENGTH
                        ? styles.limitReached
                        : ""
                    }`}
                  >
                    {replyContent.length}/{MAX_LENGTH}
                  </span>

                  <div className={styles.replyActions}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setIsReplying(false)}
                    >
                      Hủy
                    </button>
                    <button
                      className={styles.sendReplyBtn}
                      onClick={handleReplySubmit}
                      disabled={!replyContent.trim()}
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== THREE DOT MENU ===== */}
        <div ref={menuRef}>
          <button
            className={`${styles.moreBtn} ${
              showMenu ? styles.active : ""
            }`}
            onClick={() => setShowMenu(!showMenu)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="5" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="19" cy="12" r="2" fill="currentColor" />
            </svg>
          </button>

          {showMenu && (
            <div className={styles.menuWrapper}>
              {isOwnComment ? (
                <button
                  className={`${styles.menuItem} ${styles.deleteOption}`}
                  onClick={handleDelete}
                >
                  <FaTrashAlt size={14} />
                  Xóa bình luận
                </button>
              ) : (
                <button
                  className={`${styles.menuItem} ${styles.reportOption}`}
                  onClick={handleReport}
                >
                  <FaFlag size={14} />
                  Báo cáo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== REPLIES ===== */}
      {hasReplies && (
        <div
          className={styles.repliesContainer}
          style={{ paddingLeft: level === 0 ? "48px" : "0px" }}
        >
          {!areRepliesExpanded && level === 0 && (
            <button
              className={styles.viewRepliesBtn}
              onClick={() => setAreRepliesExpanded(true)}
              style={{ marginTop: "2px" }}
            >
              Xem {totalReplyCount} câu trả lời
            </button>
          )}

          {(areRepliesExpanded || level > 0) && (
            <>
              {level === 0 && (
                <button
                  className={styles.viewRepliesBtn}
                  onClick={() => setAreRepliesExpanded(false)}
                  style={{ marginTop: "6px", marginBottom: "5px" }}
                >
                  Thu gọn
                </button>
              )}

              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReplySubmit={onReplySubmit}
                  onDelete={onDelete}
                  level={level + 1}
                  parentUserName={comment.userName}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
