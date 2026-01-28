import React, { useState, useEffect } from "react"; // Thêm useEffect
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Thêm axios
import styles from "./PostGrid.module.css";
import EmptyState from "../../components/Common/EmptyState/EmptyState";
import { CiFolderOff } from "react-icons/ci";
import { IoImagesOutline, IoVideocamOutline, IoLocationOutline, IoStorefront } from "react-icons/io5"; 
import { FaHeart } from "react-icons/fa"; 

const PostGrid = ({ posts, isOwner, viewMode = "grid", userInfo }) => {
  const [showMorePosts, setShowMorePosts] = useState(false);
  const [hoveredPostId, setHoveredPostId] = useState(null); 
  
  // --- STATE MỚI: Lưu danh sách ID các tin đã Tym ---
  const [savedPostIds, setSavedPostIds] = useState(new Set()); 

  const navigate = useNavigate();

  // --- EFFECT MỚI: Lấy danh sách tin đã lưu của user hiện tại ---
  useEffect(() => {
    const fetchSavedPosts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Chưa đăng nhập thì thôi

      try {
        const res = await axios.get("http://localhost:5133/api/YeuThich/danh-sach", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // API trả về danh sách object, ta chỉ cần lấy mảng MaTinDang để check cho nhanh
        const ids = new Set(res.data.map(item => item.maTinDang));
        setSavedPostIds(ids);
      } catch (err) {
        // Nếu lỗi 404 (chưa lưu tin nào) hoặc lỗi khác thì bỏ qua
        console.log("Chưa có tin yêu thích hoặc lỗi tải danh sách yêu thích");
      }
    };

    fetchSavedPosts();
  }, []); // Chỉ chạy 1 lần khi mount

  // --- HÀM MỚI: Xử lý Tym / Bỏ Tym ---
  const handleToggleSave = async (e, maTinDang) => {
    e.stopPropagation(); // Ngăn chặn click vào card (chuyển trang)

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Bạn cần đăng nhập để thực hiện chức năng này!");
      return;
    }

    const isSaved = savedPostIds.has(maTinDang);
    
    // Cập nhật UI ngay lập tức (Optimistic UI update) cho mượt
    const newSet = new Set(savedPostIds);
    if (isSaved) {
        newSet.delete(maTinDang);
    } else {
        newSet.add(maTinDang);
    }
    setSavedPostIds(newSet);

    try {
      if (isSaved) {
        // Nếu đã lưu -> Gọi API Xóa
        await axios.delete(`http://localhost:5133/api/YeuThich/xoa/${maTinDang}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Nếu chưa lưu -> Gọi API Lưu
        await axios.post(`http://localhost:5133/api/YeuThich/luu/${maTinDang}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Lỗi khi thao tác yêu thích:", err);
      // Nếu lỗi thì revert lại UI cũ
      if (isSaved) newSet.add(maTinDang);
      else newSet.delete(maTinDang);
      setSavedPostIds(newSet);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        icon={<CiFolderOff />}
        title="Chưa có tin đăng"
        subtitle="Người dùng này chưa đăng tin nào"
      />
    );
  }

  const displayedPosts = showMorePosts ? posts : posts.slice(0, 10); 

  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if(diffDays === 0) return "Hôm nay";
    if(diffDays < 30) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.gridSection}>
        <div className={`${styles.gridContainer} ${showMorePosts ? styles.showAll : ""}`}>
          
          <div className={viewMode === 'list' ? styles.postsListWrapper : styles.postsGrid}>
            {displayedPosts.map((post) => {
              const imageCount = post.anhDuongDans?.length || 0;
              const hasVideo = !!post.videoDuongDan; 
              
              // Kiểm tra xem tin này đã được lưu chưa
              const isLiked = savedPostIds.has(post.maTinDang);

              /* --- RENDER DẠNG DANH SÁCH (LIST VIEW) --- */
              if (viewMode === 'list') {
                  return (
                    <div 
                        key={post.maTinDang} 
                        className={styles.postCardList}
                        onClick={() => navigate(`/tin-dang/${post.maTinDang}`)}
                    >
                        {/* 1. Ảnh bên trái (Luôn là ảnh tĩnh) */}
                        <div className={styles.listImageWrapper}>
                            <img
                                src={post.anhDuongDans?.[0] || "/default-image.jpg"}
                                alt={post.tieuDe}
                                className={styles.listImage}
                            />
                            
                            <div className={styles.listBadgesContainer}>
                                {hasVideo && (
                                    <span className={styles.listBadgeItem}>
                                        <IoVideocamOutline /> 1
                                    </span>
                                )}
                                {imageCount > 0 && (
                                    <span className={styles.listBadgeItem}>
                                        <IoImagesOutline /> {imageCount}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 2. Nội dung bên phải */}
                        <div className={styles.listContent}>
                            <div className={styles.listHeader}>
                                <h4 className={styles.listTitle} title={post.tieuDe}>{post.tieuDe}</h4>
                                <div className={styles.listMetaInfo}>
                                    {post.moTa ? post.moTa.substring(0, 50) + "..." : "Tin chính chủ"}
                                </div>
                            </div>

                            <div className={styles.listBodyMiddle}>
                                <div className={styles.listPriceRow}>
                                    <span className={styles.listPrice}>{post.gia?.toLocaleString()} đ</span>
                                </div>
                                <div className={styles.listLocation}>
                                    <IoLocationOutline /> {post.khuVuc || "Toàn quốc"}
                                </div>
                            </div>

                            <div className={styles.listFooter}>
                                {userInfo && (
                                    <div className={styles.listSeller}>
                                        <img src={userInfo.avatarUrl || "/default-avatar.png"} alt="seller" className={styles.sellerAvatar} />
                                        <span className={styles.sellerName}>{userInfo.fullName || userInfo.userName}</span>
                                        <IoStorefront className={styles.storeIcon} color="#f5a623" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Nút tim LIST VIEW */}
                        {!isOwner && (
                            <div 
                                className={styles.listHeartBtn}
                                onClick={(e) => handleToggleSave(e, post.maTinDang)} // Gọi hàm xử lý
                                style={{ cursor: "pointer" }}
                            >
                                <FaHeart 
                                    className={styles.heartIconSmall} 
                                    color={isLiked ? "#ff424f" : "#ccc"} // Đổi màu
                                />
                            </div>
                        )}
                    </div>
                  );
              }

              /* --- RENDER DẠNG LƯỚI (GRID VIEW) --- */
              return (
                <div
                  key={post.maTinDang}
                  className={styles.postCard}
                  onClick={() => navigate(`/tin-dang/${post.maTinDang}`)}
                  onMouseEnter={() => setHoveredPostId(post.maTinDang)}
                  onMouseLeave={() => setHoveredPostId(null)}
                >
                  <div className={styles.postImageWrapper}>
                    {hoveredPostId === post.maTinDang && hasVideo ? (
                      <video
                        src={post.videoDuongDan}
                        autoPlay
                        muted
                        loop
                        className={styles.postVideoPreview}
                      />
                    ) : (
                      <img
                        src={post.anhDuongDans?.[0] || "/default-image.jpg"}
                        alt={post.tieuDe}
                        className={styles.postImage}
                      />
                    )}
                    <div className={styles.postOverlay}></div>
                    <div className={styles.timeBadge}>{getTimeAgo(post.ngayDang)}</div>
                    
                    <div className={styles.mediaBadgesContainer}>
                        {hasVideo && <div className={styles.mediaBadge}><IoVideocamOutline /><span>1</span></div>}
                        {imageCount > 0 && <div className={styles.mediaBadge}><IoImagesOutline /><span>{imageCount}</span></div>}
                    </div>

                    {/* Nút tim GRID VIEW */}
                    {!isOwner && (
                        <div 
                            className={styles.heartButton} 
                            onClick={(e) => handleToggleSave(e, post.maTinDang)} // Gọi hàm xử lý
                        >
                           <FaHeart 
                                className={styles.heartIcon} 
                                color={isLiked ? "#ff424f" : "white"} // Đổi màu (Lưới nền tối nên dùng trắng/đỏ)
                           /> 
                        </div>
                    )}
                  </div>
                  <div className={styles.postContent}>
                    <h4 className={styles.postTitle} title={post.tieuDe}>{post.tieuDe}</h4>
                    <p className={styles.postDescription}>{post.moTa || "Không có mô tả"}</p>
                    <div className={styles.postMetaBottom}>
                        <div className={styles.postPrice}>{post.gia?.toLocaleString()}đ</div>
                        <div className={styles.postLocation}>{post.khuVuc || "Toàn quốc"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {posts.length > 10 && (
          <div className={styles.showMoreContainer}>
            <button className={styles.showMoreBtn} onClick={() => setShowMorePosts(!showMorePosts)}>
              {showMorePosts ? "Thu gọn ↑" : `Xem thêm (${posts.length - 10} tin) ↓`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostGrid;