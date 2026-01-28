// src/components/TopNavbar/NhaTroTopNavbar.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import * as signalR from "@microsoft/signalr";

import SearchBar from "../SearchBar";
import NavCategories from "./NavCategories";
import NavUserActions from "./NavUserActions";

import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../NotificationsModals/context/NotificationContext";
import { CategoryContext } from "../../context/CategoryContext";

import styles from "./NhaTroTopNavbar.module.css";
import phongTroBanner from "../../assets/phong_tro_banner.jpg";

// ✅ Component TopNavbar riêng cho trang Nhà Trọ
const NhaTroTopNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isHomePage = location.pathname === "/market/nha-tro";
  const [scrolled, setScrolled] = useState(!isHomePage);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const connectionRef = useRef(null);

  const { user, getStoredToken } = useContext(AuthContext);
  const { unreadCount: notifUnread } = useContext(NotificationContext);
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);

  const HERO_SCROLL_EXIT = 180;
  const HERO_SCROLL_ENTER = 150;

  // Xác định ảnh banner
  const getBannerImage = () => {
    return phongTroBanner;
  };

  // Xác định background: Nếu là HomePage và chưa cuộn thì hiện ảnh, còn lại là none
  const bgStyle = (isHomePage && !scrolled)
    ? { backgroundImage: `url(${getBannerImage()})` }
    : { backgroundImage: "none" };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Add logic if needed
    };

    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => {
        if (y >= HERO_SCROLL_EXIT && !prev) return true;
        if (y <= HERO_SCROLL_ENTER && prev) return false;
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch chat unread count
  const getHiddenAndDeletedChatIds = async () => {
    try {
      if (!user?.id) return [];
      const response = await fetch(`http://localhost:5133/api/chat/user-chat-states/${user.id}`);
      const chatStates = await response.json();
      return chatStates.filter(cs => cs.isHidden || cs.isDeleted).map(cs => cs.chatId);
    } catch (error) {
      console.error("Lỗi lấy danh sách chat ẩn:", error);
      return [];
    }
  };

  const fetchChatUnreadCount = async () => {
    if (!user) return;
    try {
      const hiddenChatIds = await getHiddenAndDeletedChatIds();
      const params = new URLSearchParams();
      hiddenChatIds.forEach(id => params.append("hiddenChatIds", id));

      const res = await axios.get(
        `http://localhost:5133/api/chat/unread-count/${user.id}?${params.toString()}`
      );
      setChatUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Lỗi lấy số tin nhắn chưa đọc:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      setChatUnreadCount(0);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    fetchChatUnreadCount();
    window.addEventListener("refreshChatList", fetchChatUnreadCount);

    const token = getStoredToken ? getStoredToken() : localStorage.getItem("token");
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5133/hub/chat", { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection
      .start()
      .then(() => {
        connection.invoke("ThamGiaCuocTroChuyen", `user-${user.id}`);
        connection.on("CapNhatTrangThaiTinNhan", fetchChatUnreadCount);
        connection.on("CapNhatCuocTroChuyen", async (chat) => {
          try {
            const hiddenChatIds = await getHiddenAndDeletedChatIds();
            const chatId = chat.maCuocTroChuyen || chat.MaCuocTroChuyen;
            if (!hiddenChatIds.includes(chatId)) {
              fetchChatUnreadCount();
            }
          } catch (err) {
            fetchChatUnreadCount();
          }
        });
      })
      .catch((err) => console.error("SignalR connect error:", err));

    return () => {
      window.removeEventListener("refreshChatList", fetchChatUnreadCount);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [user]);

  // Reset category khi đổi trang
  useEffect(() => {
    if (location.pathname !== "/market/nha-tro") {
      setSelectedCategory("");
      setSelectedSubCategory("");
    }
  }, [location.pathname, setSelectedCategory, setSelectedSubCategory]);

  const isActiveLink = (pathname) => {
    if (pathname === "unimarket") {
      return location.pathname === "/market/nha-tro";
    }
    return location.pathname === pathname;
  };

  return (
    <header
      className={`${styles.topNavbar} ${scrolled ? styles.scrolled : ""}`}
      style={bgStyle}
    >
      {/* Bên trái */}
      <NavCategories isScrolled={scrolled} />

      {/* Ở giữa */}
      <div className={styles.centerSection}>
        {(isHomePage && !scrolled) ? (
          <div className={styles.bannerTextContainer}>
            <div className={styles.topLinks}>
              <span 
                className={`${styles.topLink} ${isActiveLink("unimarket") ? styles.active : ""}`}
                onClick={() => navigate("/market")}
              >
                Unimarket
              </span>
              <span 
                className={`${styles.topLink} ${isActiveLink("/market/do-dien-tu") ? styles.active : ""}`}
                onClick={() => navigate("/market/do-dien-tu")}
              >
                Đồ điện tử
              </span>
              <span 
                className={`${styles.topLink} ${isActiveLink("/market/nha-tro") ? styles.active : ""}`}
                onClick={() => navigate("/market/nha-tro")}
              >
                Nhà trọ
              </span>
              <span className={styles.topLink}>Xe cộ</span>
              <span className={styles.topLink}>Việc làm</span>
            </div>
            <h1 className={styles.mainSlogan}>Nhà vừa ý, giá hợp lý!</h1>
          </div>
        ) : (
          <div className={styles.navSearchContainer}>
            <SearchBar />
          </div>
        )}
      </div>

      {/* Bên phải */}
      <NavUserActions
        isScrolled={scrolled}
        unreadCount={notifUnread}
        chatUnreadCount={chatUnreadCount}
      />
    </header>
  );
};

export default NhaTroTopNavbar;
