import React, { useState, useEffect, useContext } from "react";
// 1. Sửa đường dẫn CSS
import styles from "../Settings.module.css";
// 2. Sửa đường dẫn Assets (lùi 3 cấp ra src)
import defaultAvatar from "../../../assets/default-avatar.png"; 
// 3. Sửa đường dẫn Helpers & Services (lùi 1 cấp ra AccountSettings)
import { notifyPromise } from "../helpers/notificationService";
import { uploadAvatar } from "../services/userProfileService";
// 4. Sửa đường dẫn Context (lùi 3 cấp ra src)
import { AuthContext } from "../../../context/AuthContext";

const AvatarUploader = ({ initialAvatarUrl, token }) => {
  const { updateUser } = useContext(AuthContext);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl || defaultAvatar);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setAvatarPreview(initialAvatarUrl || defaultAvatar);
  }, [initialAvatarUrl]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append("avatar", avatarFile);
    setIsUploading(true);

    const promise = uploadAvatar(token, formData);

    notifyPromise(promise, {
      loading: "Đang cập nhật ảnh...",
      success: (res) => {
        const { avatarUrl } = res.data;
        updateUser({ avatarUrl });
        setAvatarFile(null);
        return "Cập nhật ảnh đại diện thành công!";
      },
      error: "Lỗi khi cập nhật ảnh đại diện!",
    }).finally(() => {
        setIsUploading(false);
    });
  };

  const triggerFileInput = () => {
    document.getElementById("avatar-upload-input").click();
  };

  return (
    <div className={styles.avatarSection}>
      <img
        src={avatarPreview}
        alt="Avatar"
        className={styles.avatarPreview}
      />

      <input
        id="avatar-upload-input"
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        style={{ display: "none" }}
      />

      {/* Nút dấu + */}
      <button
        type="button"
        className={styles.avatarUploadBtn}
        onClick={triggerFileInput}
        title="Tải ảnh đại diện mới"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#2ecc40" />
          <path d="M12 6V18M6 12H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Nút Lưu (chỉ hiện khi có ảnh mới) */}
      {avatarFile && (
        <div style={{marginTop: 12}}>
             <button
              className={styles.button}
              onClick={handleAvatarUpload}
              disabled={isUploading}
              style={{padding: '6px 12px', fontSize: 13}}
            >
              {isUploading ? "Đang lưu..." : "Lưu ảnh"}
            </button>
        </div>
      )}
    </div>
  );
};

export default AvatarUploader;