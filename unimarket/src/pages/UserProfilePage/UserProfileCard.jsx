import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./UserProfileCard.module.css";
import ShareButton from "../../components/ShareButton";
import defaultAvatar from "../../assets/default-avatar.png";
import FollowListModal from "./FollowListModal";
import SuggestedAccounts from "./SuggestedAccounts";
import EditProfileModal from "./EditProfileModal";
import SidebarHeader from '../../components/Common/SidebarHeader';
import { getOrCreateConversation } from "../../services/chatSocialService";

// --- IMPORT ICON MẠNG XÃ HỘI (Từ react-icons) ---
import { FaFacebook, FaGoogle, FaTiktok, FaInstagram } from 'react-icons/fa';

// --- KHU VỰC ĐỊNH NGHĨA ICON (SVG GỐC) ---
const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M41.0373 26.8329C41.2721 25.9329 41.3965 24.986 41.3965 24.0156C41.3965 23.0333 41.2692 22.0754 41.0292 21.1651L45.0232 17.2711C45.3995 16.9042 45.5186 16.3477 45.3184 15.8643C44.2096 13.187 42.4828 10.7818 40.2858 8.84157C39.8829 8.4858 39.2934 8.45564 38.854 8.75239L34.1287 11.9442C32.4862 10.8732 30.6548 10.0436 28.7058 9.49962L27.674 3.96144C27.5756 3.43324 27.1166 3.04688 26.5801 3.04688H21.4199C20.8834 3.04688 20.4244 3.43324 20.326 3.96144L19.2942 9.49962C17.3452 10.0436 15.5138 10.8732 13.8713 11.9442L9.14603 8.75239C8.70656 8.45564 8.11714 8.4858 7.71424 8.84157C5.51724 10.7818 3.79043 13.187 2.68165 15.8643C2.48137 16.3477 2.60047 16.9042 2.97682 17.2711L6.97082 21.1651C6.7308 22.0754 6.60352 23.0333 6.60352 24.0156C6.60352 24.986 6.72793 25.9329 6.96272 26.8329L2.97682 30.7289C2.60047 31.0958 2.48137 31.6523 2.68165 32.1357C3.79043 34.813 5.51724 37.2182 7.71424 39.1584C8.11714 39.5142 8.70656 39.5444 9.14603 39.2476L13.8713 36.0558C15.5138 37.1268 17.3452 37.9564 19.2942 38.5004L20.326 44.0386C20.4244 44.5668 20.8834 44.9531 21.4199 44.9531H26.5801C27.1166 44.9531 27.5756 44.5668 27.674 44.0386L28.7058 38.5004C30.6548 37.9564 32.4862 37.1268 34.1287 36.0558L38.854 39.2476C39.2934 39.5444 39.8829 39.5142 40.2858 39.1584C42.4828 37.2182 44.2096 34.813 45.3184 32.1357C45.5186 31.6523 45.3995 31.0958 45.0232 30.7289L41.0373 26.8329ZM24 31.5156C19.8579 31.5156 16.5 28.1578 16.5 24.0156C16.5 19.8735 19.8579 16.5156 24 16.5156C28.1421 16.5156 31.5 19.8735 31.5 24.0156C31.5 28.1578 28.1421 31.5156 24 31.5156Z" fill="currentColor"/></svg>
);

const AddUserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 21V19C15 16.7909 13.2091 15 11 15H7C4.79086 15 3 16.7909 3 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 11H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserCheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21V19C16 16.7909 14.2091 15 12 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11C12.2091 11 14 9.20914 14 7C14 4.79086 12.2091 3 10 3C7.79086 3 6 4.79086 6 7C6 9.20914 7.79086 11 10 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 11L19 13L23 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ThreeDotsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 8C17.1046 8 18 7.10457 18 6C18 4.89543 17.1046 4 16 4C14.8954 4 14 4.8954 14 6C14 7.10457 14.8954 8 16 8Z" fill="currentColor"/><path d="M16 18C17.1046 18 18 17.1046 18 16C18 14.8954 17.1046 14 16 14C14.8954 14 14 14.8954 14 16C14 17.1046 14.8954 18 16 18Z" fill="currentColor"/><path d="M16 28C17.1046 28 18 27.1046 18 26C18 24.8954 17.1046 24 16 24C14.8954 24 14 24.8954 14 26C14 27.1046 14.8954 28 16 28Z" fill="currentColor"/></svg>
);

const FlagIcon = () => (
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6V42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 10C9 10 16 7 24 10C32 13 39 10 39 10V26C39 26 32 29 24 26C16 23 9 26 9 26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const BlockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24 4C12.9543 4 4 12.9543 4 24 44Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 15L33 33" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

// --- CONFIG SOCIAL ICONS (Màu sắc và Icon tương ứng) ---
const SOCIAL_ICONS_CONFIG = {
    Facebook: { icon: <FaFacebook />, color: "#1877F2" },
    Google:   { icon: <FaGoogle />,   color: "#DB4437" },
    TikTok:   { icon: <FaTiktok />,   color: "var(--theme-text-primary)" }, 
    Instagram:{ icon: <FaInstagram />,color: "#E1306C" }
};
const UserProfileCard = ({ userInfo, followersCount = 0, followingCount = 0, totalLikes = 0, isOwner }) => {
  const navigate = useNavigate();

  // --- STATE ---
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState("following");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // State quản lý link mạng xã hội
  const [socialLinks, setSocialLinks] = useState([]);

  const menuRef = useRef(null);
  
  // Trạng thái Follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState(followersCount);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- 1. Fetch Follow Status (Tách riêng logic Follow) ---
  useEffect(() => {
    // 1.1 Sync Follow count
    setLocalFollowerCount(followersCount);

    // 1.2 Check Follow Status
    const checkFollowStatus = async () => {
      if (isOwner || !userInfo?.id) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`http://localhost:5133/api/Follow/is-following/${userInfo.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
              setIsFollowing(res.data.isFollowing);
              setIsPending(res.data.isPending);
        }
      } catch (error) {
        console.error("Lỗi check follow status:", error);
      }
    };
    checkFollowStatus();
  }, [userInfo.id, isOwner, followersCount]);

  // --- 2. Fetch Social Links (Logic mới - Code 2) ---
  useEffect(() => {
    const fetchSocialLinks = async () => {
        // Kiểm tra nếu chưa có ID user thì chưa chạy
        if (!userInfo?.id) return;

        try {
            const token = localStorage.getItem("token");
            let response;
            const API_BASE_URL = 'http://localhost:5133'; // Check lại port của bạn

            if (isOwner) {
                // TRƯỜNG HỢP 1: Xem chính mình
                // Gọi API lấy theo Token để có thể hiển thị cả những cái chưa liên kết (nếu cần xử lý thêm)
                response = await axios.get(`${API_BASE_URL}/api/userprofile/social-links`, {
                     headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // TRƯỜNG HỢP 2: Xem người khác (User Profile Khác)
                // Gọi API CÔNG KHAI mới tạo, truyền vào userInfo.id
                response = await axios.get(`${API_BASE_URL}/api/userprofile/public-social-links/${userInfo.id}`, {
                     headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Xử lý dữ liệu trả về
            if (response.status === 200 && Array.isArray(response.data)) {
                // Lọc chỉ lấy những tài khoản đã liên kết (isLinked = true)
                const linkedAccounts = response.data.filter(item => item.isLinked);
                setSocialLinks(linkedAccounts);
            }
        } catch (error) {
            console.error("Lỗi lấy social links:", error);
            setSocialLinks([]); // Nếu lỗi thì ẩn phần icon đi
        }
    };

    fetchSocialLinks();
  }, [userInfo.id, isOwner]);

  // --- 3. Logic Interaction (Modal, Click) ---
  const handleOpenModal = (tabName) => {
    if (!isOwner && userInfo?.isPrivateAccount && !isFollowing) {
        toast.error("Tài khoản này là riêng tư. Hãy Follow để xem danh sách.");
        return;
    }
    setModalTab(tabName);
    setShowModal(true);
  };

  const handleUpdateSuccess = () => {
    window.location.reload(); 
  };

  // Logic Toggle Follow (Pending, Private Account)
  const handleFollowToggle = async () => {
    const previousFollowing = isFollowing;
    const previousPending = isPending;
    const previousCount = localFollowerCount;

    if (isPending) {
        setIsPending(false);
    } 
    else if (isFollowing) {
        setIsFollowing(false);
        setLocalFollowerCount((prev) => Math.max(0, prev - 1)); 
    } 
    else {
        if (userInfo.isPrivateAccount) {
            setIsPending(true);
        } else {
            setIsFollowing(true);
            setLocalFollowerCount((prev) => prev + 1); 
        }
    }

    try {
        const res = await axios.post(
        `http://localhost:5133/api/Follow/toggle?targetUserId=${userInfo.id}`,
        {},
        {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
        );

        if (res.data.success) {
        setLocalFollowerCount(res.data.newFollowerCount);
        setIsFollowing(res.data.isFollowed);
        setIsPending(res.data.isPending);
        
        if (res.data.isFollowed) {
            setShowSuggestions(true);
        }
        }
    } catch (err) {
        console.error("Lỗi follow:", err);
        setIsFollowing(previousFollowing);
        setIsPending(previousPending);
        setLocalFollowerCount(previousCount);
        toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  const handleMessageClick = async () => {
    if (!userInfo?.id) return;
    if (isOwner) return;

    try {
        const conversationData = await getOrCreateConversation(userInfo.id);
        navigate('/chat', {      
            state: { 
                selectedConversation: conversationData, 
                autoSelect: true 
            } 
        });
    } catch (error) {
        console.error("Lỗi khi mở tin nhắn:", error);
        alert("Không thể bắt đầu cuộc trò chuyện: " + (error.message || "Lỗi không xác định"));
    }
  };

  // Logic xử lý khi click vào icon mạng xã hội
  const handleSocialClick = (linkData) => {
      // Nếu là Google (Email) thì mở mailto, còn lại mở tab mới
      if (linkData.provider === 'Google') {
         window.location.href = `mailto:${linkData.profileUrl}`;
      } else if (linkData.profileUrl) {
         window.open(linkData.profileUrl, '_blank');
      }
  };

  // Logic Click outside menu
  useEffect(() => {
    function handleClickOutside(event) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setShowMoreMenu(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

 return (
    <>
      {/* SidebarHeader - Fixed position */}
      <div style={{ 
          position: 'fixed', 
          top: '20px',    
          right: '20px',  
          zIndex: 1000    
      }}>
          <SidebarHeader />
      </div>

      <div className={styles.profileHeader} style={{ position: 'relative' }}>
        
        {/* ===== KHỐI 1: AVATAR + THÔNG TIN ===== */}
        <div className={styles.infoContainer}>
          
          {/* === AVATAR === */}
          <div className={styles.avatarSection}>
            <img
              src={userInfo.avatarUrl || defaultAvatar}
              alt="Avatar"
              className={styles.avatar}
            />
          </div>

          {/* === INFO SECTION === */}
          <div className={styles.textInfoSection}>
            <h1 className={styles.username}>
              {userInfo.fullName || "Người dùng UniMarket"}
              {userInfo.daXacMinhEmail && (
                <span
                  className={styles.verifiedBadge}
                  title="Đã xác minh"
                >
                  ✓
                </span>
              )}
            </h1>

            <h2 className={styles.nickname}>
              @{userInfo.userName || "unknown"}
            </h2>

            {/* ===== ACTION BUTTONS ===== */}
            <div className={styles.actionButtons}>
              {isOwner ? (
                <>
                  {/* === OWNER === */}
                  <button 
                    className={styles.btnPrimary}
                    onClick={() => setShowEditModal(true)}
                  >
                    Edit profile
                  </button>

                  <button className={styles.btnSecondary}>
                    Promote post
                  </button>

                  <button
                    className={`${styles.btnIcon} ${styles.btnSecondary}`}
                    onClick={() => navigate('/cai-dat-tai-khoan')}
                  >
                    <SettingsIcon />
                  </button>

                  <div className={styles.shareBtnWrapper}>
                    <ShareButton profileUser={userInfo} />
                  </div>
                </>
              ) : (
                <>
                  {/* === VISITOR === */}
                  <button
                    className={
                      isFollowing
                        ? styles.btnFollowing // Style xám
                        : isPending
                        ? styles.btnFollowing // Style xám
                        : styles.btnFollow    // Style xanh
                    }
                    onClick={handleFollowToggle}
                  >
                    {isFollowing 
                        ? "Đang Follow" 
                        : isPending 
                            ? "Đã gửi yêu cầu" 
                            : "Follow"
                    }
                  </button>

                  <button 
                    className={styles.btnMessage}
                    onClick={handleMessageClick}
                  >
                    Tin nhắn
                  </button>

                  <button
                    className={`${styles.btnIcon} ${styles.btnSecondary}`}
                    onClick={handleFollowToggle}
                    title={
                      isFollowing 
                        ? "Hủy follow" 
                        : isPending 
                            ? "Hủy yêu cầu" 
                            : "Follow người dùng"
                    }
                  >
                    {(isFollowing || isPending) ? (
                      <UserCheckIcon />
                    ) : (
                      <AddUserIcon />
                    )}
                  </button>

                  <div className={styles.shareBtnWrapper}>
                    <ShareButton profileUser={userInfo} />
                  </div>

                  {/* === MENU 3 CHẤM === */}
                  <div
                    className={styles.moreMenuWrapper}
                    ref={menuRef}
                  >
                    <button
                      className={`${styles.btnIcon} ${styles.btnSecondary}`}
                      onClick={() =>
                        setShowMoreMenu(!showMoreMenu)
                      }
                    >
                      <ThreeDotsIcon />
                    </button>

                    {showMoreMenu && (
                      <div className={styles.dropdownMenu}>
                        <div className={styles.menuItem}>
                          <span className={styles.menuIcon}>
                            <FlagIcon />
                          </span>
                          Báo cáo
                        </div>

                        <div
                          className={`${styles.menuItem} ${styles.menuBorderTop}`}
                        >
                          <span className={styles.menuIcon}>
                            <BlockIcon />
                          </span>
                          Chặn
                        </div>

                        <div className={styles.menuArrow}></div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ===== STATS ===== */}
            <div className={styles.statsRow}>
              <div
                className={styles.statItem}
                onClick={() => handleOpenModal("following")}
                style={{ cursor: "pointer" }}
                title="Xem danh sách đang theo dõi"
              >
                <strong className={styles.statNumber}>
                  {followingCount}
                </strong>
                <span className={styles.statLabel}>
                  Following
                </span>
              </div>

              <div
                className={styles.statItem}
                onClick={() => handleOpenModal("followers")}
                style={{ cursor: "pointer" }}
                title="Xem người theo dõi"
              >
                <strong className={styles.statNumber}>
                  {localFollowerCount}
                </strong>
                <span className={styles.statLabel}>
                  Followers
                </span>
              </div>

              <div className={styles.statItem}>
                <strong className={styles.statNumber}>
                  {totalLikes}
                </strong>
                <span className={styles.statLabel}>
                  Likes
                </span>
              </div>
            </div>

            {/* ===== BIO & SOCIAL INFO (FLEXBOX INTEGRATION) ===== */}
            <div className={styles.bioSection}>
              {userInfo.phoneNumber ? (
                 // Container Flexbox: SĐT + Icon
                 <div className={styles.contactRow}>
                    <p className={styles.phoneNumberDisplay}>
                      LH: {userInfo.phoneNumber}
                      {userInfo.daXacMinhEmail && (
                        <span className={styles.phoneVerified}>
                          (Đã xác minh)
                        </span>
                      )}
                    </p>

                    {/* Danh sách Icon Mạng Xã Hội */}
                    {socialLinks.length > 0 && (
                        <div className={styles.socialList}>
                            <div className={styles.separator}>|</div>
                            {socialLinks.map((link, idx) => {
                                const config = SOCIAL_ICONS_CONFIG[link.provider] || { icon: null, color: '#333' };
                                if (!config.icon) return null;
                                return (
                                    <div 
                                        key={idx} 
                                        className={styles.socialIcon}
                                        style={{ color: config.color }}
                                        onClick={() => handleSocialClick(link)}
                                        title={`Đến ${link.provider}`}
                                    >
                                        {config.icon}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                 </div>
              ) : (
                <p className={styles.emptyBio}>
                  No bio yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ===== KHỐI 2: SUGGESTED ACCOUNTS ===== */}
        {!isOwner && showSuggestions && (!userInfo.isPrivateAccount || isFollowing) && (
          <SuggestedAccounts
            targetUserId={userInfo.id}
          />
        )}
      </div>

      {/* ===== MODAL FOLLOW ===== */}
      {showModal && (
        <FollowListModal
          userId={userInfo.id}
          currentUserName={userInfo.fullName}
          initialTab={modalTab}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* ===== MODAL EDIT PROFILE ===== */}
      {showEditModal && (
        <EditProfileModal 
          userInfo={userInfo}
          onClose={() => setShowEditModal(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );

};

export default UserProfileCard;