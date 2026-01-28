import React from "react";
import styles from "./CapNhatTin.module.css";

const MediaManager = ({ 
  imagePreviewList, 
  videoPreviewList, 
  handleImageChange, 
  handleVideoChange, 
  handleRemoveImage, 
  handleRemoveVideo, 
  moveImage 
}) => {
  return (
    <div className={styles.leftColumn}>
      {/* Box Ảnh */}
      <div className={styles.mediaBox}>
        <div className={styles.mediaHeader}>
          <div className={styles.iconCamera}></div>
          <span className={styles.mediaTitle}>Hình ảnh <span className={styles.mediaNote}>(tối đa 7 ảnh)</span></span>
        </div>
        <div className={styles.uploadArea}>
          <input type="file" className={styles.fileInput} onChange={handleImageChange} multiple accept="image/*" disabled={imagePreviewList.length >= 7} />
          <div className={styles.uploadText}><span className={styles.highlight}>Chọn ảnh</span> để tải lên</div>
          <div className={styles.subNote}>Ảnh đầu tiên là <span className={styles.highlight}>ảnh bìa</span></div>
        </div>
        
        {imagePreviewList.length > 0 && (
          <div className={styles.previewList}>
            {imagePreviewList.map((img, idx) => (
              <div key={`${img.type}-${img.id || img.fileName || idx}`} className={styles.previewItem}>
                <img src={img.url} alt={`Ảnh ${idx + 1}`} />
                {idx === 0 && <div className={styles.badge}>Ảnh bìa</div>}
                {img.type === 'old' && <div className={styles.badge} style={{top: '25px', backgroundColor: '#28a745'}}>CŨ</div>}
                {img.type === 'new' && <div className={styles.badge} style={{top: '25px', backgroundColor: '#007bff'}}>MỚI</div>}
                
                <button type="button" className={styles.removeBtn} onClick={() => handleRemoveImage(idx)}>×</button>
                <div className={styles.moveControls}>
                  <button type="button" className={styles.moveBtn} onClick={() => moveImage(idx, idx - 1)} disabled={idx === 0}>‹</button>
                  <button type="button" className={styles.moveBtn} onClick={() => moveImage(idx, idx + 1)} disabled={idx === imagePreviewList.length - 1}>›</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className={styles.counter}>{imagePreviewList.length}/7 ảnh</div>
      </div>

      {/* Box Video */}
      <div className={styles.mediaBox}>
        <div className={styles.mediaHeader}>
          <div className={styles.iconVideo}></div>
          <span className={styles.mediaTitle}>Video <span className={styles.mediaNote}>(tối đa 1 video)</span></span>
        </div>
        <div className={styles.uploadArea}>
          <input type="file" className={styles.fileInput} onChange={handleVideoChange} accept="video/*" disabled={videoPreviewList.length >= 1} />
          <div className={styles.uploadText}><span className={styles.highlight}>Chọn video</span> để tải lên</div>
        </div>
        {videoPreviewList.length > 0 && (
          <div className={styles.previewList}>
            {videoPreviewList.map((video, idx) => (
              <div key={`${video.type}-${video.id || video.fileName || idx}`} className={styles.previewItem}>
                <video src={video.url} controls muted />
                <button type="button" className={styles.removeBtn} onClick={() => handleRemoveVideo(idx)}>×</button>
              </div>
            ))}
          </div>
        )}
        <div className={styles.counter}>{videoPreviewList.length}/1 video</div>
      </div>
    </div>
  );
};

export default MediaManager;