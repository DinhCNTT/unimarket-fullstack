import React, { useState, useEffect } from "react";
import styles from "../Settings.module.css";
import { notifyPromise } from "../helpers/notificationService";
import { updateUserProfile } from "../services/userProfileService";

const UserInfoForm = ({ initialData, token, onUpdate }) => {
  const [formData, setFormData] = useState(initialData);
  const [isUpdating, setIsUpdating] = useState(false);

  // Cập nhật state nội bộ khi data từ cha (API) thay đổi
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const promise = updateUserProfile(token, {
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
    });

    notifyPromise(promise, {
      loading: "Đang cập nhật thông tin...",
      success: () => {
        onUpdate(formData); // Báo cho cha cập nhật state
        return "Cập nhật thông tin thành công!";
      },
      error: "Cập nhật thất bại. Vui lòng thử lại!",
    }).finally(() => {
      setIsUpdating(false);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="fullName" className={styles.label}>Họ tên:</label>
        <input
          id="fullName"
          name="fullName"
          className={styles.input}
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Họ tên"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="phoneNumber" className={styles.label}>Số điện thoại:</label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          className={styles.input}
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Số điện thoại"
        />
      </div>

      <button type="submit" className={styles.button} disabled={isUpdating}>
        {isUpdating ? "Đang lưu..." : "Cập nhật thông tin"}
      </button>
    </form>
  );
};

export default UserInfoForm;