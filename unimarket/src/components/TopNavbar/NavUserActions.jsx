import React, { useState, useContext, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import {
  FaRegBell, FaUserCircle, FaChevronDown, FaHeart, FaVideo,
  FaCommentDots, FaCog, FaCommentAlt, FaSignOutAlt, FaEdit,FaHistory,
} from "react-icons/fa";
import { MdTableRows } from "react-icons/md";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";


import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../NotificationsModals/context/NotificationContext";
import NotificationsDropdown from "../NotificationsModals/NotificationsDropdown";
import SavedPostsDropdown from "./SavedPostsDropdown";
import styles from "./NavUserActions.module.css";


// --- COMPONENT PORTAL (GIỮ NGUYÊN) ---
const DropdownPortal = ({ children, coords, onClose }) => {
  const dropdownRef = useRef(null);


  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    function handleScroll() { onClose(); }


    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);


    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [onClose]);


  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed", top: coords.top, left: coords.left,
        zIndex: 999999, width: "300px",
      }}
    >
      {children}
    </div>,
    document.body
  );
};


const NavUserActions = ({ isScrolled, unreadCount, chatUnreadCount }) => {
  const navigate = useNavigate();
  const location = useLocation();


  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showSavedPostsPanel, setShowSavedPostsPanel] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const avatarRef = useRef(null);


  const { user, avatarUrl, logout, getStoredToken } = useContext(AuthContext);
  const { fetchNotifications } = useContext(NotificationContext);


  // --- TÍNH VỊ TRÍ MENU (GIỮ NGUYÊN) ---
  const handleToggleDropdown = () => {
    if (showAccountDropdown) {
      setShowAccountDropdown(false);
      return;
    }
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 10,
        left: rect.right - 300
      });
      setShowAccountDropdown(true);
    }
  };


  // --- KIỂM TRA USER (GIỮ NGUYÊN) ---
  const checkUserInfo = async () => {
    try {
      const token = getStoredToken();
      if (!token || !user?.id) return { valid: false, message: "Phiên đăng nhập hết hạn." };
     
      const response = await axios.get(`http://localhost:5133/api/user/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });


      const serverUser = response.data;
      if (!serverUser.emailConfirmed) return { valid: false, message: "Cần xác minh email." };
     
      let phone = serverUser.phoneNumber ? String(serverUser.phoneNumber).replace(/[^0-9]/g, "").trim() : "";
      if (phone.length !== 10 || !phone.startsWith("0")) return { valid: false, message: "SĐT không hợp lệ." };


      return { valid: true };
    } catch (error) {
      return { valid: false, message: "Lỗi xác thực." };
    }
  };


  const handlePostClick = async () => {
    if (!user) {
      toast.error("⚠️ Vui lòng đăng nhập.");
      navigate("/login");
      return;
    }
    const loadingToast = toast.loading("🔍 Kiểm tra thông tin...");
    try {
      const validation = await checkUserInfo();
      toast.dismiss(loadingToast);
      if (!validation.valid) {
        toast.error(`❌ ${validation.message}`);
        if (validation.message.includes("hết hạn")) { logout(); navigate("/login"); }
        else { navigate("/cai-dat-tai-khoan"); }
        return;
      }
     
      // 🔥 [LOGIC MỚI - TỐI ƯU URL]
      const currentPath = location.pathname.toLowerCase();
     
      // Nếu đường dẫn hiện tại có chứa "do-dien-tu" (Bất kể là ở Market hay đang ở Form đăng tin của nó)
      // Thì luôn luôn ép về trang đăng tin bị khóa của Đồ điện tử
      if (currentPath.includes("do-dien-tu")) {
        navigate("/dang-tin/do-dien-tu");
      } else {
        // Các trường hợp khác (Trang chủ, trang cá nhân...) -> Về trang chọn gốc
        navigate("/dang-tin");
      }


    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("❌ Có lỗi xảy ra.");
    }
  };


  const handleNotifClick = () => {
    setShowSavedPostsPanel(false); // Đóng SavedPosts khi mở Notification
    setShowNotifPanel((prev) => !prev);
    if (!showNotifPanel) { try { fetchNotifications(); } catch (e) {} }
  };

  const handleSavedPostsClick = () => {
    setShowNotifPanel(false); // Đóng Notification khi mở SavedPosts
    setShowSavedPostsPanel((prev) => !prev);
  };


  return (
    // ... HTML GIỮ NGUYÊN KHÔNG ĐỔI ...
    <div className={`${styles.navRight} ${isScrolled ? styles.scrolled : ""}`}>
      {/* Saved Posts - ICON HEART */}
      {user && (
        <div className={styles.iconBtnWrapper}>
          <button className={styles.iconBtn} title="Tin đã lưu" onClick={handleSavedPostsClick}>
            <FaHeart size={18} color={showSavedPostsPanel ? "#e74c3c" : "#666"} />
          </button>
          {showSavedPostsPanel && createPortal(
            <div
              ref={(el) => {
                if (el) {
                  const heartBtn = document.querySelector('[title="Tin đã lưu"]');
                  if (heartBtn) {
                    const rect = heartBtn.getBoundingClientRect();
                    el.style.position = 'fixed';
                    el.style.right = window.innerWidth - rect.right + 'px';
                    el.style.top = rect.bottom + 10 + 'px';
                    el.style.zIndex = '10001';
                  }
                }
              }}
              onMouseLeave={() => setShowSavedPostsPanel(false)}
            >
              <SavedPostsDropdown user={user} onClose={() => setShowSavedPostsPanel(false)} />
            </div>,
            document.body
          )}
        </div>
      )}

      {/* Notifications */}
      <div className={styles.iconBtnWrapper}>
        <button className={styles.iconBtn} title="Thông báo" onClick={handleNotifClick}>
          <FaRegBell size={18} />
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
        {showNotifPanel && createPortal(
          <div
            ref={(el) => {
              if (el) {
                const bellBtn = document.querySelector('[title="Thông báo"]');
                if (bellBtn) {
                  const rect = bellBtn.getBoundingClientRect();
                  el.style.position = 'fixed';
                  el.style.right = window.innerWidth - rect.right + 'px';
                  el.style.top = rect.bottom + 10 + 'px';
                  el.style.zIndex = '10000';
                }
              }
            }}
            onMouseLeave={() => setShowNotifPanel(false)}
          >
            <NotificationsDropdown />
          </div>,
          document.body
        )}
      </div>


      {/* Chat */}
      <button className={styles.iconBtn} title="Tin nhắn" onClick={() => navigate("/chat")}>
        <IoChatbubbleEllipsesOutline size={20} />
        {chatUnreadCount > 0 && <span className={styles.badge}>{chatUnreadCount > 99 ? "99+" : chatUnreadCount}</span>}
      </button>


      {/* Manage Posts */}
      {user && (
        <button className={styles.managePostBtn} onClick={() => navigate("/quan-ly-tin")}>
          <MdTableRows size={18} /> Quản lý tin
        </button>
      )}


      {/* User Section */}
      {user ? (
        <>
          <div className={styles.accountSection} ref={avatarRef} onClick={handleToggleDropdown}>
            <div className={styles.accountInfo}>
              {avatarUrl ? (
                <img src={avatarUrl.startsWith("http") ? avatarUrl : `http://localhost:5133${avatarUrl}`} alt="Avatar" className={styles.avatarImg} />
              ) : (
                <FaUserCircle className={styles.avatarIcon} />
              )}
              <FaChevronDown className={styles.dropdownArrow} />
            </div>
          </div>


          {showAccountDropdown && (
            <DropdownPortal coords={menuCoords} onClose={() => setShowAccountDropdown(false)}>
              <div className={styles.accountDropdown} style={{ display: 'block', padding: '0', overflow: 'hidden' }}>
                <div className={styles.dropdownProfileHeader} style={{ padding: '15px', textAlign: 'center', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl.startsWith("http") ? avatarUrl : `http://localhost:5133${avatarUrl}`}
                        alt="Avatar"
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FaUserCircle size={60} color="#ccc" />
                    )}
                    <div style={{
                      position: 'absolute', bottom: '0', right: '0',
                      background: '#333', color: '#fff', borderRadius: '50%',
                      padding: '4px', fontSize: '10px', cursor: 'pointer'
                    }} onClick={(e) => { e.stopPropagation(); navigate("/cai-dat-tai-khoan"); }}>
                      <FaEdit />
                    </div>
                  </div>
                 
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                    {user.fullName || user.userName || "Người dùng"}
                  </div>
                 
                  <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                    Người theo dõi 0 &nbsp;|&nbsp; Đang theo dõi 0
                  </div>
                </div>


                <div style={{ padding: '10px 0' }}>
                  <div className={styles.dropdownHeader} style={{ paddingLeft: '15px' }}>Tiện ích</div>
                 
                  <div onClick={() => { navigate("/tin-dang-da-luu"); setShowAccountDropdown(false); }} className={styles.dropdownItem}>
                    <FaHeart color="#777" style={{ width: '20px' }} /> Tin đăng đã lưu
                  </div>
                 
                  <div onClick={() => { setShowAccountDropdown(false); }} className={styles.dropdownItem}>
                      <FaRegBell color="#777" style={{ width: '20px' }} /> Tìm kiếm đã lưu
                  </div>


                  <div onClick={() => { navigate("/video-da-tym"); setShowAccountDropdown(false); }} className={styles.dropdownItem}>
                    <FaVideo color="#3b82f6" style={{ width: '20px' }} /> Video đã tym
                  </div>


                  <div onClick={() => { navigate("/binh-luan-cua-toi"); setShowAccountDropdown(false); }} className={styles.dropdownItem}>
                    <FaCommentDots color="#777" style={{ width: '20px' }} /> Đánh giá từ tôi
                  </div>

                  <div onClick={() => { navigate("/view-history"); setShowAccountDropdown(false); }} className={styles.dropdownItem}>
                    <FaHistory color="#777" style={{ width: '20px' }} /> Lịch sử xem
                  </div>
                  
                  <div className={styles.dropdownDivider}></div>
                 
                  <div className={styles.dropdownHeader} style={{ paddingLeft: '15px' }}>Khác</div>
                  <div onClick={() => { navigate("/cai-dat-tai-khoan"); setShowAccountDropdown(false); }} className={styles.dropdownItem}>
                    <FaCog color="#777" style={{ width: '20px' }} /> Cài đặt tài khoản
                  </div>
                  <div onClick={() => { navigate("/gop-y"); setShowAccountDropdown(false); }} className={styles.dropdownItem}>
                    <FaCommentAlt color="#777" style={{ width: '20px' }} /> Trợ giúp / Đóng góp ý kiến
                  </div>
                  <div onClick={() => { logout(); setShowAccountDropdown(false); }} className={styles.dropdownItem} style={{ color: '#ef4444' }}>
                    <FaSignOutAlt style={{ width: '20px' }} /> Đăng xuất
                  </div>
                </div>
              </div>
            </DropdownPortal>
          )}
        </>
      ) : (
        <div className={styles.authBtns}>
          <button className={styles.loginBtn} onClick={() => navigate("/login")}>Đăng Nhập</button>
          <button className={styles.registerBtn} onClick={() => navigate("/register")}>Đăng Ký</button>
        </div>
      )}


      <button className={styles.postBtnHighlight} onClick={handlePostClick}>Đăng tin</button>
    </div>
  );
};


export default NavUserActions;