import React, { useRef, useEffect, useContext, useState, useMemo } from "react";
import {
  FiSearch,
  FiBell,
  FiHome,
  FiCompass,
  FiUpload,
  FiMessageSquare,
  FiMoreHorizontal,
  FiUsers,
  FiLogIn,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import VideoSearchOverlay from "./VideoSearchOverlay";
import MorePanel from "./MorePanel";
import NotificationDropdown from "./NotificationDropdown";
import SmartFollowingList from "./SmartFollowingList";
import "./TopNavbarUniMarket.css";
import { GlobalNotificationContext } from "../context/GlobalNotificationContext";
import { VideoContext } from "../context/VideoContext";
import { AuthContext } from "../context/AuthContext";
import defaultAvatar from "../assets/default-avatar.png";


export default function TopNavbarUniMarket() {
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, setActiveTab, triggerReload } = useContext(VideoContext);
   
  // Lấy user từ AuthContext
  const { user } = useContext(AuthContext);


  const { unreadCount, fetchNotifications } = useContext(GlobalNotificationContext);
  const isChatRoute = location.pathname.startsWith("/chat");
  const [isMini, setIsMini] = useState(isChatRoute);
   
  // Danh sách các tab sẽ mở Panel bên cạnh
  const PANEL_TABS_SET = useMemo(() => new Set(["search", "upload", "activity", "more"]), []);


  // ==========================================================
  // [LOGIC MỚI] LẤY TỪ KHÓA TỪ URL ĐỂ HIỂN THỊ TRÊN NÚT
  // ==========================================================
  const getSearchLabel = () => {
    if (location.pathname.startsWith("/search/")) {
      try {
        const parts = location.pathname.split("/");
        if (parts[2]) {
          return decodeURIComponent(parts[2]);
        }
      } catch (e) {
        return "Search";
      }
    }
    return "Search";
  };
   
  const searchLabel = getSearchLabel();


  // ==========================================================
  // EFFECT: XỬ LÝ MINI SIDEBAR
  // ==========================================================
  useEffect(() => {
    const TABS_NEED_MINI = ["search", "activity", "messages", "more", "upload"];
   
    if (TABS_NEED_MINI.includes(activeTab)) {
        setIsMini(true);
    } else {
        setIsMini(isChatRoute);
    }
  }, [isChatRoute, activeTab]);


  const getAvatarSrc = (url) => {
    if (!url) return defaultAvatar;
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };


  const isPanelOpen = PANEL_TABS_SET.has(activeTab);
  const shouldHideFollowingList = isPanelOpen || activeTab === "messages" || isChatRoute;


  // ==========================================================
  // LOGIC ĐỒNG BỘ URL VỚI ACTIVE TAB (ĐÃ SỬA VÀ BỔ SUNG)
  // ==========================================================
  useEffect(() => {
    const path = location.pathname;
    const floatingTabs = new Set([
      ...PANEL_TABS_SET,
      "messages",
      "profile",
      "following",
    ]);


    // 1. Nếu đang ở trang Video chi tiết (VideoDetailViewer - Logic cũ của bạn)
    // Giả định: Trang Feed chính có đường dẫn bắt đầu bằng /video/
    if (path.startsWith("/video/")) {
      if (!floatingTabs.has(activeTab) && activeTab !== "forYou") {
        setActiveTab("forYou");
      }
    }
    // 2. Nếu đang ở trang Explore (Logic cũ)
    else if (path === "/explore") {
      if (activeTab !== "explore" && !PANEL_TABS_SET.has(activeTab)) {
        setActiveTab("explore");
      }
    }
    // 3. Logic cho trang chủ mặc định (Market/Home) cũng coi là For You
    else if (path === "/" || path === "/market") {
       if (!floatingTabs.has(activeTab) && activeTab !== "forYou") {
         setActiveTab("forYou");
       }
    }
    // 4. [FIX MỚI] CÁC TRƯỜNG HỢP KHÁC (VideoStandalone, v.v...)
    // Nếu không phải các trang trên, cần tắt màu vàng (set activeTab = null)
    else {
      // Chỉ reset nếu tab hiện tại KHÔNG PHẢI là các tab floating (Search, Noti, Message...)
      // và cũng không phải đang ở trong trang Chat (vì Chat tự xử lý activeTab="messages")
      if (!floatingTabs.has(activeTab) && !path.startsWith("/chat")) {
         setActiveTab(null);
      }
    }
  }, [location.pathname, activeTab, setActiveTab, PANEL_TABS_SET]);


  // ==========================================================
  // TOGGLE TAB (XỬ LÝ CLICK)
  // ==========================================================
  const toggleTab = (tab) => {
    // Nếu click lại tab đang active (trừ forYou/explore reload)
    if (activeTab === tab && tab !== "forYou" && tab !== "explore") {
      setActiveTab(null);
      setIsMini(location.pathname.startsWith("/chat"));
      return;
    }


    // --- CASE 1: FOR YOU ---
    if (tab === "forYou") {
      setActiveTab("forYou");
      triggerReload();
      if (!location.pathname.startsWith("/video/")) {
        navigate("/video/1"); // Hoặc trang chủ tùy logic
      }
      setIsMini(false);
      return;
    }


    // --- CASE 2: EXPLORE ---
    if (tab === "explore") {
      setActiveTab("explore");
      navigate("/explore"); // Chuyển hướng sang trang ExplorePage
      setIsMini(false); // Mở rộng sidebar
      return;
    }


    // --- CASE 3: CÁC TAB KHÁC (PANEL/SIDEBAR) ---
    setActiveTab(tab);
     
    // Check lại logic mini sidebar khi click
    const TABS_NEED_MINI = ["search", "activity", "messages", "more", "upload"];
    if (TABS_NEED_MINI.includes(tab)) {
        setIsMini(true);
    } else {
        setIsMini(location.pathname.startsWith("/chat"));
    }


    if (tab === 'activity') {
      try { fetchNotifications(); } catch (e) { console.warn(e); }
    }
  };


  // ==========================================================
  // XỬ LÝ TAB MESSAGE KHI Ở TRANG CHAT
  // ==========================================================
  useEffect(() => {
    if (location.pathname.startsWith("/chat")) {
      const allowedPanels = ["search", "activity", "more", "upload"];
      if (!allowedPanels.includes(activeTab) && activeTab !== "messages") {
        setActiveTab("messages");
      }
    } else if (activeTab === "messages") {
      setActiveTab(null);
    }
  }, [location.pathname, activeTab, setActiveTab]);


  const handleChatClick = () => {
    navigate("/chat");
    setActiveTab("messages");
    setIsMini(true);
  };


  // ==========================================================
  // CLICK OUTSIDE TO CLOSE PANEL
  // ==========================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      const nav = navRef.current;
      const panel = panelRef.current;


      const clickedOutsideNav = nav && !nav.contains(e.target);
      const clickedOutsidePanel = !panel || !panel.contains(e.target);
      if (clickedOutsideNav && clickedOutsidePanel) {
        if (isChatRoute && !PANEL_TABS_SET.has(activeTab)) return;
         
        if (PANEL_TABS_SET.has(activeTab)) {
          setActiveTab(null);
          // Khi đóng panel, nếu đang ở explore thì mở rộng sidebar ra lại (nếu ko phải chat)
          if (location.pathname === "/explore") {
             setIsMini(false);
          } else {
             setIsMini(location.pathname.startsWith("/chat"));
          }
        }
      }
    };


    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTab, isChatRoute, PANEL_TABS_SET, setActiveTab, location.pathname]);


  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="um-tn-root">
      <nav
        className={`um-tn-navbar ${isMini ? "collapsed" : ""}`}
        ref={navRef}
      >
        <div className="um-tn-fixed-section">
            <div
            className="um-tn-logo"
            onClick={() => {
                setActiveTab("forYou");
                triggerReload();
                navigate("/market");
                setIsMini(false);
            }}
            style={{ cursor: "pointer" }}
            >
                {isMini ? (
                    <div className="um-tn-logo-u">U</div>
                ) : (
                    <img src="/logoWeb.png" alt="Logo" className="um-tn-logo-img" />
                )}
            </div>


            {/* --- NÚT SEARCH --- */}
            <button
                className={`um-tn-icon-btn search-btn ${
                    activeTab === "search" ? "active" : ""
                }`}
                onClick={() => toggleTab("search")}
                title={searchLabel}
            >
                <FiSearch size={24} />
                {!isMini && (
                    <span className="um-tn-search-text">
                        {searchLabel}
                    </span>
                )}
            </button>
        </div>


        {/* === PHẦN 2: CUỘN (MENU ICONS + FOLLOWING + FOOTER) === */}
        <div className="um-tn-scroll-section custom-scrollbar">
            <div className="um-tn-icons">
                <button
                    className={`um-tn-icon-btn ${activeTab === "forYou" ? "active" : ""}`}
                    onClick={() => toggleTab("forYou")}
                >
                    <FiHome size={24} />
                    {!isMini && <span>For You</span>}
                </button>


                {/* --- NÚT EXPLORE --- */}
                <button
                    className={`um-tn-icon-btn ${activeTab === "explore" ? "active" : ""}`}
                    onClick={() => toggleTab("explore")}
                >
                    <FiCompass size={24} />
                    {!isMini && <span>Explore</span>}
                </button>


                <button
                    className={`um-tn-icon-btn ${activeTab === "following" ? "active" : ""}`}
                    onClick={() => toggleTab("following")}
                >
                    <FiUsers size={24} />
                    {!isMini && <span>Friends</span>}
                </button>


                <button
                    className={`um-tn-icon-btn ${activeTab === "upload" ? "active" : ""}`}
                    onClick={() => toggleTab("upload")}
                >
                    <FiUpload size={24} />
                    {!isMini && <span>Upload</span>}
                </button>


                {/* ✅ CHỈ HIỆN THÔNG BÁO (ACTIVITY) KHI ĐÃ ĐĂNG NHẬP */}
                {user && (
                    <button
                        className={`um-tn-icon-btn ${activeTab === "activity" ? "active" : ""}`}
                        onClick={() => toggleTab("activity")}
                    >
                        <div className="um-tn-icon-wrapper">
                            <FiBell size={24} />
                            {unreadCount > 0 && (
                                <span className="um-tn-badge">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </div>
                        {!isMini && <span>Activity</span>}
                    </button>
                )}


                {/* ✅ CHỈ HIỆN TIN NHẮN (MESSAGES) KHI ĐÃ ĐĂNG NHẬP */}
                {user && (
                    <button
                        className={`um-tn-icon-btn ${activeTab === "messages" ? "active" : ""}`}
                        onClick={handleChatClick}
                    >
                        <FiMessageSquare size={24} />
                        {!isMini && <span>Messages</span>}
                    </button>
                )}


                {/* LOGIC HIỂN THỊ AVATAR HOẶC LOGIN */}
                {user ? (
                    <button
                        className={`um-tn-icon-btn ${activeTab === "profile" ? "active" : ""}`}
                        onClick={() => {
                            if (user?.id) {
                                setActiveTab("profile");
                                navigate(`/nguoi-dung/${user.id}`);
                            }
                        }}
                    >
                        <img
                            src={getAvatarSrc(user.profilePicture || user.avatarUrl)}
                            alt="avatar"
                            className="um-tn-avatar"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = defaultAvatar;
                            }}
                        />
                        {!isMini && <span>Profile</span>}
                    </button>
                ) : (
                    <button
                        className="um-tn-icon-btn"
                        onClick={() => {
                            navigate("/login");
                            setActiveTab(null);
                        }}
                    >
                        <FiLogIn size={24} />
                        {!isMini && <span>Log in</span>}
                    </button>
                )}


                <button
                    className={`um-tn-icon-btn ${activeTab === "more" ? "active" : ""}`}
                    onClick={() => toggleTab("more")}
                >
                    <FiMoreHorizontal size={24} />
                    {!isMini && <span>Thêm</span>}
                </button>
            </div>


            {!shouldHideFollowingList && (
                <>
                    {/* ✅ CHỈ HIỆN DANH SÁCH FOLLOW NẾU ĐÃ ĐĂNG NHẬP */}
                    {user && (
                        <div className={`um-tn-following-section ${isMini ? "mini" : ""}`}>
                            <SmartFollowingList isMini={isMini} />
                        </div>
                    )}


                    {/* FOOTER */}
                    {!isMini && (
                        <div className="um-tn-footer">
                            <a href="#" className="um-tn-footer-link">Công ty</a>
                            <a href="#" className="um-tn-footer-link">Chương trình</a>
                            <a href="#" className="um-tn-footer-link">Điều khoản và chính sách</a>
                            <span className="um-tn-copyright">© 2025 UniMarket</span>
                        </div>
                    )}
                </>
            )}
        </div>
      </nav>


      {/* PANEL WRAPPER */}
      <div
        className={`um-tn-panel-wrapper ${isPanelOpen ? "open" : ""}`}
        aria-hidden={isPanelOpen ? "false" : "true"}
      >
        {activeTab === "search" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <VideoSearchOverlay
              isOpen={activeTab === "search"}
              onClose={() => {
                  setActiveTab(null);
                  if (location.pathname === "/explore") setIsMini(false); // Mở lại nếu ở explore
                  else setIsMini(location.pathname.startsWith("/chat"));
              }}
            />
          </div>
        )}


        {activeTab === "activity" && user && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <NotificationDropdown />
          </div>
        )}


        {activeTab === "upload" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Upload Video</h3>
            <p>Form upload sẽ ở đây</p>
          </div>
        )}


        {activeTab === "messages" && user && !isChatRoute && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <h3>Tin nhắn</h3>
            <p>Danh sách tin nhắn</p>
          </div>
        )}


        {activeTab === "more" && (
          <div className="um-tn-tab-content" ref={panelRef}>
            <MorePanel onClose={() => {
                setActiveTab(null);
                if (location.pathname === "/explore") setIsMini(false); // Mở lại nếu ở explore
                else setIsMini(location.pathname.startsWith("/chat"));
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

