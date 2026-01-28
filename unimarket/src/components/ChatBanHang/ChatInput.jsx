import React, { useState, useRef, useCallback } from "react";
import { useChat } from "./context/ChatContext";
import axios from "axios";
import Swal from "sweetalert2";
import styles from './ModuleChatCss/ChatInput.module.css';
import { FaImage, FaVideo, FaPaperPlane, FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import LocationPickerModal from "./LocationPickerModal";

const CLOUDINARY_UPLOAD_PRESET = "unimarket_upload";
const CLOUDINARY_CLOUD_NAME = "dcwe8drcu";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const MAX_CHARS = 500; // ✅ Giới hạn 500 ký tự

const ChatInput = ({ tinNhan, setTinNhan, isUploading, setIsUploading, isDisabled, inputRef }) => {
  const { isConnected, isBlockedByMe, isBlockedByOther, sendMessageService } = useChat();
  const [isLocating, setIsLocating] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [initialMapCoords, setInitialMapCoords] = useState(null);

  const [imagePreviewList, setImagePreviewList] = useState([]);
  const [videoPreviewList, setVideoPreviewList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const abortControllerRef = useRef(null);
  const fileInputImageRef = useRef(null);
  const fileInputVideoRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const images = files.filter(f => f.type.startsWith("image/"));
    const videos = files.filter(f => f.type.startsWith("video/"));

    if (images.length > 0) {
      const validImages = images.filter(f => {
        if (f.size > MAX_FILE_SIZE) {
          Swal.fire("Lỗi", `Ảnh "${f.name}" quá lớn (tối đa 10MB)!`, "error");
          return false;
        }
        return true;
      }).slice(0, MAX_FILES - imagePreviewList.length);
      setImagePreviewList(prev => [...prev, ...validImages]);
    }

    if (videos.length > 0) {
      const validVideos = videos.filter(f => {
        if (f.size > MAX_FILE_SIZE) {
          Swal.fire("Lỗi", `Video "${f.name}" quá lớn (tối đa 10MB)!`, "error");
          return false;
        }
        return true;
      }).slice(0, MAX_FILES - videoPreviewList.length);
      setVideoPreviewList(prev => [...prev, ...validVideos]);
    }
  }, [imagePreviewList.length, videoPreviewList.length]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file && file.size <= MAX_FILE_SIZE) {
          setImagePreviewList(prev => {
            if (prev.length >= MAX_FILES) {
              Swal.fire("Cảnh báo", `Chỉ được chọn tối đa ${MAX_FILES} ảnh!`, "warning");
              return prev;
            }
            return [...prev, file];
          });
        } else if (file) {
          Swal.fire("Lỗi", "Ảnh dán quá lớn (tối đa 10MB)!", "error");
        }
      }
    }
  }, []);

  const sendFinalLocation = useCallback((lat, lng) => {
    // Format link này tương thích với cả Web và App, và regex trong MessageItem vẫn bắt được tốt
    const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
    
    try {
      sendMessageService(mapLink, "location");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Lỗi gửi vị trí:", error);
      Swal.fire("Lỗi", "Không thể gửi vị trí.", "error");
    } finally {
      setIsUploading(false);
      setIsLocating(false);
    }
  }, [sendMessageService, setIsUploading, inputRef]);

  // 👇 4. HÀM XỬ LÝ KHI NGƯỜI DÙNG CHỐT VỊ TRÍ TRÊN BẢN ĐỒ
  const handleMapConfirm = (coords) => {
    setShowMapPicker(false);
    sendFinalLocation(coords.lat, coords.lng);
  };

  const handleSendLocation = useCallback(() => {
    if (!navigator.geolocation) {
      Swal.fire("Lỗi", "Trình duyệt không hỗ trợ định vị.", "error");
      return;
    }

    setIsLocating(true);

    const options = {
      enableHighAccuracy: true, // Thử mode chính xác cao xem sao
      timeout: 20000,           // ⚡ Yêu cầu 1: Timeout trình duyệt 20s
      maximumAge: Infinity     // ⚡ Quan trọng: Cho phép lấy vị trí cũ (Wifi) để không bị null
    };

    let bestPosition = null;
    let watchId = null;
    let locationTimeout = null;

    const finishLocating = (positionToSend) => {
      // Dọn dẹp listener
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (locationTimeout) clearTimeout(locationTimeout);
      
      setIsLocating(false);

      // Trường hợp xấu nhất: 7s trôi qua mà vẫn null (mất mạng/lỗi driver GPS)
      if (!positionToSend) {
        console.warn("⚠️ Hết 7s vẫn không có tọa độ -> Bắt buộc mở bản đồ.");
        // Mặc định về Bitexco hoặc vị trí trung tâm nào đó
        setInitialMapCoords({ lat: 10.762622, lng: 106.660172 });
        setShowMapPicker(true);
        return;
      }

      const { latitude, longitude, accuracy } = positionToSend.coords;
      console.log(`🎯 Kết quả cuối cùng - Độ chính xác: ${accuracy}m`);

      // ⚡ Yêu cầu 2: Nếu lệch trên 200m thì mới mở bản đồ
      if (accuracy > 200) {
        setInitialMapCoords({ lat: latitude, lng: longitude });
        setShowMapPicker(true);
      } else {
        // Nếu lệch <= 200m (VD: 106m của Laptop) -> Gửi luôn
        sendFinalLocation(latitude, longitude);
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        bestPosition = position;
        
        // Nếu vớ được tọa độ ngon (< 50m) thì chốt đơn ngay, khỏi chờ đủ 7s
        if (position.coords.accuracy < 50) {
           finishLocating(position);
        }
      },
      (error) => { console.warn("Lỗi dò GPS:", error); },
      options
    );

    // ⚡ Yêu cầu 1: Set cứng thời gian chờ là 7 giây
    locationTimeout = setTimeout(() => {
      console.log("⏰ Đã hết 7 giây. Chốt kết quả tốt nhất hiện có.");
      finishLocating(bestPosition); 
    }, 7000); 

  }, [sendFinalLocation]);

  const uploadToCloudinary = useCallback(async (file, onProgress) => {
    if (file.size > MAX_FILE_SIZE) {
      Swal.fire("Lỗi", `File "${file.name}" quá lớn. Tối đa 10MB!`, "error");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "doan-chat");

    abortControllerRef.current = new AbortController();

    try {
      const { data } = await axios.post(CLOUDINARY_URL, formData, {
        signal: abortControllerRef.current.signal,
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        }
      });
      return data.secure_url;
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Upload cancelled");
        return null;
      }
      console.error("Upload error:", err);
      Swal.fire("Lỗi", `Không thể upload "${file.name}"!`, "error");
      return null;
    }
  }, []);

  const handleFileInputChange = useCallback((e, type) => {
    const files = Array.from(e.target.files);

    if (type === "image") {
      const currentTotal = imagePreviewList.length;
      if (currentTotal + files.length > MAX_FILES) {
        Swal.fire("Cảnh báo", `Chỉ được chọn tối đa ${MAX_FILES} ảnh!`, "warning");
        return;
      }

      const validImages = files.filter((f) => {
        if (!f.type.startsWith("image")) return false;
        if (f.size > MAX_FILE_SIZE) {
          Swal.fire("Lỗi", `Ảnh "${f.name}" quá lớn (tối đa 10MB)!`, "error");
          return false;
        }
        return true;
      });
      setImagePreviewList((prev) => [...prev, ...validImages]);
    } else {
      const currentTotal = videoPreviewList.length;
      if (currentTotal + files.length > MAX_FILES) {
        Swal.fire("Cảnh báo", `Chỉ được chọn tối đa ${MAX_FILES} video!`, "warning");
        return;
      }

      const validVideos = files.filter((f) => {
        if (!f.type.startsWith("video")) return false;
        if (f.size > MAX_FILE_SIZE) {
          Swal.fire("Lỗi", `Video "${f.name}" quá lớn (tối đa 10MB)!`, "error");
          return false;
        }
        return true;
      });
      setVideoPreviewList((prev) => [...prev, ...validVideos]);
    }
    e.target.value = null;
  }, [imagePreviewList.length, videoPreviewList.length]);

  const removeImagePreview = useCallback((idx) => {
    setImagePreviewList((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const removeVideoPreview = useCallback((idx) => {
    setVideoPreviewList((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSend = useCallback(async () => {

    if (!tinNhan.trim() && imagePreviewList.length === 0 && videoPreviewList.length === 0) {
      Swal.fire("Lỗi", "Vui lòng nhập tin nhắn hoặc gửi ảnh/video", "error");
      return;
    }

    if (isBlockedByOther || isBlockedByMe) {
      Swal.fire("Lỗi", "Không thể gửi tin nhắn vì bạn đã bị chặn.", "error");
      return;
    }

    if (!isConnected) {
      Swal.fire("Lỗi", "Kết nối SignalR không sẵn sàng!", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (tinNhan.trim()) {
  await sendMessageService(tinNhan.trim(), "text");
  setTinNhan("");

  // Reset chiều cao textarea
  if (inputRef.current) {
    inputRef.current.style.height = "auto";
  }
}

      const totalFiles = imagePreviewList.length + videoPreviewList.length;
      let uploadedCount = 0;

      if (imagePreviewList.length > 0) {
        const imageUploads = imagePreviewList.map(async (file) => {
          const url = await uploadToCloudinary(file, (progress) => {
            const fileProgress = (uploadedCount / totalFiles) * 100;
            setUploadProgress(fileProgress + (progress / totalFiles));
          });
          uploadedCount++;
          if (url) {
            await sendMessageService(url, "image");
          }
          return url;
        });
        await Promise.allSettled(imageUploads);
      }

      if (videoPreviewList.length > 0) {
        const videoUploads = videoPreviewList.map(async (file) => {
          const url = await uploadToCloudinary(file, (progress) => {
            const fileProgress = (uploadedCount / totalFiles) * 100;
            setUploadProgress(fileProgress + (progress / totalFiles));
          });
          uploadedCount++;
          if (url) {
            await sendMessageService(url, "video");
          }
          return url;
        });
        await Promise.allSettled(videoUploads);
      }

      setUploadProgress(100);
      setImagePreviewList([]);
      setVideoPreviewList([]);
      inputRef.current?.focus();
    } catch (err) {
      Swal.fire("Lỗi", err.message || "Không thể gửi tin nhắn!", "error");
      console.error("Send error:", err);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 300);
    }
  }, [
    tinNhan, imagePreviewList, videoPreviewList, isBlockedByOther,
    isBlockedByMe, isConnected, sendMessageService, uploadToCloudinary,
    setIsUploading, setTinNhan, inputRef
  ]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Listen for quick-reply events to send immediately in this chat context
  React.useEffect(() => {
    const onQuickReply = async (e) => {
      const text = e?.detail?.text;
      if (!text) return;
      try {
        if (sendMessageService) {
          await sendMessageService(text.trim(), 'text');
        } else {
          setTinNhan(text);
          await handleSend();
        }
      } catch (err) {
        console.error('Lỗi gửi quick-reply (ChatBanHang):', err);
      }
    };
    window.addEventListener('quick-reply', onQuickReply);
    return () => window.removeEventListener('quick-reply', onQuickReply);
  }, [sendMessageService, handleSend, setTinNhan]);

  // ✅ Handle text change - CHỈ CẬP NHẬT, KHÔNG CHẶN
  const handleTextChange = useCallback((e) => {
    const newValue = e.target.value;
    
    if (newValue.length <= MAX_CHARS) {
   setTinNhan(newValue);
  }
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }, [setTinNhan]);

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      imagePreviewList.forEach(file => {
        if (file) URL.revokeObjectURL(URL.createObjectURL(file));
      });
      videoPreviewList.forEach(file => {
        if (file) URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [imagePreviewList, videoPreviewList]);

  // ✅ Tính số ký tự
  const currentLength = tinNhan.length;
  const isOverLimit = currentLength > MAX_CHARS;
  const isNearLimit = currentLength > MAX_CHARS - 50 && !isOverLimit;

  return (
    <div
      className={`${styles.chatInput} ${isDragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dragContent}>
            <FaImage size={48} />
            <p>Thả file vào đây để upload</p>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className={styles.warning}>
          ⚠️ Mất kết nối. Đang thử kết nối lại...
        </div>
      )}

      {(isUploading || isLocating) && (
        <div className={styles.uploadProgress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: isLocating ? '100%' : `${uploadProgress}%` }} // Dò GPS thì full bar
            />
          </div>
          <span className={styles.progressText}>
            {isLocating 
              ? "Đang dò GPS chính xác..." 
              : `Đang upload... ${Math.round(uploadProgress)}%`
            }
          </span>
        </div>
      )}

      {(imagePreviewList.length > 0 || videoPreviewList.length > 0) && (
        <div className={styles.previews}>
          {imagePreviewList.map((file, idx) => (
            <div key={`img-${idx}-${file.name}`} className={styles.thumb}>
              <button
                className={styles.thumbRemove}
                onClick={() => removeImagePreview(idx)}
                aria-label="Xóa ảnh"
              >
                <FaTimes />
              </button>
              <img src={URL.createObjectURL(file)} alt={`preview-img-${idx}`} loading="lazy" />
              <div className={styles.thumbInfo}>
                <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            </div>
          ))}
          {videoPreviewList.map((file, idx) => (
            <div key={`vid-${idx}-${file.name}`} className={styles.thumb}>
              <button
                className={styles.thumbRemove}
                onClick={() => removeVideoPreview(idx)}
                aria-label="Xóa video"
              >
                <FaTimes />
              </button>
              <video src={URL.createObjectURL(file)} controls preload="metadata" />
              <div className={styles.thumbInfo}>
                <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={styles.inputWrap}
        style={{
          opacity: isDisabled ? 0.5 : 1,
          pointerEvents: isDisabled ? "none" : "auto",
        }}
      >
        <div className={styles.actions}>
          <label className={styles.actionBtn} title="Chọn ảnh">
            <FaImage size={20} />
            <input
              ref={fileInputImageRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => handleFileInputChange(e, "image")}
              accept="image/*"
              multiple
              disabled={isDisabled}
            />
          </label>
          <label className={styles.actionBtn} title="Chọn video">
            <FaVideo size={20} />
            <input
              ref={fileInputVideoRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => handleFileInputChange(e, "video")}
              accept="video/*"
              multiple
              disabled={isDisabled}
            />
          </label>
          <button 
            className={styles.actionBtn} 
            title="Gửi vị trí hiện tại"
            onClick={handleSendLocation}
            disabled={isDisabled}
            style={{ border: 'none', background: 'none' }} // Reset style button mặc định
          >
            <FaMapMarkerAlt size={20} />
          </button>
        </div>

        <div className={styles.textWrap} style={{ position: 'relative' }}>
          <textarea
            ref={inputRef}
            value={tinNhan}
            onChange={handleTextChange}
            onPaste={handlePaste}
            placeholder={
              isUploading
                ? "Đang upload..."
                : isDisabled
                ? "Không thể gửi tin nhắn"
                : "Aa"
            }
            disabled={isDisabled}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              paddingRight: '60px', // ✅ Chừa chỗ cho counter
            }}
          />
          {/* ✅ HIỂN THỊ COUNTER LUÔN */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '12px',
              fontSize: '12px',
              fontWeight: '600',
              color: isOverLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : '#94a3b8',
              pointerEvents: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '2px 6px',
              borderRadius: '6px',
              transition: 'color 0.2s ease',
            }}
          >
            {currentLength}/{MAX_CHARS}
          </div>
        </div>

        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={
            isDisabled ||
            !(tinNhan.trim() || imagePreviewList.length || videoPreviewList.length)
          }
          aria-label="Gửi tin nhắn"
          title="Gửi"
        >
          <FaPaperPlane size={16} />
        </button>
      </div>
      {showMapPicker && initialMapCoords && (
        <LocationPickerModal
          initialPosition={initialMapCoords}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
};

export default ChatInput;