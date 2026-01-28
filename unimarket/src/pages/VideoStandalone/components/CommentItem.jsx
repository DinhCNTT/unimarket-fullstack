import React, { useState, useRef, useEffect } from 'react';
import styles from './CommentList.module.css';

// 🔥 IMPORT ICON MỚI: Bỏ tim, thêm 3 chấm, thùng rác, cờ báo cáo
import { 
    IoCloseOutline, 
    IoEllipsisHorizontal, 
    IoTrashOutline, 
    IoFlagOutline 
} from 'react-icons/io5';

const CommentItem = ({
    comment,
    onPostReply,
    depth = 0,
    highlightCommentId, // Logic tìm comment từ Code 1
    
    // 🔥 PROPS MỚI TỪ CODE 2
    currentUser,       
    onDeleteComment    
}) => {
    /* ======================================================
       STATE & REFS
    ====================================================== */
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // State hiển thị replies (cho comment CHA)
    const [showReplies, setShowReplies] = useState(false);

    // 🔥 State cho menu 3 chấm
    const [showMenu, setShowMenu] = useState(false);
    
    const textareaRef = useRef(null);
    const itemRef = useRef(null); // Ref để scroll
    const menuRef = useRef(null); // Ref để đóng menu khi click ra ngoài

    const hasReplies = comment.replies && comment.replies.length > 0;

    // 🔥 CHECK QUYỀN SỞ HỮU (Code 2)
    // So sánh ID của người đang login với UserID của comment
    const isMyComment = currentUser && (currentUser.id === comment.userId);

    /* ======================================================
       EFFECT: CLICK OUTSIDE MENU (Code 2)
    ====================================================== */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* ======================================================
       AUTO RESIZE TEXTAREA (Code 1)
    ====================================================== */
    const autoResize = () => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height =
            `${textareaRef.current.scrollHeight}px`;
    };

    useEffect(() => {
        if (isReplying && textareaRef.current) {
            textareaRef.current.focus();
            autoResize();
        }
    }, [isReplying]);

    /* ======================================================
       HIGHLIGHT + AUTO SCROLL LOGIC (Code 1)
    ====================================================== */
    useEffect(() => {
        if (!highlightCommentId) return;

        const targetId = parseInt(highlightCommentId, 10);
        if (!targetId) return;

        // 1️⃣ Nếu CHÍNH LÀ comment này → scroll + highlight
        if (comment.id === targetId) {
            if (itemRef.current) {
                itemRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                itemRef.current.classList.add(styles.highlightFlash);

                setTimeout(() => {
                    if (itemRef.current) {
                        itemRef.current.classList.remove(styles.highlightFlash);
                    }
                }, 3000);
            }
        }

        // 2️⃣ Nếu là COMMENT CHA và con cháu chứa target → auto mở replies
        if (depth === 0 && hasReplies) {
            const containsTarget = (list) => {
                return list.some(item =>
                    item.id === targetId ||
                    (item.replies && containsTarget(item.replies))
                );
            };

            if (containsTarget(comment.replies)) {
                setShowReplies(true);
            }
        }
    }, [highlightCommentId, comment, depth, hasReplies]);

    /* ======================================================
       HANDLERS
    ====================================================== */
    const handleSendReply = async () => {
        if (!replyText.trim()) return;

        setIsSending(true);
        await onPostReply(replyText, comment.id);
        setIsSending(false);

        setReplyText('');
        setIsReplying(false);

        // Nếu reply vào comment CHA → mở replies để thấy comment vừa đăng
        if (depth === 0) {
            setShowReplies(true);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendReply();
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        if (val.length <= 150) {
            setReplyText(val);
            autoResize();
        }
    };

    // 🔥 HANDLERS CHO MENU (Code 2)
    const handleMenuClick = () => {
        setShowMenu(!showMenu);
    };

    const handleReport = () => {
        alert("Đã gửi báo cáo vi phạm.");
        setShowMenu(false);
    };

    const handleDelete = () => {
        // Gọi hàm từ props truyền xuống
        onDeleteComment(comment.id);
        setShowMenu(false);
    };

    const countTotalReplies = (replies) => {
        if (!replies) return 0;
        let count = replies.length;
        replies.forEach(r => {
            count += countTotalReplies(r.replies);
        });
        return count;
    };

    /* ======================================================
       RENDER
    ====================================================== */
    return (
        <div
            className={styles.commentItemWrapper}
            ref={itemRef} // Gắn ref cho scroll logic
        >
            <div className={styles.commentItem}>
                <img
                    src={comment.avatarUrl || "/assets/images/default-avatar.png"}
                    className={styles.avatar}
                    alt="user"
                    onError={(e) => {
                        e.target.src = "https://via.placeholder.com/32";
                    }}
                />

                <div className={styles.content}>
                    <span className={styles.userName}>
                        {comment.userName || "Ẩn danh"}
                    </span>

                    <p className={styles.text}>{comment.content}</p>

                    <div className={styles.metaData}>
                        <span className={styles.time}>
                            {comment.timeAgo}
                        </span>

                        <button
                            className={styles.replyBtn}
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            Trả lời
                        </button>
                    </div>
                </div>

                {/* 🔥 THAY THẾ LOGIC TIM BẰNG MENU 3 CHẤM (Code 2) */}
                <div className={styles.menuContainer} ref={menuRef}>
                    <div 
                        className={styles.menuIconWrapper} 
                        onClick={handleMenuClick}
                    >
                        <IoEllipsisHorizontal size={18} color="#555" />
                    </div>

                    {showMenu && (
                        <div className={styles.popupMenu}>
                            {isMyComment ? (
                                <div className={styles.menuOption} onClick={handleDelete}>
                                    <IoTrashOutline />
                                    <span>Xóa</span>
                                </div>
                            ) : (
                                <div className={styles.menuOption} onClick={handleReport}>
                                    <IoFlagOutline />
                                    <span>Báo cáo</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ================== INLINE REPLY FORM (Code 1) ================== */}
            {isReplying && (
                <div
                    className={styles.inlineReplyBox}
                    style={{ marginLeft: depth > 0 ? 0 : '44px' }}
                >
                    <div className={styles.inlineInputWrapper}>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            maxLength={150}
                            className={styles.inlineInput}
                            placeholder={`Trả lời ${comment.userName}...`}
                            value={replyText}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={isSending}
                        />

                        <span className={styles.charCounter}>
                            {replyText.length}/150
                        </span>
                    </div>

                    <div className={styles.actionButtons}>
                        <span
                            className={`${styles.sendIcon} ${
                                !replyText.trim() ? styles.disabled : ''
                            }`}
                            onClick={handleSendReply}
                        >
                            {isSending ? '...' : 'Gửi'}
                        </span>

                        <IoCloseOutline
                            className={styles.closeIcon}
                            onClick={() => setIsReplying(false)}
                        />
                    </div>
                </div>
            )}

            {/* ================== REPLIES RECURSION ================== */}
            {hasReplies && (
                <>
                    {/* Nút Xem thêm – CHỈ HIỆN Ở CHA */}
                    {depth === 0 && (
                        <div
                            className={styles.viewRepliesWrapper}
                            style={{ marginLeft: '44px' }}
                            onClick={() => setShowReplies(!showReplies)}
                        >
                            <div className={styles.horizontalLine}></div>
                            <span className={styles.viewMoreText}>
                                {showReplies
                                    ? 'Thu gọn'
                                    : `Xem câu trả lời (${countTotalReplies(comment.replies)})`}
                            </span>
                        </div>
                    )}

                    {/* LIST REPLIES */}
                    {(depth > 0 || showReplies) && (
                        <div
                            className={
                                depth === 0
                                    ? styles.repliesList
                                    : styles.repliesListFlat
                            }
                        >
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    onPostReply={onPostReply}
                                    depth={depth + 1}
                                    highlightCommentId={highlightCommentId}
                                    
                                    // 🔥 TRUYỀN TIẾP PROPS XUỐNG CON
                                    currentUser={currentUser}
                                    onDeleteComment={onDeleteComment}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CommentItem;