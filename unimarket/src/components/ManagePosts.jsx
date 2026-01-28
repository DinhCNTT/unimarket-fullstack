import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { 
  FaCheck, FaTimes, FaChevronLeft, FaChevronRight, 
  FaImage, FaVideo 
} from "react-icons/fa";

// Import CSS Module
import styles from "./ManagePosts.module.css";

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const postsPerPage = 4;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:5133/api/tindang/get-posts-admin');
      if (Array.isArray(response.data)) {
        setPosts(response.data);
        setTotalPages(Math.ceil(response.data.length / postsPerPage));
        updateDisplayedPosts(response.data, currentPage);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  const updateDisplayedPosts = (postsList, page) => {
    const startIndex = (page - 1) * postsPerPage;
    setDisplayedPosts(postsList.slice(startIndex, startIndex + postsPerPage));
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      updateDisplayedPosts(posts, pageNumber);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const toggleDescription = (postId) => {
    setExpandedDescriptions(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleMediaClick = (mediaList, initialIndex = 0) => {
    const fullMedias = mediaList.map(m => m.startsWith("http") ? m : `http://localhost:5133/${m}`);
    setSelectedMedia({ medias: fullMedias, currentIndex: initialIndex });
  };

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: 'Duyệt tin đăng này?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ffca00',
      confirmButtonText: 'Duyệt ngay',
      cancelButtonText: 'Đóng'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const res = await axios.post(`http://localhost:5133/api/admin/approve-post/${id}`);
        Swal.fire('Thành công', res.data.message, 'success');
        fetchPosts();
      } catch (err) {
        Swal.fire('Lỗi', err.response?.data?.message || "Lỗi duyệt tin", 'error');
      } finally { setLoading(false); }
    }
  };

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: 'Từ chối tin này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f5222d',
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const res = await axios.post(`http://localhost:5133/api/admin/reject-post/${id}`);
        Swal.fire('Đã từ chối', res.data.message, 'success');
        fetchPosts();
      } catch (err) {
        Swal.fire('Lỗi', "Lỗi hệ thống", 'error');
      } finally { setLoading(false); }
    }
  };

  const isVideoFile = (url) => url.match(/\.(mp4|mov|avi|webm|mkv)$/i);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Quản Lý Tin Đăng</h2>

      {loading && <div className={styles.loadingOverlay}>Đang xử lý...</div>}

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{width: '60px'}}>ID</th>
              <th style={{width: '200px'}}>Tiêu Đề</th>
              <th>Người Bán</th>
              <th style={{width: '100px'}}>Ngày Đăng</th>
              <th>Giá</th>
              <th>Mô Tả</th>
              <th>Media</th>
              <th style={{width: '120px'}}>Trạng Thái</th>
              <th style={{width: '220px', textAlign: 'right'}}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {displayedPosts.length > 0 ? displayedPosts.map(post => (
              <tr key={post.maTinDang}>
                <td><strong>#{post.maTinDang}</strong></td>
                <td style={{fontWeight: 600}}>{post.tieuDe}</td>
                <td>{post.nguoiBan}</td>
                <td>{formatDate(post.ngayDang)}</td>
                <td style={{color: '#d32f2f', fontWeight: 700}}>{formatCurrency(post.gia)} ₫</td>
                <td
                  className={`${styles.descCell} ${expandedDescriptions[post.maTinDang] ? styles.expanded : ''}`}
                  onClick={() => toggleDescription(post.maTinDang)}
                >
                  <div className={styles.descContent} dangerouslySetInnerHTML={{ __html: (post.moTa || "").replace(/\n/g, "<br/>") }} />
                </td>
                <td>
                  {post.hinhAnh?.[0] ? (
                    <div className={styles.mediaPreview} onClick={() => handleMediaClick(post.hinhAnh, 0)}>
                      {isVideoFile(post.hinhAnh[0]) ? 
                        <video src={post.hinhAnh[0].startsWith("http") ? post.hinhAnh[0] : `http://localhost:5133/${post.hinhAnh[0]}`} className={styles.thumbImg} muted /> :
                        <img src={post.hinhAnh[0].startsWith("http") ? post.hinhAnh[0] : `http://localhost:5133/${post.hinhAnh[0]}`} className={styles.thumbImg} alt="thumb" />
                      }
                      {post.hinhAnh.length > 1 && <div className={styles.countBadge}>+{post.hinhAnh.length - 1}</div>}
                    </div>
                  ) : <span style={{color: '#999'}}>Không media</span>}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles['status' + post.trangThai]}`}>
                    {post.trangThai === 1 ? "Đã duyệt" : post.trangThai === 2 ? "Đã từ chối" : "Chờ duyệt"}
                  </span>
                </td>
                <td>
                  <div className={styles.actions} style={{justifyContent: 'flex-end'}}>
                    <button className={styles.btnApprove} onClick={() => handleApprove(post.maTinDang)} disabled={post.trangThai !== 0 || loading}>
                      <FaCheck /> Duyệt
                    </button>
                    <button className={styles.btnReject} onClick={() => handleReject(post.maTinDang)} disabled={post.trangThai !== 0 || loading}>
                      <FaTimes /> Từ Chối
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="9" align="center" style={{padding: '30px'}}>Không có tin đăng.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          <FaChevronLeft /> Trước
        </button>
        <span style={{fontWeight: 700}}>Trang {currentPage} / {totalPages}</span>
        <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Sau <FaChevronRight />
        </button>
      </div>

      {selectedMedia && (
        <MediaCarousel medias={selectedMedia.medias} initialIndex={selectedMedia.currentIndex} onClose={() => setSelectedMedia(null)} />
      )}
    </div>
  );
};

// Component MediaCarousel
const MediaCarousel = ({ medias, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setCurrentIndex(prev => (prev === 0 ? medias.length - 1 : prev - 1));
      else if (e.key === 'ArrowRight') setCurrentIndex(prev => (prev === medias.length - 1 ? 0 : prev + 1));
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, medias.length]);

  const currentMedia = medias[currentIndex];
  const isVideo = currentMedia.match(/\.(mp4|mov|avi|webm|mkv)$/i);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.carouselContainer} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.mediaWrapper}>
          {medias.length > 1 && <button className={styles.navBtn} onClick={() => setCurrentIndex(prev => (prev === 0 ? medias.length - 1 : prev - 1))}>❮</button>}
          <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
            {isVideo ? <video src={currentMedia} controls className={styles.mainMedia} key={currentMedia} /> :
              <img src={currentMedia} className={`${styles.mainMedia} ${isZoomed ? styles.zoomed : ''}`} onClick={() => setIsZoomed(!isZoomed)} alt="Large view" />
            }
          </div>
          {medias.length > 1 && <button className={styles.navBtn} onClick={() => setCurrentIndex(prev => (prev === medias.length - 1 ? 0 : prev + 1))}>❯</button>}
        </div>
        <div className={styles.info}>
          <div style={{background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px'}}>{currentIndex + 1} / {medias.length}</div>
        </div>
      </div>
    </div>
  );
};

export default ManagePosts;