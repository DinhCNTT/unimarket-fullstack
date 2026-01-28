import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import styles from './FollowListModal.module.css';
import { IoCloseOutline } from "react-icons/io5";
import defaultAvatar from "../../assets/default-avatar.png"; 

const getMyId = () => {
    return localStorage.getItem('userId'); 
};

const FollowListModal = ({ initialTab = 'following', userId, onClose, currentUserName }) => {
    const [activeTab, setActiveTab] = useState(initialTab); 
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate(); 
    const myId = getMyId(); 

    // --- LOGIC KHÓA CUỘN (GIỮ NGUYÊN) ---
    useEffect(() => {
        const scrollY = window.scrollY;
        const originalStyle = {
            position: document.body.style.position,
            top: document.body.style.top,
            width: document.body.style.width,
            overflowY: document.body.style.overflowY
        };

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflowY = 'hidden'; 

        return () => {
            document.body.style.position = originalStyle.position;
            document.body.style.top = originalStyle.top;
            document.body.style.width = originalStyle.width;
            document.body.style.overflowY = originalStyle.overflowY;
            window.scrollTo(0, scrollY);
        };
    }, []); 

    const API_URLS = {
        following: `http://localhost:5133/api/Follow/following`,
        followers: `http://localhost:5133/api/Follow/followers`,
        suggested: `http://localhost:5133/api/Follow/suggested`
    };

    const getTargetUserId = (user) => {
        if (activeTab === 'suggested') return user.id;
        if (activeTab === 'following') return user.followingId;
        if (activeTab === 'followers') return user.followerId;  
        return user.id || user.userId;
    };

    const handleUserClick = (targetId) => {
        if (!targetId) return;
        onClose(); 
        navigate(`/nguoi-dung/${targetId}`); 
    };

    // --- 1. Fetch Data: Map thêm trường isPending và isPrivateAccount ---
    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;

            setLoading(true);
            try {
                let url = API_URLS[activeTab];
                
                const res = await axios.get(url, {
                    params: { targetUserId: userId }, 
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                
                const mappedUsers = res.data.map(user => ({
                    ...user,
                    isFollowed: user.isFollowed || false,
                    isPending: user.isPending || false,         // 🔥 Mới: Trạng thái chờ
                    isPrivateAccount: user.isPrivateAccount || false // 🔥 Mới: Trạng thái riêng tư
                }));

                setUsers(mappedUsers);
            } catch (error) {
                console.error("Lỗi tải danh sách:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, userId]); 

    // --- 2. Logic Toggle Follow (Xử lý riêng tư) ---
    const handleFollowToggle = async (targetId) => {
        if (!targetId) return;

        // Optimistic Update (Cập nhật giao diện ngay lập tức)
        setUsers(prevUsers => prevUsers.map(user => {
            const realId = getTargetUserId(user);
            if (String(realId) === String(targetId)) {
                // Logic chuyển trạng thái
                if (user.isPending) {
                    // Đang chờ -> Hủy yêu cầu
                    return { ...user, isPending: false, isFollowed: false };
                } else if (user.isFollowed) {
                    // Đang follow -> Unfollow
                    return { ...user, isFollowed: false, isPending: false };
                } else {
                    // Chưa làm gì -> Bấm nút
                    if (user.isPrivateAccount) {
                        // Riêng tư -> Thành Pending
                        return { ...user, isPending: true, isFollowed: false };
                    } else {
                        // Công khai -> Thành Followed
                        return { ...user, isFollowed: true, isPending: false };
                    }
                }
            }
            return user;
        }));

        try {
            const res = await axios.post(`http://localhost:5133/api/Follow/toggle?targetUserId=${targetId}`, {}, {
                 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Đồng bộ lại với dữ liệu thật từ Server để đảm bảo chính xác
            if (res.data && res.data.success) {
                setUsers(prevUsers => prevUsers.map(user => {
                    const realId = getTargetUserId(user);
                    if (String(realId) === String(targetId)) {
                        return { 
                            ...user, 
                            isFollowed: res.data.isFollowed, 
                            isPending: res.data.isPending 
                        };
                    }
                    return user;
                }));
            }
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
             
            // Rollback nếu lỗi (Đơn giản là load lại data hoặc revert logic - ở đây chọn revert logic cơ bản)
            // Để an toàn nhất nên gọi lại fetch data, nhưng ở đây ta revert tạm UI
            setUsers(prevUsers => prevUsers.map(user => {
                const realId = getTargetUserId(user);
                if (String(realId) === String(targetId)) {
                     // Revert lại trạng thái cũ là rất khó nếu không lưu biến tạm.
                     // Cách tốt nhất khi lỗi là giữ nguyên trạng thái vừa click hoặc fetch lại.
                     // Ở đây ta đảo ngược lại isFollowed/isPending dựa trên logic đơn giản
                     return { ...user, isFollowed: !user.isFollowed, isPending: !user.isPending }; 
                }
                return user;
            }));
        }
    };

    // Helper: Xác định text và style cho nút bấm
    const getButtonProps = (user) => {
        if (user.isPending) {
            return {
                text: "Đã gửi yêu cầu",
                className: styles.btnFollowing // Dùng chung class màu xám với Following
            };
        }
        if (user.isFollowed) {
            return {
                text: "Đang Follow",
                className: styles.btnFollowing
            };
        }
        return {
            text: "Follow",
            className: styles.btnFollow
        };
    };

    return (
        <div 
            className={styles.modalOverlay} 
            onClick={onClose}
            onWheel={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
            onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
        >
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                {/* HEADER & TABS */}
                <div className={styles.header}>
                    <span className={styles.username}>{currentUserName || "Người dùng"}</span>
                    <button className={styles.closeBtn} onClick={onClose}><IoCloseOutline /></button>
                </div>

                <div className={styles.tabs}>
                    <div className={`${styles.tabItem} ${activeTab === 'following' ? styles.active : ''}`} onClick={() => setActiveTab('following')}>
                        Đang Follow
                    </div>
                    <div className={`${styles.tabItem} ${activeTab === 'followers' ? styles.active : ''}`} onClick={() => setActiveTab('followers')}>
                        Follower
                    </div>
                    <div className={`${styles.tabItem} ${activeTab === 'suggested' ? styles.active : ''}`} onClick={() => setActiveTab('suggested')}>
                        Được đề xuất
                    </div>
                </div>

                {/* LIST CONTENT */}
                <div className={styles.listContainer}>
                    {loading ? (
                        <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>Đang tải...</div>
                    ) : (
                        users.length > 0 ? users.map((user) => {
                            const realId = getTargetUserId(user); 
                            const isMe = myId && String(realId) === String(myId);
                            
                            // Lấy thuộc tính hiển thị nút
                            const btnProps = getButtonProps(user);

                            return (
                                <div key={realId} className={styles.userItem}>
                                    <div 
                                        className={styles.userInfo} 
                                        onClick={() => handleUserClick(realId)}
                                        style={{ cursor: 'pointer' }} 
                                    >
                                        <img 
                                            src={user.avatarUrl || defaultAvatar} 
                                            alt="ava" 
                                            className={styles.avatar} 
                                            onError={(e) => {e.target.src = defaultAvatar}} 
                                        />
                                        <div className={styles.textInfo}>
                                            <h4>{user.fullName || "Người dùng"}</h4>
                                            <p>@{user.userName || "user"}</p>
                                            {activeTab === 'suggested' && user.reason && (
                                                <p className={styles.reasonText}>{user.reason}</p>
                                            )}
                                        </div>
                                    </div>

                                    {!isMe && (
                                        <button 
                                            className={`${styles.actionBtn} ${btnProps.className}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFollowToggle(realId);
                                            }}
                                            // 🔥 Nếu đang pending có thể style chữ nhỏ hơn chút nếu cần
                                            style={user.isPending ? { fontSize: '12px' } : {}}
                                        >
                                            {btnProps.text}
                                        </button>
                                    )}
                                </div>
                            );
                        }) : (
                            <p style={{textAlign:'center', color:'#999', marginTop: 20}}>Trống</p>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;