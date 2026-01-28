import React, { useState, useEffect, useRef } from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedin,
  FaWhatsapp,
  FaLink,
  FaSearch,
  FaPaperPlane, // ✅ Icon gửi
  FaCheckCircle, // ✅ Icon check
} from "react-icons/fa";
import { SiZalo, SiTelegram } from "react-icons/si";
import axios from "axios";
import "./SharePanel.css";

const SharePanel = ({
  isOpen,
  onClose,
  tinDangId,
  displayMode = "Image",
  index = 0,
  previewTitle,
  previewImage,
  previewVideo,
  disableBodyScrollLock = false,
  onShareSuccess, // 👈 Nhận prop mới này (từ code 2)
}) => {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]); // ✅ dùng mảng
  const savedScrollY = useRef(0);
  const [showSearch, setShowSearch] = useState(false);
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const scrollRef = useRef(null);
  const friendScrollRef = useRef(null);

  const [canScrollFriends, setCanScrollFriends] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setShareData(null);
      setSelectedFriends([]);
    }
  }, [isOpen, tinDangId, index]);

  // ✅ CẬP NHẬT LOGIC KHÓA SCROLL
  useEffect(() => {
    if (!isOpen || disableBodyScrollLock) return;

    const originalOverflow = document.body.style.overflow;
    if (originalOverflow !== "hidden") {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, disableBodyScrollLock]);

  // ✅ Giữ nguyên logic fetch bạn bè
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchFriends();
    }
  }, [isOpen, isLoggedIn]);

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const res = await axios.get(
        "http://localhost:5133/api/SocialShare/friends/list",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const raw = res.data || [];
      const mapped = raw.map((u) => ({
        id: u.Id ?? u.id,
        fullName: u.FullName ?? u.fullName,
        avatarUrl: u.AvatarUrl ?? u.avatarUrl,
        isFollowing: u.IsFollowing ?? u.isFollowing ?? false,
        isFollower: u.IsFollower ?? u.isFollower ?? false,
      }));
      setFriends(mapped);
    } catch (err) {
      console.error("Lỗi lấy danh sách bạn bè:", err);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  // ✅ Toggle chọn bạn bè
  const handleToggleFriend = (friend) => {
    setSelectedFriends((prevSelected) => {
      const isSelected = prevSelected.some((f) => f.id === friend.id);
      if (isSelected) {
        return prevSelected.filter((f) => f.id !== friend.id);
      } else {
        return [...prevSelected, friend];
      }
    });
  };

  // ✅ Gửi cho danh sách bạn bè
  const handleShareToFriend = async () => {
    if (selectedFriends.length === 0)
      return alert("Vui lòng chọn ít nhất 1 người bạn để gửi.");

    try {
      const payload = {
        TargetUserIds: selectedFriends.map((f) => f.id),
        TinDangId: tinDangId || null,
        PreviewTitle: previewTitle || "Một tin đăng thú vị",
        PreviewImage: previewImage || null,
        PreviewVideo: previewVideo || null,
        ExtraText: "đã gửi 1 video",
        ChatType: 2,
        DisplayMode: displayMode === "Video" ? 2 : 1,
      };

      const res = await axios.post(
        "http://localhost:5133/api/SocialShare/share-to-friends",
        payload,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data?.success) {
        if (res.data.created && res.data.created.length > 0) {
          alert("✅ Đã gửi thành công!");
        } else {
          alert("Không thể gửi: Người dùng bạn chọn có thể đã bị chặn.");
        }
        setSelectedFriends([]);

        // 👇 GỌI CALLBACK KHI THÀNH CÔNG (từ code 2) 👇
        if (onShareSuccess) {
          onShareSuccess();
        }
      } else {
        alert("Không gửi được: " + (res.data?.message ?? JSON.stringify(res.data)));
      }
    } catch (err) {
      console.error("Lỗi share qua chat:", err.response?.data ?? err.message);
      const errorMessage = err.response?.data?.message || err.message;
      alert(`❌ Lỗi gửi: ${errorMessage}`);
    }
  };

  // --- Logic chia sẻ MXH ---
  const BASE_URL = "http://localhost:5133/api/Share";

  const fetchShareLink = async (platform = "Copy") => {
    setLoading(true);
    try {
      const payload = {
        TinDangId: tinDangId,
        Platform: platform,
        DisplayMode: displayMode,
        Index: index,
      };
      const res = await axios.post(`${BASE_URL}/social`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setShareData(res.data);
      return res.data.shareLink;
    } catch (err) {
      console.error("Lỗi API:", err.response?.data || err.message);
      alert("❌ Lấy link share thất bại!");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = async (platform) => {
    const link = await fetchShareLink(platform);
    if (!link) return;

    let shareUrl = "";
    switch (platform) {
      case "Facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case "Twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}`;
        break;
      case "Zalo":
        shareUrl = `https://zalo.me/share/?url=${encodeURIComponent(link)}`;
        break;
      case "LinkedIn":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
        break;
      case "WhatsApp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(link)}`;
        break;
      case "Telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}`;
        break;
      default:
        // Mặc định hoặc trường hợp khác (mặc dù đã xử lý Copy riêng)
        return; 
    }
    window.open(shareUrl, "_blank");

    // 👇 Gọi callback sau khi mở cửa sổ chia sẻ MXH (từ code 2) 👇
    if (onShareSuccess) {
      onShareSuccess();
    }
  };

  const handleCopyLink = async () => {
    if (!shareData) await fetchShareLink();
    const link =
      shareData?.shareLink ||
      `${window.location.origin}/video/${tinDangId}?index=${index}`;
    navigator.clipboard.writeText(link);
    alert("✅ Link đã copy!");
  };

  // Cuộn icon MXH
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = 120;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Cuộn danh sách bạn bè
  const scrollFriends = (dir) => {
    if (!friendScrollRef.current) return;
    const amount = 200;
    friendScrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  // Kiểm tra overflow
  useEffect(() => {
    const checkScroll = () => {
      const el = friendScrollRef.current;
      if (el) {
        const hasOverflow = el.scrollWidth > el.clientWidth;
        setCanScrollFriends(hasOverflow);
        const atLeft = el.scrollLeft <= 0;
        const atRight = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
        setCanScrollLeft(!atLeft);
        setCanScrollRight(!atRight);
      } else {
        setCanScrollFriends(false);
        setCanScrollLeft(false);
        setCanScrollRight(false);
      }
    };

    const timer = setTimeout(checkScroll, 100);
    const el = friendScrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      clearTimeout(timer);
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [friends, loadingFriends, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="share-panel-overlay" onClick={onClose}>
      <div className="share-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="share-title">Chia sẻ</h3>

        {/* Danh sách bạn bè */}
        {isLoggedIn && (
          <div className="friend-list">
            <div className="search-toggle">
              {!showSearch ? (
                <FaSearch
                  className="search-icon"
                  onClick={() => setShowSearch(true)}
                  style={{ cursor: "pointer", fontSize: "25px" }}
                />
              ) : (
                <input
                  type="text"
                  autoFocus
                  placeholder="Tìm bạn bè..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => {
                    if (search.trim() === "") setShowSearch(false);
                  }}
                  className="search-input"
                />
              )}
            </div>

            <div className="friend-scroll-wrapper">
              {canScrollFriends && (
                <>
                  <button
                    className={`friend-arrow-btn left ${!canScrollLeft ? "disabled" : ""}`}
                    onClick={() => scrollFriends("left")}
                    disabled={!canScrollLeft}
                  >
                    &#8249;
                  </button>
                  <button
                    className={`friend-arrow-btn right ${!canScrollRight ? "disabled" : ""}`}
                    onClick={() => scrollFriends("right")}
                    disabled={!canScrollRight}
                  >
                    &#8250;
                  </button>
                </>
              )}

              {loadingFriends ? (
                <p style={{ textAlign: "center", margin: "20px 0" }}>
                  ⏳ Đang tải bạn bè...
                </p>
              ) : (
                <div className="friend-scroll" ref={friendScrollRef}>
                  {(search.trim() === ""
                    ? friends
                    : friends.filter((f) =>
                        (f?.fullName || f?.name || "")
                          .toLowerCase()
                          .includes(search.toLowerCase())
                      )
                  ).map((friend) => {
                    const isSelected = selectedFriends.some(
                      (f) => f.id === friend.id
                    );
                    return (
                      <div
                        key={friend.id}
                        className={`friend-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleToggleFriend(friend)}
                      >
                        <img
                          src={friend.avatarUrl || "/default-avatar.png"}
                          alt={friend.fullName || friend.name}
                          className="friend-avatar"
                        />
                        <div className="friend-name">
                          {friend.fullName || friend.name}
                        </div>
                        {isSelected && (
                          <span className="checkmark">
                            <FaCheckCircle />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nút gửi hoặc chia sẻ */}
        {selectedFriends.length > 0 ? (
          <div className="send-section icon-only">
            <button
              className="send-btn professional icon-only"
              onClick={handleShareToFriend}
              aria-label="Gửi"
            >
              <FaPaperPlane className="send-icon" />
            </button>
          </div>
        ) : (
          <div className="share-options-wrapper">
            <button className="arrow-btn left" onClick={() => scroll("left")}>
              &#8249;
            </button>
            <div className="share-options" ref={scrollRef}>
              <button
                className="share-circle facebook"
                onClick={() => handleShareClick("Facebook")}
                disabled={loading}
              >
                <FaFacebookF size={20} />
                <span>Facebook</span>
              </button>
              <button
                className="share-circle twitter"
                onClick={() => handleShareClick("Twitter")}
                disabled={loading}
              >
                <FaTwitter size={20} />
                <span>Twitter</span>
              </button>
              <button
                className="share-circle zalo"
                onClick={() => handleShareClick("Zalo")}
                disabled={loading}
              >
                <SiZalo size={20} />
                <span>Zalo</span>
              </button>
              <button
                className="share-circle linkedin"
                onClick={() => handleShareClick("LinkedIn")}
                disabled={loading}
              >
                <FaLinkedin size={20} />
                <span>LinkedIn</span>
              </button>
              <button
                className="share-circle whatsapp"
                onClick={() => handleShareClick("WhatsApp")}
                disabled={loading}
              >
                <FaWhatsapp size={20} />
                <span>WhatsApp</span>
              </button>
              <button
                className="share-circle telegram"
                onClick={() => handleShareClick("Telegram")}
                disabled={loading}
              >
                <SiTelegram size={20} />
                <span>Telegram</span>
              </button>
              <button
                className="share-circle copy"
                onClick={handleCopyLink}
                disabled={loading}
              >
                <FaLink size={20} />
                <span>Copy</span>
              </button>
            </div>
            <button className="arrow-btn right" onClick={() => scroll("right")}>
              &#8250;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharePanel;