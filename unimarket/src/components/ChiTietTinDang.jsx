import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios"; // Thêm axios
import toast from "react-hot-toast"; // Thêm toast
import styles from "./ChiTietTinDang.module.css";
import { AuthContext } from "../context/AuthContext";
import { usePostDetails } from "../hooks/usePostDetails";
import { formatPrice, getMediaUrl } from "../utils/formatters";
import { viewHistoryService } from "../services/viewHistoryService"; // Import service tracking


// --- IMPORTS COMPONENTS ---
import TopNavbar from "./TopNavbar/TopNavbar";
import FloatingProductBox from "../components/FloatingProductBox";
import PostImageCarousel from "../components/PostImageCarousel";
import PostDetailsInfo from "../components/PostDetailsInfo";
import PostDescription from "../components/PostDescription";
import PostTechnicalSpecs from "../components/PostTechnicalSpecs";
import SimilarPostsSection from "../components/SimilarPostsSection";
import Lightbox from "../components/Lightbox";
import PostComments from "../components/PostComments";


/**
 * Trang Chi Tiết Tin Đăng (Cập nhật đồng bộ nút Trái tim)
 */
const ChiTietTinDang = ({ onOpenChat }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext); // Lấy user và token


  const {
    post,
    similarPostsByCategory,
    similarPostsBySeller,
    loading,
    handleChatWithSeller,
  } = usePostDetails(id, onOpenChat);


  const [showFloatingBox, setShowFloatingBox] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);


  // --- QUẢN LÝ TRẠNG THÁI LƯU TIN (ĐỒNG BỘ) ---
  const [savedIds, setSavedIds] = useState([]);
  const isLoggedIn = !!(user && token);


  // 1. Tải danh sách ID các tin đã lưu của user
  useEffect(() => {
    const fetchSavedIds = async () => {
      if (isLoggedIn) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSavedIds(res.data.map((p) => p.maTinDang));
        } catch (err) {
          console.error("Lỗi lấy danh sách yêu thích:", err);
        }
      }
    };
    fetchSavedIds();
  }, [isLoggedIn, token]);

  // 2. TRACK VIEW - Gọi API tracking khi component mount hoặc khi post thay đổi
  useEffect(() => {
    if (post?.maTinDang && isLoggedIn) {
      // Gọi tracking ngay lập tức
      console.log(`📍 Tracking view for post: ${post.maTinDang}, isLoggedIn: ${isLoggedIn}`);

      viewHistoryService.trackView(post.maTinDang)
        .then(() => {
          console.log(`✅ Successfully tracked view for post: ${post.maTinDang}`);
        })
        .catch((err) => {
          console.error(`❌ Failed to track view for ${post.maTinDang}:`, err);
        });
    }
  }, [post?.maTinDang, isLoggedIn]);

  // 2. Hàm xử lý lưu/bỏ lưu tin dùng chung (Global)
  const handleGlobalToggleSave = async (postId, isCurrentlySaved) => {
    if (!isLoggedIn) {
      return toast.error("Vui lòng đăng nhập để lưu tin!", {
        icon: '🔒',
      });
    }


    try {
      if (isCurrentlySaved) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedIds((prev) => prev.filter((item) => item !== postId));
        toast.success("Đã gỡ lưu tin");
      } else {
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${postId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedIds((prev) => [...prev, postId]);
        toast.success("Đã lưu tin thành công!", { icon: '❤️' });
      }
    } catch (err) {
      toast.error("Thao tác thất bại, vui lòng thử lại!");
    }
  };


  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBox(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };
  const handleCloseLightbox = () => setShowLightbox(false);


  const handleChatClick = () => {
    handleChatWithSeller();
  };


  const handleViewShop = () => {
    if (post && post.maNguoiBan) {
      navigate(`/nguoi-dung/${post.maNguoiBan}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };


  if (loading) return <div className={styles.loading}>Đang tải thông tin...</div>;
  if (!post) return <div className={styles.notFound}>Không tìm thấy tin đăng.</div>;


  const formattedPrice = formatPrice(post.gia);


  return (
    <div className={styles.chiTietTinDang}>
      <TopNavbar />


      {/* --- FLOATING BOX --- */}
      {showFloatingBox && (
        <FloatingProductBox
          image={getMediaUrl(post.images?.[0])}
          title={post.tieuDe}
          price={formattedPrice}
          details={<>
            <span>{post.loaiSanPham || post.tieuDe}</span>
            {post.dungLuong && <span> | {post.dungLuong}</span>}
            {post.thoiGianBaoHanh && <span> | {post.thoiGianBaoHanh}</span>}
          </>}
          description={post.moTa ? post.moTa.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').slice(0, 120) + (post.moTa.length > 120 ? '...' : '') : ''}
          onShowPhone={() => setShowPhoneNumber((s) => !s)}
          showPhone={showPhoneNumber}
          phoneMasked={`${post.phoneNumber?.substring(0, 6)}****`}
          phone={post.phoneNumber}
          onChat={handleChatClick}
          currentUserId={user?.id}
          sellerId={post.maNguoiBan}
          targetId={post.maTinDang || id}
        />
      )}


      {/* --- HEADER TIN ĐĂNG --- */}
      <div className={styles.tinDangHeader} id="tong-quan">
        <div className={styles.imageContainer}>
          <PostImageCarousel
            images={post.images}
            onImageClick={handleOpenLightbox}
          />
        </div>


        <div className={styles.chiTietTinDangInfoWrapper}>
          <PostDetailsInfo
            post={post}
            formattedPrice={formattedPrice}
            currentUserId={user?.id}
            onChat={handleChatClick}
            // Cập nhật để dùng chung logic lưu tin
            isSaved={savedIds.includes(post.maTinDang)}
            onToggleSave={() => handleGlobalToggleSave(post.maTinDang, savedIds.includes(post.maTinDang))}
            showPhoneNumber={showPhoneNumber}
            onTogglePhone={() => setShowPhoneNumber((s) => !s)}
          />
        </div>
      </div>


      {/* --- MAIN CONTENT --- */}
      <div className={styles.descriptionAndCommentsWrapper}>
        <div className={styles.descriptionContainer} id="mo-ta-chi-tiet">
          <PostDescription description={post.moTa} />

          {/* ✅ AUTO-DETECT: Nếu danh mục cha là "Nhà trọ" -> hiển thị NhaTroDetails */}
          {post.danhMucCha?.toLowerCase().includes("nhà trọ") ? (
            <NhaTroDetails
              detailsJson={post.ChiTietObj || post.chiTietObj}
            />
          ) : (
            <PostTechnicalSpecs
              detailsJson={post.ChiTietObj || post.chiTietObj}
              TinhTrang={post.TinhTrang || post.tinhTrang}      
              CoTheThoaThuan={post.CoTheThoaThuan || post.coTheThoaThuan}
            />
          )}
        </div>


        <div className={styles.commentsContainer} id="binh-luan">
          <PostComments maTinDang={post.maTinDang} />
        </div>
      </div>
     
      {/* --- CÁC TIN ĐĂNG LIÊN QUAN --- */}
      <div id="cac-tin-dang-khac">
        <SimilarPostsSection
          title={`Các tin đăng khác của ${post.nguoiBan}`}
          posts={similarPostsBySeller}
          mode="carousel"
          onViewShop={handleViewShop}
          // Truyền Props để hiện nút Trái tim
          isLoggedIn={isLoggedIn}
          savedIds={savedIds}
          onToggleSave={handleGlobalToggleSave}
        />
      </div>


      <div id="tin-dang-tuong-tu">
        <SimilarPostsSection
          title="Tin đăng tương tự"
          posts={similarPostsByCategory}
          mode="grid"    
          // Truyền Props để hiện nút Trái tim
          isLoggedIn={isLoggedIn}
          savedIds={savedIds}
          onToggleSave={handleGlobalToggleSave}
        />
      </div>


      {showLightbox && (
        <Lightbox
          images={post.images}
          startIndex={lightboxIndex}
          onClose={handleCloseLightbox}
        />
      )}
    </div>
  );
};


export default ChiTietTinDang;