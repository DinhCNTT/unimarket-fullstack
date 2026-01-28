// src/components/VideoPage.jsx
import React, { useEffect, useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TrangChuNav from '../components/TrangChuNav';
import TopNavbar from "../components/TopNavbar/TopNavbar";
import Footer from '../components/Footer';
import VideoFilter from '../components/VideoFilter';
import defaultAvatar from '../assets/default-avatar.png';
import styles from './VideoPage.module.css';
import { CiLocationOn } from "react-icons/ci";
import { MdOutlineInsertPhoto } from "react-icons/md";
import { FaHeart } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

// ========================================
// UTILITY FUNCTIONS
// ========================================

const getCloudinaryThumbnail = (videoUrl) => {
  if (!videoUrl || !videoUrl.includes('/upload/')) return '';
  return videoUrl
    .replace('/upload/', '/upload/so_2,q_auto/')
    .replace('.mp4', '.jpg');
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now - date) / 1000;

  if (diff < 60) return "Vừa đăng";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
  return `${Math.floor(diff / 31536000)} năm trước`;
};

const mapTinhTrang = (tinhTrang) => {
  switch (tinhTrang) {
    case 'DaSuDung':
      return 'Đã sử dụng';
    case 'Moi':
      return 'Mới';
    default:
      return 'Không xác định';
  }
};

// ========================================
// MAIN COMPONENT
// ========================================

const VideoPage = () => {
  // Context
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Refs
  const videoRefs = useRef([]);
  
  // States - Video Data
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState([]);
  
  // States - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [maxKnownPage, setMaxKnownPage] = useState(1);
  
  // States - Filters
  const [filters, setFilters] = useState({
    categoryId: null,
    minPrice: 0,
    maxPrice: 100000000,
  });
  
  // Constants
  const videosPerPage = 15;

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  const getAuthToken = () => {
    return user?.token || token;
  };

  const isLoggedIn = () => {
    const authToken = getAuthToken();
    return !!(user && authToken);
  };

  // ========================================
  // FETCH DATA EFFECTS
  // ========================================

  // Fetch videos with filters
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);

        // Build query params
        const params = new URLSearchParams({
          page: currentPage,
          pageSize: videosPerPage,
        });

        if (filters.categoryId) {
          params.append("categoryId", filters.categoryId);
        }
        if (filters.minPrice > 0) {
          params.append("minPrice", filters.minPrice);
        }
        if (filters.maxPrice < 100000000) {
          params.append("maxPrice", filters.maxPrice);
        }

        // 🔥 CẬP NHẬT THEO YÊU CẦU: Lấy Token và gửi Header
        const authToken = getAuthToken();
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

        // Call API kèm Headers để Backend nhận diện user cho thuật toán AI
        const res = await axios.get(
          `http://localhost:5133/api/video?${params.toString()}`,
          { headers } 
        );
        const data = res.data;

        if (Array.isArray(data)) {
          setVideos(data);
          const hasNext = data.length === videosPerPage;
          setHasNextPage(hasNext);
          
          if (hasNext) {
            setMaxKnownPage(Math.max(maxKnownPage, currentPage + 1));
          } else {
            setMaxKnownPage(currentPage);
          }
        }
      } catch (err) {
        console.error('Lỗi khi lấy video:', err);
        setVideos([]);
        setHasNextPage(false);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
    // 🔥 Thêm user và token vào dependency để refresh khi trạng thái đăng nhập thay đổi
  }, [currentPage, filters, user, token]);

  // Fetch saved videos
  useEffect(() => {
    const fetchSavedVideos = async () => {
      const authToken = getAuthToken();
      if (isLoggedIn() && authToken) {
        try {
          const res = await axios.get(
            "http://localhost:5133/api/yeuthich/danh-sach",
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          setSavedIds(res.data.map(post => post.maTinDang));
        } catch (err) {
          console.error("Error fetching saved videos:", err);
          setSavedIds([]);
        }
      } else {
        setSavedIds([]);
      }
    };

    fetchSavedVideos();
  }, [user, token]);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  // Video hover handlers
  const handleMouseEnter = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.style.opacity = 1;
      video.currentTime = 0;
      video.play().catch(e => console.log("Auto-play prevented:", e));
      setTimeout(() => {
        video.pause();
        video.style.opacity = 0;
      }, 3000);
    }
  };

  const handleMouseLeave = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.pause();
      video.style.opacity = 0;
    }
  };

  // Save/Unsave handler
  const handleToggleSave = async (postId, isSaved) => {
    const authToken = getAuthToken();

    if (!isLoggedIn() || !authToken) {
      alert("Bạn cần đăng nhập để lưu tin.");
      return;
    }

    try {
      if (isSaved) {
        await axios.delete(
          `http://localhost:5133/api/yeuthich/xoa/${postId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setSavedIds(prev => prev.filter(id => id !== postId));
        alert("Đã gỡ lưu tin đăng khỏi danh sách yêu thích.");
      } else {
        await axios.post(
          `http://localhost:5133/api/yeuthich/luu/${postId}`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setSavedIds(prev => [...prev, postId]);
        alert("Đã lưu tin đăng vào danh sách yêu thích.");
      }
    } catch (err) {
      let msg = "Có lỗi xảy ra, vui lòng thử lại.";
      if (err.response?.data?.message) {
        const backendMsg = err.response.data.message;
        if (backendMsg.includes("chưa xác minh") || backendMsg.toLowerCase().includes("gmail")) {
          msg = "Bạn chưa xác minh gmail. Vui lòng kiểm tra email để xác minh tài khoản.";
        } else if (backendMsg.includes("chưa nhập") || backendMsg.toLowerCase().includes("số điện thoại")) {
          msg = "Bạn chưa nhập đầy đủ thông tin (ví dụ: Số điện thoại). Vui lòng cập nhật hồ sơ cá nhân.";
        } else {
          msg = backendMsg;
        }
      }
      alert(msg);
    }
  };

  // Navigation handler
  const handleVideoClick = (video) => {
    // 🔥 FIX: Truyền thêm state chứa toàn bộ thông tin video sang trang kia
    navigate(`/video/${video.maTinDang}`, { 
      state: { seedVideo: video } 
    });
  }

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Filter handlers
  const handleApplyFilter = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setMaxKnownPage(1);
  };

  const handleClearFilter = () => {
    setFilters({
      categoryId: null,
      minPrice: 0,
      maxPrice: 100000000,
    });
    setCurrentPage(1);
    setMaxKnownPage(1);
  };

  // ========================================
  // RENDER FUNCTIONS
  // ========================================

  const renderPagination = () => {
    if (currentPage === 1 && !hasNextPage) return null;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(startPage + maxVisiblePages - 1, maxKnownPage);

    if (endPage - startPage + 1 < maxVisiblePages && endPage < maxKnownPage) {
      endPage = Math.min(maxKnownPage, startPage + maxVisiblePages - 1);
    }
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <div className={styles.paginationContainer}>
        <div className={styles.pagination}>
          {currentPage > 1 && (
            <button
              className={`${styles.paginationBtn} ${styles.paginationPrev}`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ←
            </button>
          )}

          {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
            const pageNumber = startPage + index;
            return (
              <button
                key={pageNumber}
                className={`${styles.paginationBtn} ${styles.paginationNumber} ${
                  pageNumber === currentPage ? styles.active : ''
                }`}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            );
          })}

          {(hasNextPage || currentPage < maxKnownPage) && (
            <button
              className={`${styles.paginationBtn} ${styles.paginationNext}`}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              →
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderVideoCard = (video, index) => {
    const isSaved = savedIds.includes(video.maTinDang);
    
    return (
      <div
        key={video.maTinDang}
        className={styles.card}
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={() => handleMouseLeave(index)}
        onClick={() => handleVideoClick(video)}
      >
        {/* Save Button */}
        <div 
          className={styles.saveBtn}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleSave(video.maTinDang, isSaved);
          }}
          title={isSaved ? "Bỏ lưu tin" : "Lưu tin"}
        >
          <FaHeart 
            className={`${styles.iconTraiTim} ${isSaved ? styles.saved : styles.notSaved}`} 
          />
        </div>

        {/* Thumbnail & Video */}
        <div className={styles.thumbnail}>
          <img
            src={getCloudinaryThumbnail(video.videoUrl)}
            alt="thumbnail"
            className={styles.thumbnailImg}
          />
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            src={video.videoUrl}
            muted
            className={styles.hoverVideo}
          />
          <div className={styles.playOverlay}>
            <div className={styles.playButton}>▶</div>
          </div>

          {/* Post Time */}
          {video.ngayDang && (
            <div className={styles.postTime}>
              {formatRelativeTime(video.ngayDang)}
            </div>
          )}
          
          {/* Photo Count */}
          <div className={styles.photoCount}>
            <MdOutlineInsertPhoto size={14} style={{ marginRight: '4px' }} /> 
            {video.anhCount}
          </div>
        </div>
        
        {/* Video Info */}
        <div className={styles.info}>
          <h3 className={styles.videoTitle}>
            {video.tieuDe}
          </h3>
          <div className={styles.condition}>
            {mapTinhTrang(video.tinhTrang)}
          </div>
          <div className={styles.price}>
            {video.gia?.toLocaleString()} đ
          </div>
          <div className={styles.location}>
            <CiLocationOn className={styles.iconViTri}/>
            {video.tinhThanh}
          </div>          
          <div className={styles.footer}>
            <div className={styles.userInfo}>
              <img
                src={
                  video.nguoiDang?.avatarUrl
                    ? /^https?:\/\//.test(video.nguoiDang.avatarUrl)
                      ? video.nguoiDang.avatarUrl
                      : `http://localhost:5133${video.nguoiDang.avatarUrl}`
                    : defaultAvatar
                }
                alt="avatar"
                className={styles.avatar}
              />
              <span className={styles.username}>
                {video.nguoiDang?.fullName || 'Người dùng'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className={styles.page}>
      <TopNavbar />
      
      <div className={styles.content}>
        {/* Navigation */}
        <div className={styles.navContainer}>
          <TrangChuNav />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            UNIMARKET <span>Video</span>
          </h1>
          <p className={styles.subtitle}>
            Mua bán dễ dàng hơn khi xem Video thực tế
          </p>
        </div>

        {/* Filter Section */}
        <div className={styles.filterContainer}>
          <VideoFilter
            onApplyFilter={handleApplyFilter}
            onClearFilter={handleClearFilter}
          />
        </div>

        {/* Content Section */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải video...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className={styles.noContent}>
            <p>Không có video nào được tìm thấy</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {videos.map((video, index) => renderVideoCard(video, index))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default VideoPage;