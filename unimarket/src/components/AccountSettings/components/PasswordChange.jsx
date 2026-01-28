// components/AccountSettings/components/PasswordChange.jsx
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import toast from 'react-hot-toast';
import styles from './PasswordChange.module.css'; 
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const PasswordChangeModal = ({ onClose, hasPasswordInitial, onSuccess }) => {
  const { token } = useContext(AuthContext);
  
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // State quản lý việc ẩn/hiện của 3 ô mật khẩu
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isLoading, setIsLoading] = useState(false);
  
  // State nội bộ xác định user có pass hay chưa
  const [hasPassword, setHasPassword] = useState(hasPasswordInitial);

  // useEffect: Đồng bộ state khi props thay đổi hoặc fetch lại nếu props là null
  useEffect(() => {
    // Nếu cha truyền giá trị boolean cụ thể (true/false) -> Dùng luôn
    if (hasPasswordInitial !== null && hasPasswordInitial !== undefined) {
        setHasPassword(hasPasswordInitial);
    } 
    // Nếu cha không truyền (null) -> Tự gọi API check lại (Fallback)
    else if (token) {
       axios.get("http://localhost:5133/api/userprofile/has-password", {
          headers: { Authorization: `Bearer ${token}` },
       })
       .then(res => setHasPassword(res.data.hasPassword))
       .catch(err => console.error("Lỗi check password:", err));
    }
  }, [hasPasswordInitial, token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Hàm toggle ẩn/hiện mật khẩu
  const toggleShow = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    // 1. Validate cơ bản
    if (!form.newPassword || form.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    // 2. Logic quan trọng: Nếu user đã có pass thì BẮT BUỘC nhập pass cũ
    if (hasPassword && !form.currentPassword) {
        toast.error("Vui lòng nhập mật khẩu hiện tại để xác thực");
        return;
    }

    setIsLoading(true);
    try {
      // 3. Chuẩn bị payload
      const payload = {
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
        // Nếu chưa có pass (Google login) -> gửi null để backend dùng AddPasswordAsync
        // Nếu đã có pass -> gửi pass cũ để backend dùng ChangePasswordAsync
        currentPassword: hasPassword ? form.currentPassword : null
      };

      await axios.put("http://localhost:5133/api/userprofile/password", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 4. Xử lý thành công
      toast.success(hasPassword ? "Đổi mật khẩu thành công!" : "Tạo mật khẩu mới thành công!");
      
      // Nếu có callback onSuccess (từ SecuritySection) thì gọi nó để update UI cha
      if (onSuccess) {
          onSuccess(); 
      } else {
          onClose();
      }
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi cập nhật mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {/* Đổi tiêu đề dựa trên trạng thái */}
            {hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu mới"}
          </h3>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          
          {/* LOGIC HIỂN THỊ: Chỉ hiện ô "Mật khẩu cũ" nếu user ĐÃ CÓ mật khẩu */}
          {hasPassword && (
            <div className={styles.inputGroup}>
              <label>Mật khẩu hiện tại</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPass.current ? "text" : "password"}
                  name="currentPassword"
                  placeholder="Nhập mật khẩu cũ..."
                  className={styles.modalInput}
                  value={form.currentPassword}
                  onChange={handleChange}
                />
                <span 
                  className={styles.toggleIcon} 
                  onClick={() => toggleShow('current')}
                >
                  {showPass.current ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
          )}

          {/* Ô mật khẩu mới - Luôn hiện */}
          <div className={styles.inputGroup}>
            <label>Mật khẩu mới</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPass.new ? "text" : "password"}
                name="newPassword"
                placeholder={hasPassword ? "Nhập mật khẩu mới..." : "Tạo mật khẩu..."}
                className={styles.modalInput}
                value={form.newPassword}
                onChange={handleChange}
              />
              <span 
                className={styles.toggleIcon} 
                onClick={() => toggleShow('new')}
              >
                {showPass.new ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {/* Ô xác nhận mật khẩu mới - Luôn hiện */}
          <div className={styles.inputGroup}>
            <label>Nhập lại mật khẩu mới</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPass.confirm ? "text" : "password"}
                name="confirmNewPassword"
                placeholder="Xác nhận mật khẩu mới..."
                className={styles.modalInput}
                value={form.confirmNewPassword}
                onChange={handleChange}
              />
              <span 
                className={styles.toggleIcon} 
                onClick={() => toggleShow('confirm')}
              >
                {showPass.confirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onClose}>Hủy</button>
          <button 
            className={styles.btnSave} 
            onClick={handleSubmit} 
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : (hasPassword ? "Lưu thay đổi" : "Tạo mật khẩu")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;