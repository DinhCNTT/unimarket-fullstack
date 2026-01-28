import React, { useRef } from "react";

// --- Imports Components Ngoài ---
import StickyInfoBar from "../StickyInfoBar"; 

// --- Imports Custom Hooks ---
import { useChatAction } from "./hooks/useChatAction.jsx";
import { usePanelScrollLock } from "./hooks/usePanelScrollLock";

// --- Imports Components Con ---
import PanelHeader from "./components/PanelHeader/PanelHeader";
import ImageCarousel from "./components/ImageCarousel/ImageCarousel";
import InfoGrid from "./components/InfoGrid/InfoGrid";
import SellerSection from "./components/SellerSection/SellerSection";
import DescriptionSection from "./components/DescriptionSection/DescriptionSection";
// 🔥 COMPONENT MỚI: Hiển thị thông số chi tiết
import TechnicalSpecsSection from "./TechnicalSpecsSection/TechnicalSpecsSection";

// --- CSS Module ---
import styles from "./VideoDetailsPanel.module.css";

const VideoDetailsPanel = ({
  isOpen,
  onClose,
  loading,
  data,
  user,
  onOpenChat,
}) => {
  const panelRef = useRef(null);
  
  // 1. Logic: Khóa cuộn trang chính khi mở Panel
  usePanelScrollLock(isOpen, panelRef);

  // 2. Logic: Xử lý chat và lấy ID người dùng/người bán
  const { handleChatWithSeller, getUserId, getSellerId } = useChatAction();

  if (!isOpen) return null;

  // 3. Logic: Ngăn sự kiện cuộn lan ra ngoài panel (Scroll Propagation)
  const stopScrollPropagation = (e) => e.stopPropagation();

  // 4. Logic: Kiểm tra xem người xem có phải là người đăng không
  const isSelf = getUserId(user) === getSellerId(data?.nguoiDang);

  // 5. Logic: Xử lý an toàn khi truy cập dữ liệu
  const technicalSpecsData = data?.thongSoChiTiet || data?.ThongSoChiTiet;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.panel}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()} // Ngăn click đóng panel khi click vào nội dung
        onWheel={stopScrollPropagation}
        onTouchMove={stopScrollPropagation}
      >
        {/* --- STICKY BAR: Hiện thông tin khi cuộn xuống --- */}
        <StickyInfoBar
          data={data}
          user={user}
          onOpenChat={() => handleChatWithSeller(user, data, onOpenChat)}
          panelRef={panelRef}
        />

        {/* --- HEADER: Nút đóng --- */}
        <PanelHeader onClose={onClose} />

        <div className={styles.scrollContent}>
          {loading ? (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <span>Đang tải thông tin...</span>
            </div>
          ) : data ? (
            <div className={styles.content}>
              
              {/* --- 1. BADGE DANH MỤC --- */}
              {data.danhMuc && (
                <div className={styles.categoryBadge}>
                  Danh mục: {data.danhMuc.tenDanhMuc}
                  {data.danhMuc.danhMucCha && (
                    <span> ({data.danhMuc.danhMucCha.tenDanhMucCha})</span>
                  )}
                </div>
              )}

              {/* --- 2. TIÊU ĐỀ & GIÁ --- */}
              <h4 className={styles.mainTitle}>{data.tieuDe}</h4>
              <div className={styles.priceSection}>
                <span className={styles.priceValue}>
                    {data.gia?.toLocaleString()} đ
                </span>
                {data.coTheThoaThuan && (
                  <span className={styles.priceNote}>(Có thể thương lượng)</span>
                )}
              </div>

              {/* --- 3. SLIDER ẢNH --- */}
              {data.danhSachAnh?.length > 0 && (
                <ImageCarousel images={data.danhSachAnh} />
              )}

              {/* --- 4. THÔNG TIN CƠ BẢN (Grid) --- */}
              <InfoGrid data={data} />

              {/* --- 5. NGƯỜI BÁN --- */}
              {data.nguoiDang && (
                <SellerSection
                  data={data}
                  user={user}
                  isSelf={isSelf}
                  onChatClick={() => handleChatWithSeller(user, data, onOpenChat)}
                />
              )}

              {/* --- 6. MÔ TẢ CHI TIẾT --- */}
              {/* 👇 ĐÃ SỬA: Thêm ID để scroll tìm thấy vị trí này */}
              {data.moTa && (
                <div id="section-description">
                    <DescriptionSection text={data.moTa} />
                </div>
              )}

              {/* --- 7. THÔNG SỐ KỸ THUẬT --- */}
              {/* 👇 ĐÃ SỬA: Thêm ID để scroll tìm thấy vị trí này */}
              {technicalSpecsData && (
                <div id="section-specs">
                    <TechnicalSpecsSection data={technicalSpecsData} />
                </div>
              )}

            </div>
          ) : (
            <div className={styles.error}>Không tìm thấy thông tin chi tiết.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetailsPanel;