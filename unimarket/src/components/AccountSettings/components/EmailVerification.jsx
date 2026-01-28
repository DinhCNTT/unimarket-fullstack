import React, { useState } from "react";
import styles from "../sections/AccountSection.module.css";
import { notifyError, notifySuccess } from "../helpers/notificationService";
import { verifyCode } from "../services/userProfileService";

// Component này giờ đóng vai trò là Popup Nhập Mã
const EmailVerification = ({ email, token, onClose, onVerified }) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!code) {
      notifyError("Vui lòng nhập mã xác minh.");
      return;
    }
    setIsVerifying(true);
    try {
      // Logic cũ: Gọi API verifyCode
      await verifyCode(token, email, code);
      notifySuccess("Xác minh email thành công!");
      onVerified(); // Báo cho cha biết đã xong
    } catch (err) {
      const msg = err.response?.data?.message || "Mã không đúng hoặc hết hạn.";
      notifyError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popupContainer}>
        <h3 style={{marginBottom: '10px'}}>Xác minh Email</h3>
        <p className={styles.popupDesc}>
            Mã xác minh (OTP) đã được gửi đến: <br/>
            <strong style={{color:'#333', fontSize:'16px'}}>{email}</strong>
        </p>
        
        <div className={styles.formGroup}>
            <input
                className={styles.input}
                placeholder="Nhập mã 6 số"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
            />
        </div>

        <div className={styles.popupActions}>
          <button
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={isVerifying}
          >
            Đóng
          </button>
          <button
            className={styles.button}
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? "Đang kiểm tra..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;