// src/components/SmartFollowingList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SmartFollowingList.module.css';
import defaultAvatar from '../assets/default-avatar.png';

const API_BASE_URL = "http://localhost:5133";

const SmartFollowingList = ({ isMini }) => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getAvatar = (url) => {
    if (!url) return defaultAvatar;
    return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  };

  const fetchFriends = async (pageNum) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/follow/following-smart?page=${pageNum}&pageSize=4`, {
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();
      
      if (data.length < 4) setHasMore(false);
      
      setUsers(prev => pageNum === 1 ? data : [...prev, ...data]);
    } catch (error) {
      console.error("Lỗi tải danh sách follow:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends(page);
  }, [page]);

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  // ✅ SỬA LOGIC: Nếu không có user và không đang load -> Hiển thị thông báo (chỉ khi không ở chế độ Mini)
  if (users.length === 0 && !loading) {
    if (isMini) return null; // Nếu đang thu nhỏ thì ẩn luôn cho gọn
    
    return (
        <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Các tài khoản Đã follow</p>
            <p className={styles.emptyDesc}>
                Những tài khoản bạn follow sẽ xuất hiện tại đây
            </p>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      {!isMini && <p className={styles.header}>Following accounts</p>}
      
      <div className={styles.list}>
        {users.map((user) => (
          <div 
            key={user.userId} 
            className={styles.item} 
            onClick={() => navigate(`/nguoi-dung/${user.userId}`)} 
            title={user.fullName}
          >
            <div className={styles.avatarWrapper}>
              <img 
                src={getAvatar(user.avatarUrl)} 
                alt={user.fullName} 
                className={styles.avatar} 
                onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = defaultAvatar; 
                }}
              />
              {user.isOnline && <span className={styles.onlineDot}></span>}
            </div>
            
            {/* Ẩn thông tin khi thu nhỏ navbar */}
            {!isMini && (
                <div className={styles.info}>
                    {/* Dòng 1: Tên + Tick xanh */}
                    <div className={styles.nameRow}>
                        <p className={styles.name}>{user.fullName}</p>
                        {user.matchScore > 80 && <span className={styles.check}>✓</span>}
                    </div>
                    
                    {/* Dòng 2: Số điện thoại (Nếu có) */}
                    {user.phoneNumber && (
                        <p className={styles.phoneNumber}>{user.phoneNumber}</p>
                    )}
                </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && !isMini && (
        <button 
            className={styles.loadMore} 
            onClick={handleLoadMore} 
            disabled={loading}
        >
          {loading ? "Loading..." : "See more"}
        </button>
      )}
    </div>
  );
};

export default SmartFollowingList;