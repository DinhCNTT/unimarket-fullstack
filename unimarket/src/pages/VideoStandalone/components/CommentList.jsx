import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './CommentList.module.css';
import CommentItem from './CommentItem';

const API_BASE = "http://localhost:5133";

const CommentList = ({ 
    videoId, 
    refreshTrigger, 
    onPostReply, 
    highlightCommentId,
    currentUser,       // 🔥 Nhận user
    onDeleteComment    // 🔥 Nhận hàm xóa
}) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        try {
            if(comments.length === 0) setLoading(true); 
            const res = await axios.get(`${API_BASE}/api/Video/${videoId}/comments`);
            setComments(res.data);
        } catch (error) {
            console.error("Lỗi tải bình luận:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (videoId) fetchComments();
    }, [videoId, refreshTrigger]);

    if (loading && comments.length === 0) return <div className={styles.loadingText}>Đang tải...</div>;
    if (comments.length === 0) return <div className={styles.emptyText}>Chưa có bình luận nào.</div>;

    return (
        <div className={styles.listContainer}>
            {comments.map((cmt) => (
                <CommentItem 
                    key={cmt.id} 
                    comment={cmt} 
                    onPostReply={onPostReply} 
                    depth={0} 
                    highlightCommentId={highlightCommentId}
                    
                    // 🔥 TRUYỀN TIẾP XUỐNG
                    currentUser={currentUser}
                    onDeleteComment={onDeleteComment}
                />
            ))}
        </div>
    );
};
export default CommentList;