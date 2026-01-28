import React, { useState } from 'react';
import styles from '../sections/AccountSection.module.css'; // Dùng chung style cũ
import { deleteAccount } from '../services/userProfileService';
import { FaCheckCircle } from 'react-icons/fa'; // Import icon tích xanh

const DeleteAccountPopup = ({ token, onClose, onLogout }) => {
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    
    // State mới: Kiểm soát việc đã xóa xong chưa để hiện thông báo
    const [isDeleted, setIsDeleted] = useState(false);

    const handleDelete = async () => {
        if (confirmText !== "DELETE") return;

        setLoading(true);
        try {
            await deleteAccount(token);
            // Xóa thành công -> Chuyển sang màn hình thông báo
            setIsDeleted(true);
        } catch (err) {
            // Nếu lỗi thì hiển thị alert hoặc toast lỗi như cũ (ở đây tôi giữ đơn giản)
            alert(err.response?.data?.message || "Lỗi khi xóa tài khoản.");
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER GIAO DIỆN KHI ĐÃ XÓA THÀNH CÔNG ---
    if (isDeleted) {
        return (
            <div className={styles.overlay}>
                <div className={styles.popupContainer} style={{ textAlign: 'center', padding: '30px 20px' }}>
                    <FaCheckCircle size={60} color="#10b981" style={{ marginBottom: '15px' }} />
                    
                    <h3 style={{ color: '#333', marginBottom: '10px' }}>Đã xóa tài khoản</h3>
                    
                    <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>
                        Tài khoản của bạn đã được xóa vĩnh viễn khỏi hệ thống.<br/>
                        Hẹn gặp lại bạn vào một dịp khác!
                    </p>

                    <button 
                        className={styles.btnSave} // Tận dụng class nút xanh có sẵn
                        style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                        onClick={onLogout} // Bấm nút này mới chuyển trang
                    >
                        OK, Về trang đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    // --- RENDER GIAO DIỆN NHẬP DELETE (NHƯ CŨ) ---
    return (
        <div className={styles.overlay}>
            <div className={styles.popupContainer}>
                <h3 style={{color: '#ff4d4f', marginBottom: '10px'}}>Xóa tài khoản vĩnh viễn?</h3>
                <p className={styles.popupDesc}>
                    Hành động này <strong>không thể hoàn tác</strong>. Tất cả dữ liệu, bài đăng và thông tin của bạn sẽ bị xóa.
                </p>
                
                <div className={styles.formGroup}>
                    <label className={styles.label} style={{display:'block', marginBottom:'8px', fontSize:'14px'}}>
                        Nhập chữ <strong>DELETE</strong> để xác nhận:
                    </label>
                    <input 
                        className={styles.input}
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        disabled={loading}
                    />
                </div>

                <div className={styles.popupActions}>
                    <button className={styles.btnSecondary} onClick={onClose} disabled={loading}>Giữ lại</button>
                    <button 
                        className={`${styles.button} ${styles.dangerBtn}`} 
                        onClick={handleDelete} 
                        disabled={loading || confirmText !== "DELETE"}
                        style={{backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: 'white'}}
                    >
                        {loading ? "Đang xử lý..." : "Xác nhận xóa"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountPopup;