import React, { useEffect, useState, useContext } from "react";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { 
  FaUser, 
  FaSearch, 
  FaRegClock, 
  FaCheck, 
  FaTimes, 
  FaEdit, 
  FaTrash,
  FaRegHandshake,
  FaRegThumbsDown
} from 'react-icons/fa';
import { HiOutlineEmojiHappy } from 'react-icons/hi';
import "./QuanLyTin.css";
import TopNavbar from "./TopNavbar/TopNavbar";
import { NotificationContext } from "./NotificationsModals/context/NotificationContext";

const trangThaiMap = {
  0: "ChoDuyet",
  1: "DaDuyet",
  2: "TuChoi",
};

const QuanLyTin = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [posts, setPosts] = useState([]);
  const [userName, setUserName] = useState(sessionStorage.getItem("userFullName") || "Người dùng");
  const [userAvatar, setUserAvatar] = useState(sessionStorage.getItem("userAvatar") || "");
  
  // Sử dụng useSearchParams để quản lý state trong URL
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Lấy giá trị từ URL parameters hoặc sử dụng giá trị mặc định
  const activeTab = searchParams.get('tab') || 'DaDuyet';
  const searchKeyword = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  
  const postsPerPage = 5;
  const userId = sessionStorage.getItem("userId");

  // Hàm helper để update URL parameters
  const updateURLParams = (newParams) => {
    const updatedParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        updatedParams.set(key, value);
      } else {
        updatedParams.delete(key);
      }
    });
    setSearchParams(updatedParams);
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get(`http://localhost:5133/api/TinDang/user-info/${userId}`);
        sessionStorage.setItem("userFullName", res.data.fullName);
        setUserName(res.data.fullName);
        if (res.data.avatar) {
          sessionStorage.setItem("userAvatar", res.data.avatar);
          setUserAvatar(res.data.avatar);
        } else {
          sessionStorage.removeItem("userAvatar");
          setUserAvatar("");
        }
      } catch (err) {
        console.error("Không thể lấy thông tin người dùng:", err);
      }
    };

    if (userId && (!sessionStorage.getItem("userFullName") || !sessionStorage.getItem("userAvatar"))) {
      fetchUserInfo();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5133/api/TinDang/user/${userId}`)
      .then((response) => {
        const postsWithEnum = response.data.map((post) => ({
          ...post,
          trangThaiText: trangThaiMap[post.trangThai],
          images: Array.isArray(post.images)
            ? post.images.map(img =>
                img.startsWith("http")
                  ? img
                  : img.startsWith("/")
                    ? `http://localhost:5133${img}`
                    : `http://localhost:5133/images/Posts/${img}`
              )
            : [],
        }));
        setPosts(postsWithEnum);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy tin đăng:", error);
      });
  }, [userId]);

  let filteredPosts = posts.filter(
    (p) =>
      p.trangThaiText === activeTab &&
      (p.tieuDe?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.moTa?.toLowerCase().includes(searchKeyword.toLowerCase())
   ) );

  // Nếu tab là DaDuyet thì sắp xếp tin mới nhất lên đầu (xuất hiện ở sau cùng)
  if (activeTab === "DaDuyet") {
    filteredPosts = filteredPosts.sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang));
  }

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // Các hàm xử lý sự kiện được cập nhật để lưu vào URL
  const handleTabChange = (newTab) => {
    updateURLParams({ 
      tab: newTab, 
      page: '1', // Reset về trang 1 khi đổi tab
      search: searchKeyword || undefined 
    });
  };

  const handleSearchChange = (newSearch) => {
    updateURLParams({ 
      tab: activeTab, 
      search: newSearch || undefined,
      page: '1' // Reset về trang 1 khi tìm kiếm
    });
    if (newSearch.length > 0) {
      const lowerSearch = newSearch.toLowerCase();
      const titles = posts.map(p => p.tieuDe).filter(Boolean);
      const filtered = titles.filter(title => title.toLowerCase().includes(lowerSearch));
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handlePageChange = (newPage) => {
    updateURLParams({ 
      tab: activeTab, 
      search: searchKeyword || undefined,
      page: newPage.toString() 
    });
  };

  const handleUpdate = (postId) => {
    // Lưu trạng thái hiện tại vào localStorage trước khi navigate
    const currentState = {
      tab: activeTab,
      search: searchKeyword,
      page: currentPage
    };
    localStorage.setItem('quan-ly-tin-state', JSON.stringify(currentState));
    
    navigate(`/cap-nhat-tin/${postId}`);
  };

  const handleDelete = (postId) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa tin đăng này?");
    if (confirmDelete) {
      axios
        .delete(`http://localhost:5133/api/TinDang/${postId}`)
        .then(() => {
          // remove from local list
          const removed = posts.find((p) => String(p.maTinDang) === String(postId));
          setPosts(posts.filter((post) => post.maTinDang !== postId));
          // If the current user is the owner of the post (they deleted their own post),
          // add a local notification so it shows up in the bell icon immediately.
          try {
            const ownerId = removed?.maNguoiBan || removed?.maNguoiDang || removed?.ownerId || null;
            const me = sessionStorage.getItem("userId");
            if (ownerId && String(ownerId) === String(me)) {
              // Use NotificationContext if available
              try { addLocalNotification({ title: 'Tin đăng đã xóa', message: 'Tin đăng của bạn đã được xóa.', url: '/' }); } catch (e) {}
            }
          } catch (e) { /* ignore */ }
        })
        .catch((error) => {
          console.error("Lỗi khi xóa tin đăng:", error);
          alert("Xóa tin thất bại! Vui lòng thử lại.");
        });
    }
  };

  // Khôi phục trạng thái từ localStorage khi component mount
  useEffect(() => {
    const savedState = localStorage.getItem('quan-ly-tin-state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        updateURLParams(parsedState);
        localStorage.removeItem('quan-ly-tin-state'); // Xóa sau khi sử dụng
      } catch (error) {
        console.error('Error parsing saved state:', error);
      }
    }
  }, []);

  return (
    <div className="qlt-wrapper">
      <TopNavbar />
      <div className="qlt-header-bar">
        <div className="qlt-user-info">
          <span className="qlt-user-avatar">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="avatar"
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <FaUser size={18} />
            )}
          </span>
          <h2>
            Xin chào, <strong>{userName}</strong> <HiOutlineEmojiHappy className="wave-icon" />
          </h2>
        </div>
        <div className="qlt-search-wrapper" style={{ position: "relative" }}>
          <FaSearch className="qlt-search-icon" />
          <input
            type="text"
            placeholder="Tìm tin đăng của bạn..."
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="qlt-search"
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul style={{
              position: "absolute",
              top: "110%",
              left: 0,
              width: "120%",
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 10,
              listStyle: "none",
              margin: 0,
              padding: "4px 0"
            }}>
              {suggestions.map((s, idx) => (
                <li
                  key={idx}
                  style={{ display: "flex", alignItems: "center", padding: "8px 16px", cursor: "pointer", gap: "8px" }}
                  onMouseDown={() => {
                    handleSearchChange(s);
                    setShowSuggestions(false);
                  }}
                >
                  <FaSearch style={{ color: "#888", minWidth: 20, minHeight: 20, width: 20, height: 20, display: "inline-block", verticalAlign: "middle" }} />
                  <span className="suggestion-title">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="qlt-tabs">
        <button
          className={`qlt-tab-btn ${activeTab === "DaDuyet" ? "active" : ""}`}
          onClick={() => handleTabChange("DaDuyet")}
        >
          <FaCheck className="tab-icon" /> Đang hiển thị
        </button>
        <button
          className={`qlt-tab-btn ${activeTab === "ChoDuyet" ? "active" : ""}`}
          onClick={() => handleTabChange("ChoDuyet")}
        >
          <FaRegClock className="tab-icon" /> Chờ duyệt
        </button>
        <button
          className={`qlt-tab-btn ${activeTab === "TuChoi" ? "active" : ""}`}
          onClick={() => handleTabChange("TuChoi")}
        >
          <FaTimes className="tab-icon" /> Bị từ chối
        </button>
      </div>

      <div className="qlt-post-list">
        {currentPosts.length === 0 ? (
          <div className="qlt-empty-state" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
            <img src="/images/empty-post.png" alt="Không tìm thấy tin đăng" style={{ width: 420, marginBottom: 20 }} />
            <h3 style={{ color: '#222', marginBottom: 8 }}>Không tìm thấy tin đăng</h3>
            <p style={{ color: '#555', marginBottom: 20 }}>Bạn hiện tại không có tin đăng nào cho trạng thái này</p>
            <button
              style={{ background: '#ff8000', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 600, fontSize: 18, cursor: 'pointer' }}
              onClick={async () => {
                const loadingToast = toast.loading("🔍 Đang kiểm tra thông tin tài khoản...", { position: "top-center" });
                try {
                  const token = sessionStorage.getItem("token");
                  const res = await axios.get(`http://localhost:5133/api/user/profile/${userId}`,
                    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
                  );
                  const userInfo = res.data;
                  toast.dismiss(loadingToast);
                  let validation = { valid: true, message: "" };
                  if (!userInfo.emailConfirmed) {
                    validation = { valid: false, message: "Bạn cần xác minh email để đăng tin." };
                  } else {
                    let phone = userInfo.phoneNumber ? String(userInfo.phoneNumber).replace(/[^0-9]/g, "").trim() : "";
                    // Chỉ hợp lệ nếu đúng 10 số và bắt đầu bằng số 0
                    if (phone.length !== 10 || !phone.startsWith("0")) {
                      validation = { valid: false, message: "Số điện thoại phải đủ 10 số và bắt đầu bằng số 0 để đăng tin." };
                    }
                  }
                  if (!validation.valid) {
                    if (validation.message.includes("xác minh email")) {
                      toast.error(`📧 ${validation.message}`, { position: "top-center", duration: 3500, className: "topnnavbar-toast-verify-email" });
                    } else if (validation.message.includes("Số điện thoại")) {
                      toast.error(`📱 ${validation.message}`, { position: "top-center", duration: 3500, className: "topnnavbar-toast-update-phone" });
                    } else {
                      toast.error(`❌ ${validation.message}`, { position: "top-center", duration: 3500 });
                    }
                    navigate('/cai-dat-tai-khoan');
                    return;
                  }
                  navigate('/dang-tin');
                } catch (error) {
                  toast.dismiss(loadingToast);
                  toast.error("❌ Không thể xác thực thông tin. Vui lòng thử lại.", { position: "top-center", duration: 3500 });
                  navigate('/cai-dat-tai-khoan');
                }
              }}
            >
              Đăng tin
            </button>
          </div>
        ) : (
          currentPosts.map((post) => (
            activeTab === "DaDuyet" ? (
              <div
                key={post.maTinDang}
                className="qlt-post-item"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/tin-dang/${post.maTinDang}`)}
              >
                {post.images?.length > 0 && (
                  <img
                    src={post.images[0]}
                    alt="Ảnh tin đăng"
                    className="qlt-post-image"
                  />
                )}
                <div className="qlt-post-content">
                  <h3 className="qlt-title">{post.tieuDe}</h3>
                  <p>{post.moTa}</p>
                  <p>
                    <strong className="qlt-price">Giá: {post.gia.toLocaleString()} đ</strong>
                  </p>
                  <p>
                    <strong>Ngày đăng:</strong> {new Date(post.ngayDang).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Người bán:</strong> {post.nguoiBan}
                  </p>

                  <div className="qlt-actions">
                    <button onClick={(e) => { e.stopPropagation(); handleUpdate(post.maTinDang); }} className="qlt-edit-btn">
                      <FaEdit className="action-icon" /> Cập nhật
                    </button>
                    <button
                      className="qlt-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post.maTinDang);
                      }}
                    >
                      <FaTrash className="action-icon" /> Xóa
                    </button>
                  </div>
                </div>

                <div className="qlt-post-status">
                  {post.trangThaiText === "ChoDuyet" && <FaRegClock className="status-icon" title="Chờ duyệt" />}
                  {post.trangThaiText === "DaDuyet" && <FaCheck className="status-icon" title="Đã duyệt" />}
                  {post.trangThaiText === "TuChoi" && <FaRegThumbsDown className="status-icon" title="Bị từ chối" />}
                </div>
              </div>
            ) : (
              <div key={post.maTinDang} className="qlt-post-item">
                {post.images?.length > 0 && (
                  <img
                    src={post.images[0]}
                    alt="Ảnh tin đăng"
                    className="qlt-post-image"
                  />
                )}
                <div className="qlt-post-content">
                  <h3 className="qlt-title">{post.tieuDe}</h3>
                  <p>{post.moTa}</p>
                  <p>
                    <strong className="qlt-price">Giá: {post.gia.toLocaleString()} đ</strong>
                  </p>
                  <p>
                    <strong>Ngày đăng:</strong> {new Date(post.ngayDang).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Người bán:</strong> {post.nguoiBan}
                  </p>

                  <div className="qlt-actions">
                    <button onClick={() => handleUpdate(post.maTinDang)} className="qlt-edit-btn">
                      <FaEdit className="action-icon" /> Cập nhật
                    </button>
                    <button
                      className="qlt-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post.maTinDang);
                      }}
                    >
                      <FaTrash className="action-icon" /> Xóa
                    </button>
                  </div>
                </div>

                <div className="qlt-post-status">
                  {post.trangThaiText === "ChoDuyet" && <FaRegClock className="status-icon" title="Chờ duyệt" />}
                  {post.trangThaiText === "DaDuyet" && <FaCheck className="status-icon" title="Đã duyệt" />}
                  {post.trangThaiText === "TuChoi" && <FaRegThumbsDown className="status-icon" title="Bị từ chối" />}
                </div>
              </div>
            )
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="qlt-pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={num === currentPage ? "active" : ""}
              onClick={() => handlePageChange(num)}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuanLyTin;