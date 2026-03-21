// src/components/ChiTietTinDangNhaTro.jsx
import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { usePostDetails } from "../hooks/usePostDetails";
import { formatPrice } from "../utils/formatters";
import { formatRelativeTime } from "../utils/dateUtils";

// Icons
import {
  FaHeart, FaRegHeart, FaMapMarkerAlt, FaPhoneAlt, FaCommentDots,
  FaBed, FaBath, FaRulerCombined, FaCheckCircle, FaClock, FaShieldAlt,
  FaFlag, FaChevronLeft, FaChevronRight, FaTimes, FaShareAlt,
  FaWifi, FaSnowflake, FaParking, FaUtensils, FaTv, FaLock,
  FaCamera, FaUsers, FaThLarge, FaExpand, FaTag, FaHome, FaEye,
  FaArrowLeft, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { MdApartment, MdBalcony, MdLocalLaundryService, MdElevator } from "react-icons/md";
import { IoShareSocialOutline, IoPricetagOutline } from "react-icons/io5";
import { BsGrid3X3Gap } from "react-icons/bs";

// Styles & Sub-components
import styles from "./ChiTietTinDangNhaTro.module.css";
import TopNavbar from "./TopNavbar/TopNavbar";
import NhaTroPostCard from "./NhaTroPostCard/NhaTroPostCard";
import Footer from "./Footer";

// ─────────────────────────────────────────────────────────────────
// Amenity icon mapping
// ─────────────────────────────────────────────────────────────────
const AMENITY_ICONS = {
  "WiFi": <FaWifi />,
  "Máy lạnh": <FaSnowflake />,
  "Chỗ để xe": <FaParking />,
  "Bếp": <FaUtensils />,
  "TV": <FaTv />,
  "Camera": <FaCamera />,
  "Máy giặt": <MdLocalLaundryService />,
  "Ban công": <MdBalcony />,
  "Thang máy": <MdElevator />,
  "Nhân viên 24/7": <FaUsers />,
  "Khóa thông minh": <FaLock />,
};

// ─────────────────────────────────────────────────────────────────
// Lightbox Component
// ─────────────────────────────────────────────────────────────────
const Lightbox = ({ images, startIndex, onClose, getImageUrl }) => {
  const [current, setCurrent] = useState(startIndex);
  const go = useCallback((dir) => setCurrent(c => (c + dir + images.length) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, go]);

  return (
    <div className={styles.lightboxOverlay} onClick={onClose}>
      <button className={styles.lbClose} onClick={onClose}><FaTimes /></button>
      <button className={styles.lbPrev} onClick={e => { e.stopPropagation(); go(-1); }}><FaChevronLeft /></button>
      <div className={styles.lbContent} onClick={e => e.stopPropagation()}>
        <img src={getImageUrl(images[current])} alt={`Ảnh ${current + 1}`} className={styles.lbImg} />
        <div className={styles.lbCounter}>{current + 1} / {images.length}</div>
      </div>
      <button className={styles.lbNext} onClick={e => { e.stopPropagation(); go(1); }}><FaChevronRight /></button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Skeleton Loading
// ─────────────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className={styles.pageWrapper}>
    <TopNavbar />
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonGallery} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLeft}>
          <div className={styles.skeletonLine} style={{ width: "70%", height: 28 }} />
          <div className={styles.skeletonLine} style={{ width: "40%", height: 20, marginTop: 12 }} />
          <div className={styles.skeletonLine} style={{ width: "100%", height: 80, marginTop: 20 }} />
          <div className={styles.skeletonLine} style={{ width: "100%", height: 120, marginTop: 16 }} />
        </div>
        <div className={styles.skeletonRight}>
          <div className={styles.skeletonBox} />
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
const ChiTietTinDangNhaTro = ({ onOpenChat, initialPost }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const {
    post: fetchedPost, similarPostsByCategory, similarPostsBySeller,
    loading, handleChatWithSeller, isSaved, handleToggleSave
  } = usePostDetails(id, onOpenChat);

  const post = initialPost || fetchedPost;

  const [savedIds, setSavedIds] = useState([]);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const contactCardRef = useRef(null);

  const isLoggedIn = !!(user && token);
  const isOwner = user && post && (user.id === post.maNguoiBan || user.maTV === post.maNguoiBan);

  // Sticky detection for contact card
  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  // ── Helpers ──────────────────────────────────────────────────
  const getDetail = useCallback((key) => {
    const details = post?.chiTietObj || post?.ChiTietObj || {};
    const foundKey = Object.keys(details).find(k => k.toLowerCase().includes(key.toLowerCase()));
    return foundKey ? details[foundKey] : null;
  }, [post]);

  const getImageUrl = useCallback((img) => {
    if (!img) return "https://placehold.co/800x500?text=Không+có+ảnh";
    return img.startsWith("http") ? img : `http://localhost:5133${img}`;
  }, []);

  const formatPriceNhaTro = (price) => {
    if (!price) return "Thỏa thuận";
    if (price >= 1000000) return `${parseFloat((price / 1000000).toFixed(1))} triệu/tháng`;
    return `${(price / 1000).toLocaleString()}k/tháng`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post?.tieuDe, url: window.location.href }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success("Đã copy link!"))
        .catch(() => toast.error("Không copy được link"));
    }
  };

  // ── Tải trạng thái lưu tin ──────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setSavedIds(res.data.map(p => p.maTinDang))).catch(() => { });
  }, [isLoggedIn, token]);

  // ── Loading / Not found ──────────────────────────────────────
  if (loading) return <LoadingSkeleton />;
  if (!post) {
    return (
      <div className={styles.pageWrapper}>
        <TopNavbar />
        <div className={styles.notFound}>
          <FaHome size={48} className={styles.notFoundIcon} />
          <h2>Tin đăng không tồn tại</h2>
          <p>Tin đăng này có thể đã bị xóa hoặc chưa được duyệt.</p>
          <button className={styles.backBtn} onClick={() => navigate("/market/nha-tro")}>
            <FaArrowLeft /> Quay về danh sách
          </button>
        </div>
      </div>
    );
  }

  // ── Data Extraction ──────────────────────────────────────────
  const dienTich = getDetail("dienTich") || getDetail("dt");
  const phongNgu = getDetail("phongNgu") || getDetail("pn");
  const veSinh = getDetail("veSinh") || getDetail("wc");
  const noiThat = getDetail("noiThat");
  const phapLy = getDetail("phapLy");
  const sucChua = getDetail("sucChua") || getDetail("nguoi");
  const loaiPhong = post.danhMuc || getDetail("loaiPhong");

  let tienIchList = [];
  const rawTienIch = getDetail("tienIch");
  if (Array.isArray(rawTienIch)) tienIchList = rawTienIch;
  else if (typeof rawTienIch === "string") tienIchList = rawTienIch.split(",").map(s => s.trim()).filter(Boolean);

  const images = post.images || [];
  const mainImages = images.filter(img => !img.includes(".mp4") && !img.includes(".mov"));
  const displayImages = mainImages.slice(0, 5);
  const hasMoreImages = mainImages.length > 5;

  const sellerInfo = typeof post.nguoiBan === "object" ? post.nguoiBan : {
    fullName: post.nguoiBan,
    phoneNumber: post.phoneNumber,
    avatar: post.avatar,
    id: post.maNguoiBan
  };

  const moTaLines = (post.moTa || "Không có mô tả").split("\n");
  const moTaShort = moTaLines.slice(0, 8).join("\n");
  const moTaFull = post.moTa || "Không có mô tả";
  const hasLongDesc = moTaLines.length > 8;

  return (
    <div className={styles.pageWrapper}>
      <TopNavbar />

      {/* ── Wrapper có padding-top để tránh bị navbar che ── */}
      <div className={styles.mainContent}>

        {/* BREADCRUMB */}
        <div className={styles.breadcrumbBar}>
          <span className={styles.breadcrumbLink} onClick={() => navigate("/market")}>Trang chủ</span>
          <FaChevronRight className={styles.breadSep} />
          <span className={styles.breadcrumbLink} onClick={() => navigate("/market/nha-tro")}>Nhà trọ</span>
          {post.danhMuc && <>
            <FaChevronRight className={styles.breadSep} />
            <span className={styles.breadcrumbLink} onClick={() => navigate("/market/nha-tro")}>{post.danhMuc}</span>
          </>}
          <FaChevronRight className={styles.breadSep} />
          <span className={styles.breadcrumbCurrent}>{post.tieuDe}</span>
        </div>

        <div className={styles.pageGrid}>

          {/* ════════ CỘT TRÁI ════════ */}
          <div className={styles.leftCol}>

            {/* ── GALLERY ── */}
            <div className={styles.gallery}>
              {displayImages.length === 0 ? (
                <div className={styles.noImagePlaceholder}>
                  <FaHome size={48} />
                  <p>Chưa có ảnh</p>
                </div>
              ) : displayImages.length === 1 ? (
                <div className={styles.gallerySingle}
                  onClick={() => { setLightboxIndex(0); setShowLightbox(true); }}>
                  <img src={getImageUrl(displayImages[0])} alt={post.tieuDe} />
                </div>
              ) : (
                <div className={`${styles.galleryGrid} ${styles[`grid${Math.min(displayImages.length, 5)}`]}`}>
                  {displayImages.map((img, i) => (
                    <div key={i} className={`${styles.galleryCell} ${i === 0 ? styles.mainCell : ""}`}
                      onClick={() => { setLightboxIndex(i); setShowLightbox(true); }}>
                      <img src={getImageUrl(img)} alt={`Ảnh ${i + 1}`} loading={i > 0 ? "lazy" : "eager"} />
                      {i === 4 && hasMoreImages && (
                        <div className={styles.moreOverlay}>
                          <BsGrid3X3Gap size={20} />
                          <span>+{mainImages.length - 5}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Gallery action buttons */}
              <div className={styles.galleryActions}>
                {mainImages.length > 1 && (
                  <button className={styles.galleryBtn}
                    onClick={() => { setLightboxIndex(0); setShowLightbox(true); }}>
                    <FaExpand size={13} /> Xem tất cả {mainImages.length} ảnh
                  </button>
                )}
              </div>
            </div>

            {/* ── TITLE + META ── */}
            <div className={styles.titleSection}>
              <div className={styles.categoryTag}>
                <MdApartment />
                <span>{loaiPhong || post.danhMucCha || "Nhà trọ"}</span>
              </div>

              <h1 className={styles.postTitle}>{post.tieuDe}</h1>

              <div className={styles.locationRow}>
                <FaMapMarkerAlt className={styles.locationIcon} />
                <span>{post.diaChi || [post.quanHuyen, post.tinhThanh].filter(Boolean).join(", ")}</span>
              </div>

              <div className={styles.titleMeta}>
                <span className={styles.metaChip}><FaClock size={11} /> {formatRelativeTime(post.ngayDang)}</span>
                <span className={styles.metaChip}><FaFlag size={11} /> Mã: {post.maTinDang}</span>
                {post.soLuotXem > 0 && <span className={styles.metaChip}><FaEye size={11} /> {post.soLuotXem} lượt xem</span>}
              </div>

              {/* Action buttons */}
              <div className={styles.actionRow}>
                <button className={styles.btnShare} onClick={handleShare}>
                  <IoShareSocialOutline /> Chia sẻ
                </button>
                <button
                  className={`${styles.btnSave} ${isSaved ? styles.btnSaveActive : ""}`}
                  onClick={handleToggleSave}
                >
                  {isSaved ? <FaHeart /> : <FaRegHeart />}
                  {isSaved ? "Đã lưu" : "Lưu tin"}
                </button>
              </div>
            </div>

            {/* ── KEY SPECS BAR ── */}
            <div className={styles.specsBar}>
              <div className={styles.specBlock}>
                <span className={styles.specLabel}>Mức giá</span>
                <span className={styles.specValuePrice}>{formatPriceNhaTro(post.gia)}</span>
              </div>
              {dienTich && <>
                <div className={styles.specDivider} />
                <div className={styles.specBlock}>
                  <span className={styles.specLabel}>Diện tích</span>
                  <span className={styles.specValue}><FaRulerCombined size={13} /> {dienTich} m²</span>
                </div>
              </>}
              {sucChua && <>
                <div className={styles.specDivider} />
                <div className={styles.specBlock}>
                  <span className={styles.specLabel}>Sức chứa</span>
                  <span className={styles.specValue}><FaUsers size={13} /> {sucChua} người</span>
                </div>
              </>}
              {phongNgu && <>
                <div className={styles.specDivider} />
                <div className={styles.specBlock}>
                  <span className={styles.specLabel}>Phòng ngủ</span>
                  <span className={styles.specValue}><FaBed size={13} /> {phongNgu} PN</span>
                </div>
              </>}
              {veSinh && <>
                <div className={styles.specDivider} />
                <div className={styles.specBlock}>
                  <span className={styles.specLabel}>Toilet</span>
                  <span className={styles.specValue}><FaBath size={13} /> {veSinh} WC</span>
                </div>
              </>}
            </div>

            {/* ── MÔ TẢ ── */}
            <div className={styles.sectionBox}>
              <h2 className={styles.sectionTitle}>Thông tin mô tả</h2>
              <div className={styles.descText}
                dangerouslySetInnerHTML={{
                  __html: (showFullDesc ? moTaFull : moTaShort).replace(/\n/g, "<br/>")
                }}
              />
              {hasLongDesc && (
                <button className={styles.expandBtn} onClick={() => setShowFullDesc(v => !v)}>
                  {showFullDesc ? <><FaChevronUp /> Thu gọn</> : <><FaChevronDown /> Xem thêm</>}
                </button>
              )}
            </div>

            {/* ── ĐẶC ĐIỂM BẤT ĐỘNG SẢN ── */}
            <div className={styles.sectionBox}>
              <h2 className={styles.sectionTitle}>Đặc điểm bất động sản</h2>
              <div className={styles.featuresGrid}>
                {dienTich && (
                  <div className={styles.featureRow}>
                    <span className={styles.featureKey}><FaRulerCombined /> Diện tích</span>
                    <span className={styles.featureVal}>{dienTich} m²</span>
                  </div>
                )}
                {loaiPhong && (
                  <div className={styles.featureRow}>
                    <span className={styles.featureKey}><MdApartment /> Loại hình</span>
                    <span className={styles.featureVal}>{loaiPhong}</span>
                  </div>
                )}
                {sucChua && (
                  <div className={styles.featureRow}>
                    <span className={styles.featureKey}><FaUsers /> Sức chứa</span>
                    <span className={styles.featureVal}>{sucChua} người</span>
                  </div>
                )}
                {phongNgu && (
                  <div className={styles.featureRow}>
                    <span className={styles.featureKey}><FaBed /> Phòng ngủ</span>
                    <span className={styles.featureVal}>{phongNgu} phòng</span>
                  </div>
                )}
                {veSinh && (
                  <div className={styles.featureRow}>
                    <span className={styles.featureKey}><FaBath /> Toilet</span>
                    <span className={styles.featureVal}>{veSinh} phòng</span>
                  </div>
                )}
                {noiThat && (
                  <div className={styles.featureRow}>
                    <span className={styles.featureKey}><FaCheckCircle /> Nội thất</span>
                    <span className={styles.featureVal}>{noiThat}</span>
                  </div>
                )}
                {phapLy && (
                  <div className={styles.featureRow}>
                    <span className={styles.featureKey}><FaShieldAlt /> Pháp lý</span>
                    <span className={styles.featureVal}>{phapLy}</span>
                  </div>
                )}
                <div className={styles.featureRow}>
                  <span className={styles.featureKey}><IoPricetagOutline /> Đơn giá</span>
                  <span className={styles.featureVal} style={{ color: "#f87d14", fontWeight: 700 }}>
                    {formatPriceNhaTro(post.gia)}
                  </span>
                </div>
                <div className={styles.featureRow}>
                  <span className={styles.featureKey}><FaCheckCircle /> Tình trạng</span>
                  <span className={styles.featureVal}>{post.tinhTrang || post.TinhTrang || "Mới"}</span>
                </div>
                {post.coTheThoaThuan && (
                  <div className={styles.featureRow}>
                    <span className={styles.featureKey}><FaTag /> Thương lượng</span>
                    <span className={styles.featureVal}>Có thể thỏa thuận</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── TIỆN ÍCH ── */}
            {tienIchList.length > 0 && (
              <div className={styles.sectionBox}>
                <h2 className={styles.sectionTitle}>Tiện ích</h2>
                <div className={styles.amenitiesGrid}>
                  {tienIchList.map((item, idx) => (
                    <div key={idx} className={styles.amenityChip}>
                      <span className={styles.amenityIcon}>
                        {AMENITY_ICONS[item] || <FaCheckCircle />}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SIMILAR (trên mobile) ── */}
            {similarPostsByCategory?.length > 0 && (
              <div className={`${styles.sectionBox} ${styles.similarMobile}`}>
                <h2 className={styles.sectionTitle}>Tin tương tự</h2>
                <div className={styles.similarGrid}>
                  {similarPostsByCategory.slice(0, 4).map(p => (
                    <NhaTroPostCard
                      key={p.maTinDang}
                      post={p}
                      isLoggedIn={isLoggedIn}
                      isSaved={savedIds.includes(p.maTinDang)}
                      onToggleSave={(id, saved) => { }}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ════════ CỘT PHẢI (STICKY) ════════ */}
          <div className={styles.rightCol}>
            <div
              className={`${styles.contactCard} ${isSticky ? styles.contactCardSticky : ""}`}
              ref={contactCardRef}
            >
              {/* Giá */}
              <div className={styles.priceHeader}>
                <span className={styles.priceLabel}>Giá thuê</span>
                <span className={styles.priceAmount}>{formatPriceNhaTro(post.gia)}</span>
                {post.coTheThoaThuan && <span className={styles.negotiable}>Thỏa thuận</span>}
              </div>

              {/* Separator */}
              <div className={styles.cardDivider} />

              {/* Seller info */}
              <div className={styles.sellerInfo}>
                <img
                  src={sellerInfo.avatar || sellerInfo.Avatar || "https://placehold.co/56?text=N"}
                  alt={sellerInfo.fullName || sellerInfo.FullName || "Người bán"}
                  className={styles.sellerAvatar}
                  onClick={() => navigate(`/nguoi-dung/${sellerInfo.id || sellerInfo.Id || post.maNguoiBan}`)}
                />
                <div className={styles.sellerText}>
                  <div
                    className={styles.sellerName}
                    onClick={() => navigate(`/nguoi-dung/${sellerInfo.id || sellerInfo.Id || post.maNguoiBan}`)}
                  >
                    {sellerInfo.fullName || sellerInfo.FullName || "Người bán"}
                  </div>
                  <div className={styles.sellerBadge}>
                    <FaCheckCircle size={10} /> Đã xác thực
                  </div>
                </div>
              </div>

              {/* Phone button */}
              <button className={styles.btnCallPhone} onClick={() => setShowPhone(v => !v)}>
                <FaPhoneAlt />
                {showPhone
                  ? (sellerInfo.phoneNumber || sellerInfo.PhoneNumber || "Không có SĐT")
                  : `${(sellerInfo.phoneNumber || sellerInfo.PhoneNumber || "").substring(0, 4)}... · Hiện số`}
              </button>

              {/* Chat button */}
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

              {/* Safety tip */}
              <div className={styles.safetyBox}>
                <FaShieldAlt className={styles.safetyIcon} />
                <p>KHÔNG đóng phí đặt cọc khi chưa xem nhà. Báo cáo tin đăng nếu thấy dấu hiệu lừa đảo.</p>
              </div>

              {/* Key specs summary */}
              <div className={styles.specsQuick}>
                {dienTich && <div className={styles.quickItem}><FaRulerCombined /><span>{dienTich} m²</span></div>}
                {phongNgu && <div className={styles.quickItem}><FaBed /><span>{phongNgu} PN</span></div>}
                {veSinh && <div className={styles.quickItem}><FaBath /><span>{veSinh} WC</span></div>}
                {sucChua && <div className={styles.quickItem}><FaUsers /><span>{sucChua} người</span></div>}
              </div>
            </div>
          </div>

        </div>

        {/* ── SIMILAR POSTS (desktop) ── */}
        {similarPostsByCategory?.length > 0 && (
          <div className={styles.similarSection}>
            <div className={styles.similarHeader}>
              <h2 className={styles.sectionTitle}>Tin đăng tương tự</h2>
              <Link to="/market/nha-tro" className={styles.viewAllBtn}>
                Xem tất cả <FaChevronRight size={11} />
              </Link>
            </div>
            <div className={styles.similarGrid}>
              {similarPostsByCategory.slice(0, 4).map(p => (
                <NhaTroPostCard
                  key={p.maTinDang}
                  post={p}
                  isLoggedIn={isLoggedIn}
                  isSaved={savedIds.includes(p.maTinDang)}
                  onToggleSave={(pid, saved) => { }}
                />
              ))}
            </div>
          </div>
        )}

        {similarPostsBySeller?.length > 0 && (
          <div className={styles.similarSection}>
            <div className={styles.similarHeader}>
              <h2 className={styles.sectionTitle}>Tin khác từ người đăng này</h2>
            </div>
            <div className={styles.similarGrid}>
              {similarPostsBySeller.slice(0, 4).map(p => (
                <NhaTroPostCard
                  key={p.maTinDang}
                  post={p}
                  isLoggedIn={isLoggedIn}
                  isSaved={savedIds.includes(p.maTinDang)}
                  onToggleSave={(pid, saved) => { }}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      <Footer />

      {/* Lightbox */}
      {showLightbox && mainImages.length > 0 && (
        <Lightbox
          images={mainImages}
          startIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
          getImageUrl={getImageUrl}
        />
      )}
    </div>
  );
};

export default ChiTietTinDangNhaTro;
