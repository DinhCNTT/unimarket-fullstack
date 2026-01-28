import React, { useState, useEffect } from 'react';
import styles from '../Settings.module.css'; 
import toast from 'react-hot-toast';
import { getPrivacy, updatePrivacy } from '../services/userProfileService'; 

const PrivacySection = () => {
    const [isPrivate, setIsPrivate] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 

    useEffect(() => {
        const fetchPrivacyStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await getPrivacy(token);
                if (res.data) {
                    setIsPrivate(res.data.isPrivateAccount);
                }
            } catch (error) {
                console.error("Lỗi lấy trạng thái riêng tư:", error);
            }
        };

        fetchPrivacyStatus();
    }, []);

    const handleToggle = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Vui lòng đăng nhập lại.");
            return;
        }

        const newValue = !isPrivate; 
        setIsLoading(true); 

        try {
            await updatePrivacy(token, newValue);
            
            setIsPrivate(newValue);
            toast.success(newValue ? "Đã bật tài khoản riêng tư" : "Đã chuyển sang công khai");
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            toast.error("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div>
            <h2 className={styles.sectionTitle}>Quyền riêng tư</h2>
            
            <div className={styles.sectionSubtitle}>Khả năng khám phá</div>

            <div className={styles.itemRow}>
                <div style={{maxWidth: '80%'}}>
                    <div className={styles.itemLabel}>Tài khoản riêng tư</div>
                    <div className={styles.itemDesc}>
                        Với tài khoản riêng tư, chỉ những người dùng được bạn phê duyệt mới có thể follow bạn và xem các video của bạn. Những follower hiện tại sẽ không bị ảnh hưởng.
                    </div>
                </div>
                <div>
                    <label className={`${styles.toggleSwitch} ${isLoading ? styles.disabled : ''}`}>
                        <input 
                            type="checkbox" 
                            checked={isPrivate} 
                            onChange={handleToggle} 
                            disabled={isLoading} 
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default PrivacySection;