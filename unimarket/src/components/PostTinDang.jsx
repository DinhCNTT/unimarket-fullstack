import React from "react";
import TopNavbar from "./TopNavbar/TopNavbar";
import styles from "./PostTinDang.module.css";
import PreviewModal from "./PreviewModal";
import MobileForm from "./CategoryForms/MobileForm";
import RoomRentalForm from "./CategoryForms/RoomRentalForm";
import usePostTinDang from "../hooks/usePostTinDang"; // 👈 Đảm bảo đường dẫn import đúng

const PostTinDang = () => {
  // 1. Gọi Hook để lấy logic và state
  const {
    imageInputRef, videoInputRef,
    categoryName, title, description, price, contactInfo,
    condition, province, district, canNegotiate,
    statusMessage, tinhThanhList, quanHuyenList,
    previewData, showPreview, activePreviewMedia,
    dynamicData, isLoading, isMobileCategory, isRoomRentalCategory,
    imageFiles, videoFiles, previewImages, previewVideos,
    TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, MAX_IMAGES, MAX_VIDEOS, conditionMap,
    setContactInfo, setCondition, setProvince, setDistrict, setCanNegotiate, setActivePreviewMedia,
    handleDynamicDataChange, handleTitleChange, handleDescriptionChange, handlePriceChange,
    handleImageChange, handleVideoChange, removeImage, removeVideo, handlePreview, handleSubmit,
  } = usePostTinDang();

  // 2. Render giao diện
  return (
    <div className={styles.container}>
      <TopNavbar />
      {statusMessage && (
        <p className={`${styles.status} ${statusMessage.includes("thất bại") ? styles.error : ""}`}>
          {statusMessage}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        
        {/* --- KHU VỰC CHIA 2 CỘT (FLEXBOX) --- */}
        <div className={styles.formLayout}>
          
          {/* CỘT TRÁI: ẢNH VÀ VIDEO */}
          <div className={styles.leftColumn}>
            <div className={styles.mediaSection}>
              <div className={styles.mediaBox}>
                
                {/* Upload Ảnh */}
                <label className={styles.uploadBox}>
                  <div className={styles.boxHeader}>
                    <i className={styles.infoIcon}>ℹ️</i>
                    <span className={styles.mediaTitle}>Hình ảnh hợp lệ</span>
                  </div>
                  <div className={styles.iconContainer}>
                    <div className={styles.cameraIcon} />
                  </div>
                  <p className={styles.uploadText}>ĐĂNG TỪ 01 ĐẾN 07 HÌNH</p>
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    multiple
                    accept="image/*"
                    disabled={imageFiles.length >= MAX_IMAGES}
                  />
                </label>
                {imageFiles.length >= MAX_IMAGES && (
                  <p className={styles.errorText}>Đã đạt giới hạn tối đa {MAX_IMAGES} ảnh</p>
                )}
                
                <div className={styles.previewList}>
                  {previewImages.map((image, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      <img src={image.url} alt={`preview ${idx}`} />
                      <button type="button" onClick={() => removeImage(idx)}>×</button>
                    </div>
                  ))}
                </div>

                {/* Upload Video */}
                <label className={styles.uploadBox}>
                  <div className={styles.boxHeader}>
                    <i className={styles.infoIcon}>ℹ️</i>
                    <span className={styles.mediaTitle}>
                      Bán nhanh hơn với <span className={styles.highlight}>Unimarket Video</span>
                    </span>
                  </div>
                  <div className={styles.iconContainer}>
                    <div className={styles.videoIcon} />
                  </div>
                  <p className={styles.subNote}>
                    Video sẽ xuất hiện <span className={styles.highlight}>MIỄN PHÍ</span> trên Unimarket Video
                  </p>
                  <p className={styles.subNote}>
                    Chỉ được đăng <span className={styles.highlight}>1 VIDEO DƯỚI 60 GIÂY</span>
                  </p>
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoChange}
                    accept="video/*"
                    disabled={videoFiles.length >= MAX_VIDEOS}
                  />
                </label>
                {videoFiles.length >= MAX_VIDEOS && (
                  <p className={styles.errorText}>Chỉ cho phép 1 video</p>
                )}
                <div className={styles.previewList}>
                  {previewVideos.map((video, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      <video src={video.url} controls />
                      <button type="button" onClick={() => removeVideo(idx)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: FORM NHẬP LIỆU */}
          <div className={styles.rightColumn}>
            
            {categoryName && (
              <div className={styles.formGroup}>
                <label>Danh mục con đã chọn</label>
                <textarea value={`Danh mục con đã chọn: ${categoryName}`} readOnly rows="2" style={{height: 'auto'}} />
              </div>
            )}

            {isMobileCategory && (
              <MobileForm 
                data={dynamicData} 
                onChange={handleDynamicDataChange} 
              />
            )}

            {isRoomRentalCategory && (
              <RoomRentalForm 
                data={dynamicData} 
                onChange={handleDynamicDataChange} 
              />
            )}

            <div className={styles.formGroup}>
              <label>Tiêu đề (tối đa {TITLE_MAX_LENGTH} ký tự)</label>
              <input 
                type="text" 
                value={title} 
                onChange={handleTitleChange} 
                maxLength={TITLE_MAX_LENGTH} 
                required 
                placeholder="VD: Samsung Galaxy S23 Ultra cũ..."
              />
              <div className={styles.charCounter}>{title.length}/{TITLE_MAX_LENGTH}</div>
            </div>

            <div className={styles.formGroup}>
              <label>Mô tả (tối đa {DESCRIPTION_MAX_LENGTH} ký tự)</label>
              <textarea 
                value={description} 
                onChange={handleDescriptionChange} 
                maxLength={DESCRIPTION_MAX_LENGTH} 
                required 
                style={{ height: "150px" }}
                placeholder="Mô tả chi tiết về sản phẩm..."
              />
              <div className={styles.charCounter}>{description.length}/{DESCRIPTION_MAX_LENGTH}</div>
            </div>

            <div className={styles.formGroup}>
              <label>Giá (VNĐ)</label>
              <input type="text" value={price} onChange={handlePriceChange} required placeholder="Nhập giá bán mong muốn..." />
            </div>

            <div className={styles.formGroup}>
              <label>Địa chỉ cụ thể</label>
              <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required placeholder="Số nhà, đường..." />
            </div>

            <div className={styles.formGroup}>
              <label>Tình trạng sản phẩm</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} required>
                <option value="Moi">{conditionMap.Moi}</option>
                <option value="DaSuDung">{conditionMap.DaSuDung}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>      
                Có thể thương lượng 
                <input 
                  type="checkbox" 
                  checked={canNegotiate} 
                  onChange={(e) => setCanNegotiate(e.target.checked)} 
                /> 
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>Tỉnh/Thành</label>
              <select value={province} onChange={(e) => setProvince(e.target.value)} required>
                <option value="">Chọn tỉnh thành</option>
                {tinhThanhList.map((tinh) => (
                  <option key={tinh.maTinhThanh} value={tinh.maTinhThanh}>{tinh.tenTinhThanh}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Quận/Huyện</label>
              <select value={district} onChange={(e) => setDistrict(e.target.value)} required>
                <option value="">Chọn quận huyện</option>
                {quanHuyenList.map((quan) => (
                  <option key={quan.maQuanHuyen} value={quan.maQuanHuyen}>{quan.tenQuanHuyen}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ===== FIELDS PHÒNG TRỌ/BẤT ĐỘNG SẢN (CONDITIONAL) ===== */}
        
        <div className={styles.btnGroup}>
          <button
            type="button"
            onClick={handlePreview}
            className={showPreview ? styles.active : ""}
          >
            {showPreview ? "Đóng Xem trước" : "Xem Trước"}
          </button>
          
          <button 
            type="submit" 
            disabled={isLoading} 
            className={isLoading ? styles.btnLoading : ""}
          >
             {isLoading ? "Đang xử lý... ⏳" : "Đăng Tin"}
          </button>
        </div>

        <PreviewModal 
          showPreview={showPreview}
          previewData={previewData}
          activePreviewMedia={activePreviewMedia}
          setActivePreviewMedia={setActivePreviewMedia}
          onClose={handlePreview}
        />
      </form>
    </div>
  );
};

export default PostTinDang;