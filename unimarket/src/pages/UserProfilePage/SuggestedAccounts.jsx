import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './SuggestedAccounts.module.css';
import defaultAvatar from "../../assets/default-avatar.png"; 
import FollowListModal from './FollowListModal'; 
import { IoChevronBack, IoChevronForward, IoChevronForwardOutline } from "react-icons/io5"; 

const SuggestedAccounts = ({ targetUserId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5133/api/Follow/suggested`, {
          params: { targetUserId: targetUserId },
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data) {
          const dataWithStatus = res.data.map(user => ({
            ...user,
            // 🔥 CẬP NHẬT 1: Lấy đủ trạng thái từ backend
            isFollowed: user.isFollowed || false,
            isPending: user.isPending || false,         // Trạng thái chờ xác nhận
            isPrivateAccount: user.isPrivateAccount || false // Trạng thái riêng tư
          }));
          setSuggestions(dataWithStatus);
        }
      } catch (error) {
        console.error("Lỗi tải đề xuất:", error);
      } finally {
        setLoading(false);
      }
    };

    if (targetUserId) {
      fetchSuggestions();
    }
  }, [targetUserId]);

  // 🔥 CẬP NHẬT 2: Sửa logic Handle Follow
  const handleFollow = async (userId, isPrivate) => {
    try {
      const token = localStorage.getItem('token');
      
      // --- OPTIMISTIC UPDATE (Cập nhật giao diện giả lập ngay lập tức) ---
      setSuggestions(prevList => 
        prevList.map(user => {
            if (user.id !== userId) return user;

            // Logic chuyển đổi trạng thái
            if (user.isPending) {
                // Đang chờ -> Hủy yêu cầu -> Về trạng thái ban đầu
                return { ...user, isPending: false, isFollowed: false };
            } else if (user.isFollowed) {
                // Đang follow -> Unfollow -> Về trạng thái ban đầu
                return { ...user, isFollowed: false, isPending: false };
            } else {
                // Chưa làm gì -> Bấm Follow
                if (user.isPrivateAccount) {
                    // Nếu riêng tư -> Thành Đã gửi yêu cầu
                    return { ...user, isPending: true, isFollowed: false };
                } else {
                    // Nếu công khai -> Thành Đang Follow
                    return { ...user, isFollowed: true, isPending: false };
                }
            }
        })
      );

      // --- GỌI API ---
      const res = await axios.post(
        `http://localhost:5133/api/Follow/toggle`,
        {}, // Body rỗng
        {
           params: { targetUserId: userId }, 
           headers: { Authorization: `Bearer ${token}` }
        }
      );

      // --- ĐỒNG BỘ DỮ LIỆU TỪ SERVER ---
      // Sau khi API trả về, cập nhật lại trạng thái chính xác để tránh sai lệch
      if (res.data && res.data.success) {
          setSuggestions(prevList => 
            prevList.map(user => 
                user.id === userId 
                ? { 
                    ...user, 
                    isFollowed: res.data.isFollowed, 
                    isPending: res.data.isPending 
                  } 
                : user
            )
          );
      }

    } catch (error) {
      console.error("Lỗi khi follow:", error);
      // Nếu lỗi mạng, hoàn tác lại trạng thái cũ (cần logic phức tạp hơn để revert chuẩn, 
      // ở đây tạm thời reload lại list hoặc thông báo lỗi)
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const scroll = (direction) => {
    if (listRef.current) {
      const scrollAmount = 300;
      listRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleNavigateToProfile = (id) => {
      navigate(`/nguoi-dung/${id}`);
  };

  // Hàm helper để xác định style và text cho nút button
  const getButtonProps = (user) => {
      if (user.isPending) {
          return {
              text: 'Đã gửi yêu cầu',
              style: { background: '#E5E5E5', color: '#161823', boxShadow: 'none', fontSize: '12px' } // Style xám, chữ nhỏ hơn xíu nếu cần
          };
      }
      if (user.isFollowed) {
          return {
              text: 'Đang Follow',
              style: { background: '#E5E5E5', color: '#161823', boxShadow: 'none' } // Style xám
          };
      }
      return {
          text: 'Follow',
          style: {} // Style mặc định (đỏ/cam tùy css gốc)
      };
  };

  if (loading) return null;
  if (suggestions.length === 0) return null;

  const showArrows = suggestions.length >= 5; 

  return (
    <>
      <div className={styles.suggestContainer}>
        <div className={styles.headerRow}>
          <div className={styles.title}>Gợi ý cho bạn</div>
          
          <button 
            className={styles.seeAllBtn} 
            onClick={() => setShowModal(true)}
          >
            Xem tất cả <IoChevronForwardOutline style={{fontSize: '14px', marginTop:'1px'}} />
          </button>
        </div>

        <div className={styles.listWrapper}>
          {showArrows && (
            <button 
              className={`${styles.navBtn} ${styles.prevBtn}`} 
              onClick={() => scroll('left')}
            >
              <IoChevronBack />
            </button>
          )}

          <div className={styles.list} ref={listRef}>
            {suggestions.map((user) => {
              // 🔥 CẬP NHẬT 3: Lấy props cho button dựa trên trạng thái
              const btnProps = getButtonProps(user);
              
              return (
                <div key={user.id} className={styles.card}>
                  <img 
                    src={user.avatarUrl || defaultAvatar} 
                    alt={user.fullName} 
                    className={styles.avatar} 
                    onError={(e) => {e.target.src = defaultAvatar}}
                    onClick={() => handleNavigateToProfile(user.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  
                  <h3 
                      className={styles.name}
                      onClick={() => handleNavigateToProfile(user.id)}
                      style={{ cursor: 'pointer' }}
                  >
                      {user.fullName}
                  </h3>
                  
                  <p 
                      className={styles.nickname}
                      onClick={() => handleNavigateToProfile(user.id)}
                      style={{ cursor: 'pointer' }}
                  >
                      @{user.userName}
                  </p>
                  
                  <button 
                    className={styles.followBtn}
                    onClick={(e) => {
                      e.stopPropagation(); 
                      // Truyền thêm cờ private account
                      handleFollow(user.id, user.isPrivateAccount);
                    }}
                    style={btnProps.style}
                  >
                    {btnProps.text}
                  </button>
                </div>
              );
            })}
          </div>

          {showArrows && (
            <button 
              className={`${styles.navBtn} ${styles.nextBtn}`} 
              onClick={() => scroll('right')}
            >
              <IoChevronForward />
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <FollowListModal 
          userId={targetUserId}
          initialTab="suggested"
          onClose={() => setShowModal(false)}
          currentUserName="Gợi ý"
        />
      )}
    </>
  );
};

export default SuggestedAccounts;