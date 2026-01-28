import React, { useEffect, useState, useContext, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import styles from './CommentDrawer.module.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import defaultAvatar from '../assets/default-avatar.png';
import toast from 'react-hot-toast';
import { IoClose, IoSend } from 'react-icons/io5'; // Cần cài: npm install react-icons

const CommentDrawer = ({ maTinDang, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedThreads, setExpandedThreads] = useState({});
  
  const navigate = useNavigate();
  const pollIntervalRef = useRef(null);
  const { token, user } = useContext(AuthContext);
  const currentUserId = user?.id;

  // --- HÀM HELPER: ĐẾM ĐỆ QUY ---
  const countRepliesRecursive = useCallback((list) => {
    if (!list || list.length === 0) return 0;
    return list.reduce((sum, item) => {
      return sum + 1 + countRepliesRecursive(item.replies);
    }, 0);
  }, []);

  // 1. Fetch Comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5133/api/video/${maTinDang}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy bình luận:", err);
    }
  }, [maTinDang]);

  // 2. Polling
  useEffect(() => {
    fetchComments();
    pollIntervalRef.current = setInterval(fetchComments, 3000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchComments]);

  const totalComments = useMemo(() => {
    return countRepliesRecursive(comments);
  }, [comments, countRepliesRecursive]);

  // 3. Xử lý Gửi Comment / Reply
  const handleSubmit = async (parentId = null, content = '') => {
    if (!token) return toast.error("Vui lòng đăng nhập!");
    if (!content.trim()) return;

    const payload = { content: content.trim(), parentCommentId: parentId };
    
    // Optimistic Update (Cập nhật giao diện ngay lập tức)
    const tempId = Date.now();
    const optimisticComment = {
      id: tempId,
      content: payload.content,
      userName: user?.fullName || 'Bạn',
      userId: currentUserId,
      avatarUrl: user?.avatarUrl,
      createdAt: new Date().toISOString(),
      replies: [],
      isOptimistic: true
    };

    if (parentId) {
      setComments(prev => prev.map(c => {
         // Logic đệ quy tìm cha để add vào (đơn giản hoá cho level 1 - logic thực tế nên đệ quy sâu hơn nếu cần)
         if (c.id === parentId) {
             return { ...c, replies: [...(c.replies || []), optimisticComment] };
         }
         return c;
      }));
      setReplyContent('');
      setActiveReplyId(null);
      setExpandedThreads(prev => ({ ...prev, [parentId]: true }));
    } else {
      setComments(prev => [optimisticComment, ...prev]);
      setNewComment('');
    }

    try {
      await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/comment`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchComments(); 
    } catch (err) {
      toast.error("Gửi thất bại");
      fetchComments(); 
    }
  };

  const handleTextareaChange = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // --- LOGIC RENDER ĐỆ QUY (Đã sửa để truyền tên cha) ---
  // parentName: Tên của người mà comment này đang trả lời
  const renderRecursiveReplies = (replies, rootId, parentName) => {
    if (!replies || replies.length === 0) return null;
    return replies.map((rep) => (
      <div key={rep.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {renderItem(rep, rootId, parentName)}
      </div>
    ));
  };

  // --- RENDER 1 ITEM COMMENT ---
  // replyToName: Tham số mới để hiển thị "A trả lời B"
  const renderItem = (cmt, rootCommentId = null, replyToName = null) => {
    const isMyComment = cmt.userId === currentUserId;
    const parentIdForReply = cmt.id; 
    
    const containerClass = rootCommentId 
        ? styles.repliesContainerFlat 
        : styles.repliesContainerIndent;

    const totalRepliesCount = countRepliesRecursive(cmt.replies);

    return (
        <div key={cmt.id} className={styles.itemContainer}>
            
            {/* CONTENT CHÍNH */}
            <div className={styles.commentItem}>
                <img 
                    src={cmt.avatarUrl || defaultAvatar} 
                    className={styles.avatar} 
                    onClick={() => { onClose(); navigate(`/nguoi-dung/${cmt.userId}`); }}
                    alt="avt"
                />
                <div className={styles.contentWrapper}>
                    {/* Phần tên và nội dung - Style TikTok */}
                    <div className={styles.nameRow}>
                        <span 
                            className={styles.userName} 
                            onClick={() => { onClose(); navigate(`/nguoi-dung/${cmt.userId}`); }}
                        >
                            {cmt.userName}
                        </span>
                        
                        {/* LOGIC HIỂN THỊ "trả lời ABC" */}
                        {replyToName && (
                            <span className={styles.replyLabel}>
                                trả lời <span className={styles.replyTargetName}>{replyToName}</span>
                            </span>
                        )}

                        {cmt.isAuthor && <span className={styles.authorBadge}>Tác giả</span>}
                    </div>

                    <div className={styles.textContent}>
                        {cmt.content}
                    </div>
                    
                    {/* Hành động: Thời gian, Reply, Delete */}
                    <div className={styles.actions}>
                        <span className={styles.time}>
                            {new Date(cmt.createdAt).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}
                        </span>
                        
                        {token && (
                            <button 
                                className={styles.actionBtn}
                                onClick={() => {
                                    if (activeReplyId === cmt.id) {
                                        setActiveReplyId(null);
                                    } else {
                                        setActiveReplyId(cmt.id);
                                        // TikTok style: Không cần điền sẵn @Name vào input, chỉ cần hiện input
                                        setReplyContent(''); 
                                    }
                                }}
                            >
                                Trả lời
                            </button>
                        )}

                        {isMyComment && !cmt.isOptimistic && (
                            <button 
                                className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                                onClick={() => {
                                    toast((t) => (
                                        <div className={styles.toastContainer}>
                                            <span className={styles.toastTitle}>Xoá bình luận ?</span>
                                            <div className={styles.toastActions}>
                                                <button className={`${styles.toastBtn} ${styles.toastBtnCancel}`} onClick={() => toast.dismiss(t.id)}>Huỷ</button>
                                                <button className={`${styles.toastBtn} ${styles.toastBtnDelete}`} onClick={async () => {
                                                    toast.dismiss(t.id);
                                                    try {
                                                        await axios.delete(`http://localhost:5133/api/video/comment/${cmt.id}`, {
                                                            headers: { Authorization: `Bearer ${token}` }
                                                        });
                                                        toast.success("Đã xoá");
                                                        fetchComments();
                                                    } catch(e) { toast.error("Lỗi xoá"); }
                                                }}>Xoá</button>
                                            </div>
                                        </div>
                                    ));
                                }}
                            >
                                Xoá
                            </button>
                        )}
                    </div>

                    {/* Form trả lời Inline */}
                    {activeReplyId === cmt.id && (
                        <div className={styles.inlineReplyBox}>
                            <div className={styles.inlineInputWrap}>
                                <textarea
                                    className={styles.inlineTextarea}
                                    autoFocus
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Trả lời ${cmt.userName}...`}
                                    rows={1}
                                    onInput={handleTextareaChange}
                                />
                                <button className={styles.inlineSendBtn} onClick={() => handleSubmit(parentIdForReply, replyContent)}>
                                    <IoSend size={16}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* REPLIES LIST */}
            {cmt.replies && cmt.replies.length > 0 && (
                <div className={containerClass}>
                    {rootCommentId ? (
                        // QUAN TRỌNG: Truyền cmt.userName xuống làm parentName cho con
                        renderRecursiveReplies(cmt.replies, rootCommentId, cmt.userName)
                    ) : (
                        !expandedThreads[cmt.id] ? (
                             <button 
                                className={styles.toggleRepliesBtn}
                                onClick={() => setExpandedThreads(prev => ({...prev, [cmt.id]: true}))}
                             >
                                <div className={styles.lineIndicator}></div>
                                Xem {totalRepliesCount} câu trả lời khác
                             </button>
                        ) : (
                            <>
                                {/* QUAN TRỌNG: Truyền cmt.userName xuống làm parentName cho con */}
                                {renderRecursiveReplies(cmt.replies, cmt.id, cmt.userName)} 
                                <button 
                                    className={styles.toggleRepliesBtn}
                                    onClick={() => setExpandedThreads(prev => ({...prev, [cmt.id]: false}))}
                                 >
                                    Ẩn câu trả lời
                                 </button>
                            </>
                        )
                    )}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>Bình luận <span className={styles.countBadge}>{totalComments}</span></div>
          <button onClick={onClose} className={styles.closeBtn}>
            <IoClose size={24} />
          </button>
        </div>

        {/* List */}
        <div className={styles.commentList}>
          {comments.length === 0 && (
            <div className={styles.emptyState}>
                <p>Hãy là người đầu tiên bình luận!</p>
            </div>
          )}
          {comments.map(cmt => (
             <div key={cmt.id} style={{marginBottom: 16}}>
                {renderItem(cmt, null, null)} {/* Root items không có replyToName */}
             </div>
          ))}
        </div>

        {/* Footer Input */}
        <div className={styles.inputArea}>
            {token ? (
                <div className={styles.inputContainer}>
                    <img src={user?.avatarUrl || defaultAvatar} className={styles.myAvatarSmall} alt="me"/>
                    <div className={styles.inputFieldWrap}>
                        <textarea
                            className={styles.mainInput}
                            placeholder="Thêm bình luận..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onInput={handleTextareaChange}
                            rows={1}
                        />
                        <button 
                            className={styles.mainSendBtn} 
                            disabled={!newComment.trim()}
                            onClick={() => handleSubmit(null, newComment)}
                        >
                            Đăng
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.loginPrompt} onClick={() => { onClose(); navigate('/login'); }}>
                    Đăng nhập để tham gia bình luận
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default CommentDrawer;