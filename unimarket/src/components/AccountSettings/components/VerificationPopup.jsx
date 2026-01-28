import React, { useState } from "react";
import { notifyError, notifySuccess } from "../helpers/notificationService";
import { verifyCode } from "../services/userProfileService";
// SỬA ĐƯỜNG DẪN CSS
import styles from "../sections/AccountSection.module.css";

const VerificationPopup = ({ email, token, onClose, onVerified }) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!code) {
      notifyError("Vui lòng nhập mã xác minh.");
      return;
    }
    setIsVerifying(true);
    try {
      await verifyCode(token, email, code);
      // Không notifySuccess ở đây nữa, để cha xử lý cho mượt
      onVerified(); 
    } catch (err) {
      const msg = err.response?.data?.message || "Mã không đúng hoặc hết hạn.";
      notifyError(msg);
      setIsVerifying(false);
    }
  };

  return (
    // Sử dụng chung class overlay để đè lên popup cũ
    <div className={styles.overlay} style={{zIndex: 1001}}> 
      <div className={styles.popupContainer}>
        <h3>Xác minh Email</h3>
        <p className={styles.popupDesc}>Mã xác minh đã được gửi đến: <b>{email}</b></p>
        
        <div className={styles.formGroup}>
            <input
            className={styles.input}
            placeholder="Nhập mã 6 số"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            />
        </div>

        <div className={styles.popupActions}>
          <button
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={isVerifying}
          >
            Quay lại
          </button>
          <button
            className={styles.button}
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? "Đang xác minh..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPopup;