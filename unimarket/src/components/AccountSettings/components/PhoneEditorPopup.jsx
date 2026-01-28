import React, { useState } from 'react';
import styles from '../sections/AccountSection.module.css';
import { updateUserProfile } from '../services/userProfileService';
import { notifyPromise, notifyError } from '../helpers/notificationService';

const PhoneEditorPopup = ({ currentPhone, currentUserInfo, token, onClose, onUpdateSuccess }) => {
    const [phone, setPhone] = useState(currentPhone || "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // 1. Validation số điện thoại Việt Nam (Đầu 03, 05, 07, 08, 09 và đủ 10 số)
        const vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;

        if (!phone) {
            notifyError("Vui lòng nhập số điện thoại");
            return;
        }

        if (phone.length !== 10) {
            notifyError("Số điện thoại phải có đúng 10 chữ số");
            return;
        }

        if (!vnf_regex.test(phone)) {
            notifyError("Số điện thoại không đúng định dạng Việt Nam");
            return;
        }

        setLoading(true);

        // 2. Chuẩn bị dữ liệu: Gộp thông tin cũ (currentUserInfo) với số ĐT mới
        // Tránh lỗi 400 Bad Request do gửi thiếu các trường Required khác (như FullName)
        const dataToUpdate = {
            ...currentUserInfo, // Giữ lại tên, địa chỉ, avatar...
            phoneNumber: phone  // Cập nhật số mới
        };

        const promise = updateUserProfile(token, dataToUpdate);

        notifyPromise(promise, {
            loading: "Đang cập nhật số điện thoại...",
            success: () => {
                onUpdateSuccess(phone);
                onClose();
                return "Cập nhật thành công!";
            },
            error: (err) => {
                console.error(err);
                // Hiển thị lỗi chi tiết từ Backend nếu có
                if (err.response && err.response.data && err.response.data.errors) {
                     // Lấy lỗi đầu tiên trong object errors
                     const firstKey = Object.keys(err.response.data.errors)[0];
                     return err.response.data.errors[firstKey][0];
                }
                return err.response?.data?.message || "Lỗi cập nhật (Kiểm tra lại dữ liệu)";
            }
        }).finally(() => setLoading(false));
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.popupContainer}>
                <h3 style={{marginBottom: '10px'}}>Cập nhật số điện thoại</h3>
                <p className={styles.popupDesc}>Số điện thoại giúp bảo mật tài khoản của bạn.</p>
                
                <div className={styles.formGroup}>
                    <input 
                        className={styles.input}
                        value={phone}
                        onChange={(e) => {
                            // Chỉ cho phép nhập số
                            const val = e.target.value;
                            if (!isNaN(val) && !val.includes(" ")) {
                                setPhone(val);
                            }
                        }}
                        placeholder="Nhập số điện thoại (10 số)"
                        type="tel"
                        maxLength={10} // Giới hạn nhập tối đa 10 ký tự trên HTML
                    />
                </div>

                <div className={styles.popupActions}>
                    <button className={styles.btnSecondary} onClick={onClose} disabled={loading}>Hủy</button>
                    <button className={styles.button} onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhoneEditorPopup;