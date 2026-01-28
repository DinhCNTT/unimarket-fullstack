import React, { useState, useEffect, useContext } from "react";
import { RemoveScroll } from "react-remove-scroll";
import styles from "./EditProfileModal.module.css";
import defaultAvatar from "../../assets/default-avatar.png";

// Notification + Service
import { notifyPromise } from "../../components/AccountSettings/helpers/notificationService";
import {
  uploadAvatar,
  updateUserProfile,
} from "../../components/AccountSettings/services/userProfileService";

import { AuthContext } from "../../context/AuthContext";

const EditProfileModal = ({ userInfo, onClose, onUpdateSuccess }) => {
  // 👉 Lấy updateUser để đồng bộ toàn app (Header, Avatar, v.v)
  const { updateUser } = useContext(AuthContext);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState(defaultAvatar);
  const [selectedFile, setSelectedFile] = useState(null);

  // =====================
  // Load dữ liệu ban đầu
  // =====================
  useEffect(() => {
    if (userInfo) {
      setFullName(userInfo.fullName || "");
      setPhoneNumber(userInfo.phoneNumber || "");
      setPreviewAvatar(userInfo.avatarUrl || defaultAvatar);
    }
  }, [userInfo]);

  // =====================
  // Chọn ảnh → preview
  // =====================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewAvatar(URL.createObjectURL(file));
  };

  // =====================
  // Lưu hồ sơ
  // =====================
  const handleSave = async () => {
    const token = localStorage.getItem("token");

    const executeUpdate = async () => {
      let newAvatarUrl = userInfo?.avatarUrl;

      // 1️⃣ Upload avatar nếu có ảnh mới
      if (selectedFile) {
        const formData = new FormData();
        formData.append("avatar", selectedFile);

        const resAvatar = await uploadAvatar(token, formData);

        if (resAvatar?.data?.avatarUrl) {
          newAvatarUrl = resAvatar.data.avatarUrl;
        }
      }

      // 2️⃣ Update thông tin text
      await updateUserProfile(token, {
        fullName,
        phoneNumber,
      });

      // 3️⃣ Trả dữ liệu mới
      return {
        fullName,
        phoneNumber,
        avatarUrl: newAvatarUrl,
      };
    };

    // =====================
    // Notify UX
    // =====================
    await notifyPromise(executeUpdate(), {
      loading: "Đang cập nhật hồ sơ...",
      success: (newData) => {
        // ✔️ Update Context (Header, Avatar global)
        updateUser(newData);

        // 🔥 QUAN TRỌNG: Báo UserProfilePage cập nhật state ngay
        if (onUpdateSuccess) {
          onUpdateSuccess(newData);
        }

        // ✔️ Đóng modal
        onClose();

        return "Cập nhật hồ sơ thành công!";
      },
      error: "Có lỗi xảy ra khi cập nhật!",
    });
  };

  // =====================
  // Icon cây bút
  // =====================
  const EditIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M42 26V40C42 41.1046 41.1046 42 40 42H8C6.89543 42 6 41.1046 6 40V8C6 6.89543 6.89543 6 8 6L22 6"
        stroke="#161823"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 26.7199V34H21.3172L42 13.3086L34.6951 6L14 26.7199Z"
        fill="#161823"
        stroke="#161823"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );

  // =====================
  // UI
  // =====================
  return (
    <RemoveScroll>
      <div className={styles.overlay} onClick={onClose}>
        <div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>Sửa hồ sơ</h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
            >
              &times;
            </button>
          </div>

          {/* Body */}
          <div className={styles.body}>
            {/* Avatar */}
            <div className={styles.avatarSection}>
              <label className={styles.avatarWrapper}>
                <img
                  src={previewAvatar}
                  alt="Avatar"
                  className={styles.avatar}
                />
                <div className={styles.editIconOverlay}>
                  <EditIcon />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.hiddenInput}
                />
              </label>
            </div>

            {/* UniMarket ID */}
            <div className={styles.row}>
              <div className={styles.label}>UniMarket ID</div>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.input}
                  value={userInfo?.userName || ""}
                  readOnly
                  style={{
                    color: "#8a8b91",
                    cursor: "not-allowed",
                  }}
                />
                <div className={styles.note}>
                  UniMarket ID không thể thay đổi.
                </div>
              </div>
            </div>

            {/* Tên */}
            <div className={styles.row}>
              <div className={styles.label}>Tên</div>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.input}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập tên hiển thị"
                />
              </div>
            </div>

            {/* SĐT */}
            <div className={styles.row}>
              <div className={styles.label}>Số điện thoại</div>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.input}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              className={styles.btnCancel}
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              className={styles.btnSave}
              onClick={handleSave}
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </RemoveScroll>
  );
};

export default EditProfileModal;
