import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { usePostDetails } from "../hooks/usePostDetails";
import { formatPrice } from "../utils/formatters";
import { formatRelativeTime } from "../utils/dateUtils";

// Icons
import { 
  FaHeart, FaRegHeart, FaMapMarkerAlt, FaPhoneAlt, FaCommentDots, 
  FaBed, FaBath, FaRulerCombined, FaUserFriends, FaCheckCircle, 
  FaClock, FaShieldAlt, FaFlag 
} from "react-icons/fa";
import { IoShareSocialOutline } from "react-icons/io5";

// Styles
import styles from "./ChiTietTinDangNhaTro.module.css";
import TopNavbar from "./TopNavbar/TopNavbar";
import SimilarPostsSection from "../components/SimilarPostsSection";
import Lightbox from "../components/Lightbox";

const ChiTietTinDangNhaTro = ({ onOpenChat, initialPost }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  // Hook lấy dữ liệu (Reuse logic cũ)
  // Nếu có initialPost từ router thì dùng luôn, không fetch lại
  const { post: fetchedPost, similarPostsByCategory, similarPostsBySeller, loading, handleChatWithSeller } = usePostDetails(id, onOpenChat);
  const post = initialPost || fetchedPost;

  const [savedIds, setSavedIds] = useState([]);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const isLoggedIn = !!(user && token);

  // --- Logic Lưu tin (Giữ nguyên) ---
  useEffect(() => {
    const fetchSavedIds = async () => {
      if (isLoggedIn) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSavedIds(res.data.map((p) => p.maTinDang));
        } catch (err) { console.error(err); }
      }
    };
    fetchSavedIds();
  }, [isLoggedIn, token]);

  const toggleSave = async () => {
    if (!isLoggedIn) return toast.error("Vui lòng đăng nhập!");
    const isSaved = savedIds.includes(post.maTinDang);
    try {
      if (isSaved) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${post.maTinDang}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedIds(prev => prev.filter(id => id !== post.maTinDang));
        toast.success("Đã bỏ lưu tin");
      } else {
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${post.maTinDang}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedIds(prev => [...prev, post.maTinDang]);
        toast.success("Đã lưu tin!");
      }
    } catch (err) { toast.error("Lỗi thao tác"); }
  };

  // --- Helpers lấy dữ liệu chi tiết ---
  const getDetail = (key) => {
    const details = post?.chiTietObj || post?.ChiTietObj || {};
    const foundKey = Object.keys(details).find(k => k.toLowerCase().includes(key.toLowerCase()));
    return foundKey ? details[foundKey] : null;
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!post) return <div className={styles.notFound}>Tin đăng không tồn tại.</div>;

  // Data Extraction
  const dienTich = getDetail('dienTich') || getDetail('dt');
  const phongNgu = getDetail('phongNgu') || getDetail('pn');
  const veSinh = getDetail('veSinh') || getDetail('wc');
  const noiThat = getDetail('noiThat');
  const phapLy = getDetail('phapLy');
  
  // Xử lý tiện ích (String hoặc Array)
  let tienIchList = [];
  const rawTienIch = getDetail('tienIch');
  if (Array.isArray(rawTienIch)) tienIchList = rawTienIch;
  else if (typeof rawTienIch === 'string') tienIchList = rawTienIch.split(',').map(s => s.trim());

  // Format image URL
  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/600x400";
    return img.startsWith('http') ? img : `http://localhost:5133${img}`;
  };

  // Check if user is the post owner
  const isOwner = user && post && (user.id === post.maNguoiBan || user.maTV === post.maNguoiBan);

  return (
    <div className={styles.pageWrapper}>
      <TopNavbar />

      <div className={styles.container}>
        {/* 1. BREADCRUMB & HEADER */}
        <div className={styles.headerSection}>
          <div className={styles.breadcrumb}>
            Trang chủ &rsaquo; Nhà đất &rsaquo; {post.danhMucCha} &rsaquo; <span className={styles.currentCrumb}>{post.tieuDe}</span>
          </div>
          
          <div className={styles.titleWrapper}>
            <h1 className={styles.postTitle}>{post.tieuDe}</h1>
            <div className={styles.actionButtons}>
              <button className={styles.btnShare}><IoShareSocialOutline /> Chia sẻ</button>
              <button className={`${styles.btnSave} ${savedIds.includes(post.maTinDang) ? styles.activeSave : ''}`} onClick={toggleSave}>
                {savedIds.includes(post.maTinDang) ? <FaHeart /> : <FaRegHeart />} 
                {savedIds.includes(post.maTinDang) ? "Đã lưu" : "Lưu tin"}
              </button>
            </div>
          </div>

          <div className={styles.addressLine}>
            <FaMapMarkerAlt className={styles.iconMap} />
            <span>{post.diaChi || `${post.quanHuyen}, ${post.tinhThanh}`}</span>
          </div>
        </div>

        {/* 2. GALLERY GRID (1 Ảnh lớn + 4 Ảnh nhỏ) */}
        <div className={styles.galleryGrid}>
          {post.images && post.images.slice(0, 5).map((img, index) => (
            <div 
              key={index} 
              className={`${styles.galleryItem} ${index === 0 ? styles.mainImage : ''}`}
              onClick={() => { setLightboxIndex(index); setShowLightbox(true); }}
            >
              <img src={getImageUrl(img)} alt={`Ảnh ${index}`} />
              {index === 4 && post.images.length > 5 && (
                <div className={styles.moreImagesOverlay}>+{post.images.length - 5} ảnh</div>
              )}
            </div>
          ))}
        </div>

        {/* 3. MAIN CONTENT (2 Cột) */}
        <div className={styles.contentLayout}>
          
          {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
          <div className={styles.leftColumn}>
            
            {/* Thanh thông số quan trọng */}
            <div className={styles.keySpecs}>
               <div className={styles.specItem}>
                  <span className={styles.specLabel}>Mức giá</span>
                  <span className={styles.specValuePrice}>{formatPrice(post.gia)}</span>
               </div>
               <div className={styles.specDivider}></div>
               <div className={styles.specItem}>
                  <span className={styles.specLabel}>Diện tích</span>
                  <span className={styles.specValue}>{dienTich ? `${dienTich} m²` : '--'}</span>
               </div>
               <div className={styles.specDivider}></div>
               <div className={styles.specItem}>
                  <span className={styles.specLabel}>Phòng ngủ</span>
                  <span className={styles.specValue}>{phongNgu || '--'} PN</span>
               </div>
            </div>

            {/* Thông tin mô tả */}
            <div className={styles.sectionBox}>
              <h3 className={styles.sectionTitle}>Thông tin mô tả</h3>
              <div className={styles.descriptionText} dangerouslySetInnerHTML={{ __html: post.moTa?.replace(/\n/g, '<br/>') || 'Không có mô tả' }} />
            </div>

            {/* Đặc điểm bất động sản */}
            <div className={styles.sectionBox}>
               <h3 className={styles.sectionTitle}>Đặc điểm bất động sản</h3>
               <div className={styles.featuresGrid}>
                  <div className={styles.featureItem}><FaRulerCombined/> Diện tích: <b>{dienTich || '--'} m²</b></div>
                  <div className={styles.featureItem}><FaCheckCircle/> Tình trạng: <b>{post.tinhTrang || post.TinhTrang}</b></div>
                  {phongNgu && <div className={styles.featureItem}><FaBed/> Số phòng ngủ: <b>{phongNgu} phòng</b></div>}
                  {veSinh && <div className={styles.featureItem}><FaBath/> Số toilet: <b>{veSinh} phòng</b></div>}
                  {phapLy && <div className={styles.featureItem}><FaShieldAlt/> Pháp lý: <b>{phapLy}</b></div>}
                  {noiThat && <div className={styles.featureItem}><FaCheckCircle/> Nội thất: <b>{noiThat}</b></div>}
               </div>
            </div>

             {/* Tiện ích (Tags) */}
             {tienIchList.length > 0 && (
              <div className={styles.sectionBox}>
                <h3 className={styles.sectionTitle}>Tiện ích</h3>
                <div className={styles.amenitiesList}>
                  {tienIchList.map((item, idx) => (
                    <span key={idx} className={styles.amenityTag}>{item}</span>
                  ))}
                </div>
              </div>
             )}

            <div className={styles.postMeta}>
               <div className={styles.metaItem}><FaClock/> Ngày đăng: {formatRelativeTime(post.ngayDang)}</div>
               <div className={styles.metaItem}><FaFlag/> Mã tin: {post.maTinDang}</div>
            </div>
          </div>

          {/* CỘT PHẢI: LIÊN HỆ (STICKY) */}
          <div className={styles.rightColumn}>
            <div className={styles.contactCard}>
              <div className={styles.userInfo}>
                <img 
                  src={post.avatar || "https://via.placeholder.com/64"} 
                  alt={post.nguoiBan} 
                  className={styles.avatarLarge}
                  onClick={() => navigate(`/nguoi-dung/${post.maNguoiBan}`)}
                />
                <div className={styles.userText}>
                  <div className={styles.sellerName} onClick={() => navigate(`/nguoi-dung/${post.maNguoiBan}`)}>
                    {post.nguoiBan}
                  </div>
                  <div className={styles.sellerType}>Người bán uy tín</div>
                </div>
              </div>

              <button className={styles.btnPhone} onClick={() => setShowPhone(!showPhone)}>
                <FaPhoneAlt /> 
                {showPhone ? post.phoneNumber : `${post.phoneNumber?.substring(0, 4) || 'Hiện'}... · Hiện số`}
              </button>

              {!isOwner && (
                <button className={styles.btnChat} onClick={handleChatWithSeller}>
                  <FaCommentDots /> Chat với người bán
                </button>
              )}

              {isOwner && (
                <div className={styles.ownerBadge}>
                  ✓ Đây là tin đăng của bạn
                </div>
              )}
            </div>

            <div className={styles.safetyBox}>
              <FaShieldAlt className={styles.safetyIcon}/>
              <p>KHÔNG đóng phí đặt cọc khi chưa xem nhà. Báo cáo tin đăng nếu thấy dấu hiệu lừa đảo.</p>
            </div>
          </div>

        </div>

        {/* 4. TIN TƯƠNG TỰ */}
        {similarPostsByCategory && similarPostsByCategory.length > 0 && (
          <div className={styles.similarSection}>
             <h2 className={styles.similarTitle}>Tin đăng tương tự</h2>
             <SimilarPostsSection 
                posts={similarPostsByCategory} 
                mode="grid" 
                isLoggedIn={isLoggedIn}
                savedIds={savedIds}
                onToggleSave={toggleSave}
             />
          </div>
        )}

        {/* Lightbox */}
        {showLightbox && post.images && (
          <Lightbox
            images={post.images}
            startIndex={lightboxIndex}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ChiTietTinDangNhaTro;
