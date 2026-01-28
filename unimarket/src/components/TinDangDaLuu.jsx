import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FaHeart, FaTrashAlt, FaFire, FaMapMarkerAlt, 
  FaChevronUp, FaFolderOpen, 
  FaArrowRight, FaLayerGroup, FaCheckCircle
} from "react-icons/fa";

import TopNavbar from "./TopNavbar/TopNavbar";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthContext";
import styles from "./TinDangDaLuu.module.css";

const TinDangDaLuu = () => {
  const [posts, setPosts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Bỏ showScrollable, chỉ giữ lại state đếm số lượng hiển thị
  const [expandedPosts, setExpandedPosts] = useState(8); 
  
  // Ref này dùng để scroll window khi thu gọn (tùy chọn)
  const containerRef = useRef(null);

  // --- Fetch Data ---
  const fetchSavedPosts = async (token) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchSavedPosts(user.token);
    } else {
      setLoading(false);
    }
  }, [user]);

  // --- Xử lý Xóa ---
  const handleRemove = async (id) => {
    if (!user || !user.token) {
      alert("Bạn cần đăng nhập để sử dụng chức năng này.");
      return;
    }
    try {
      await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setPosts(prev => prev.filter(post => post.maTinDang !== id));
      showNotification("Đã xóa khỏi danh sách yêu thích!", "success");
    } catch (err) {
      showNotification("Có lỗi xảy ra.", "error");
    }
  };

  // --- Custom Notification ---
  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `${styles.notification} ${styles[type]}`;
    notification.innerHTML = type === 'success' 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> ${message}`
      : message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleImageClick = (maTinDang) => {
    navigate(`/tin-dang/${maTinDang}`);
  };

  // --- Format Giá (Hiển thị đầy đủ số) ---
  const formatPrice = (price) => {
    if (price === 0 || !price) return "Thỏa thuận";
    
    // Chỉ dùng toLocaleString để hiển thị đầy đủ số và thêm chữ đ
    return `${price.toLocaleString('vi-VN')} đ`;
  };

  // --- Xử lý Xem thêm / Thu gọn (Đã sửa) ---
  const handleShowMore = () => {
    // Chỉ đơn giản là tăng số lượng hiển thị, không set scroll
    setExpandedPosts(prev => Math.min(prev + 8, posts.length));
  };

  const handleCollapse = () => {
    setExpandedPosts(8);
    // Khi thu gọn, cuộn màn hình lên đầu danh sách để người dùng dễ nhìn
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const displayedPosts = posts.slice(0, expandedPosts);

  if (loading) {
    return (
      <>
        <TopNavbar />
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Đang tải danh sách quan tâm...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopNavbar />
      <div className={styles.container}>
        <div className={styles.wrapper}>
          
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.iconBox}>
                <FaHeart />
              </div>
              <div className={styles.title}>
                <h1>Tin Đăng Đã Lưu</h1>
                <div className={styles.subtitle}>
                  <FaCheckCircle size={12} color="#28a745" />
                  Danh sách những tin bạn đang quan tâm
                </div>
              </div>
            </div>
            
            <div className={styles.badgeCount}>
              {posts.length} tin lưu
            </div>
          </div>

          {posts.length === 0 ? (
            <div className={styles.empty}>
              <FaFolderOpen className={styles.emptyIcon} />
              <h3>Bạn chưa lưu tin đăng nào</h3>
              <p>Hãy dạo một vòng và thả tim cho những món đồ bạn thích nhé!</p>
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => navigate('/')}
              >
                Khám phá ngay <FaArrowRight />
              </button>
            </div>
          ) : (
            <div className={styles.gridContainer} ref={containerRef}> 
              {/* Đã bỏ class scrollable và ref ở div grid */}
              <div className={styles.grid}>
                {displayedPosts.map((post, index) => (
                  <div 
                    key={post.maTinDang} 
                    className={styles.card}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div 
                      className={styles.imageWrapper} 
                      onClick={() => handleImageClick(post.maTinDang)}
                    >
                      {post.savedCount >= 2 && (
                        <div className={styles.hotBadge}>
                          <FaFire /> HOT
                        </div>
                      )}

                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          handleRemove(post.maTinDang);
                        }}
                        title="Bỏ lưu tin này"
                      >
                        <FaTrashAlt size={14} />
                      </button>

                      {post.images && post.images.length > 0 ? (
                        <img
                          src={post.images[0].startsWith("http") ? post.images[0] : `http://localhost:5133${post.images[0]}`}
                          alt={post.tieuDe}
                          className={styles.image}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.image} style={{background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          Không có ảnh
                        </div>
                      )}
                      <div className={styles.overlay}></div>
                    </div>

                    <div 
                      className={styles.info}
                      onClick={() => handleImageClick(post.maTinDang)}
                    >
                      <div>
                        <h3 className={styles.postTitle}>{post.tieuDe}</h3>
                        <div className={styles.priceRow}>
                          <span className={styles.price}>{formatPrice(post.gia)}</span>
                        </div>
                      </div>
                      
                      <div className={styles.metaRow}>
                        <div className={styles.location}>
                          <FaMapMarkerAlt color="#999" size={12} />
                          {post.quanHuyen}, {post.tinhThanh}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              {posts.length > 8 && (
                <div className={styles.controls}>
                  {expandedPosts < posts.length && (
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleShowMore}>
                      <FaLayerGroup /> Xem thêm ({Math.min(8, posts.length - expandedPosts)})
                    </button>
                  )}
                  
                  {/* Luôn hiện nút thu gọn nếu đã mở rộng hơn 8 tin */}
                  {expandedPosts > 8 && (
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleCollapse}>
                      <FaChevronUp /> Thu gọn
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TinDangDaLuu;