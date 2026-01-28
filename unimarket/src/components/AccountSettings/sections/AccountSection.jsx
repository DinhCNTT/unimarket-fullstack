import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { getUserProfile, updateEmail, sendVerificationCode } from '../services/userProfileService';
import { notifyPromise, notifySuccess } from '../helpers/notificationService'; // Đã thêm notifySuccess nếu cần dùng
import styles from './AccountSection.module.css'; 
import { FaChevronRight, FaPen } from 'react-icons/fa'; 

// Import Popups
import PhoneEditorPopup from "../components/PhoneEditorPopup";
import DeleteAccountPopup from "../components/DeleteAccountPopup";
import EmailVerification from "../components/EmailVerification"; 

const AccountSection = () => {
    const { token, logout } = useContext(AuthContext);
    const [info, setInfo] = useState(null);
    
    // --- STATE QUẢN LÝ POPUP ---
    const [showPhonePopup, setShowPhonePopup] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showVerifyPopup, setShowVerifyPopup] = useState(false); // Popup nhập mã xác minh

    // --- STATE QUẢN LÝ SỬA EMAIL TẠI CHỖ ---
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [tempEmail, setTempEmail] = useState("");
    const [loadingEmail, setLoadingEmail] = useState(false);

    // Lấy thông tin user khi component mount
    useEffect(() => {
        if(token) {
            getUserProfile(token)
                .then(res => setInfo(res.data))
                .catch(() => {});
        }
    }, [token]);

    // --- HÀM XỬ LÝ LOGOUT SAU KHI XÓA TÀI KHOẢN (FIX LỖI KHÔNG CHUYỂN TRANG) ---
    const handleLogoutAfterDelete = () => {
        // 1. Xóa token trong Context/LocalStorage
        logout(); 
        
        // 2. Ép buộc trình duyệt tải lại trang và bay về login 
        // Dùng replace để người dùng không thể bấm nút Back quay lại trang cũ
        window.location.replace('/login');
    };

    if (!info) return <div className={styles.loading}>Đang tải thông tin...</div>;

    // Kiểm tra tài khoản Google (ẩn nút đổi mật khẩu hoặc đổi email nếu cần thiết)
    const isGoogleAccount = info.provider === 'google' || !info.hasPassword; 

    // --- LOGIC 1: Bắt đầu sửa email ---
    const handleStartEditEmail = () => {
        setTempEmail(info.email);
        setIsEditingEmail(true);
    };

    // --- LOGIC 2: Lưu email mới ---
    const handleSaveEmail = async () => {
        // Nếu không có thay đổi hoặc rỗng thì tắt chế độ sửa
        if (!tempEmail || tempEmail === info.email) {
            setIsEditingEmail(false);
            return;
        }

        setLoadingEmail(true);
        const promise = updateEmail(token, tempEmail);

        notifyPromise(promise, {
            loading: "Đang cập nhật email...",
            success: () => {
                // Cập nhật UI ngay lập tức: Email mới + Trạng thái chưa xác minh
                setInfo({ ...info, email: tempEmail, emailConfirmed: false }); 
                setIsEditingEmail(false);
                return "Cập nhật thành công! Hãy xác minh email mới.";
            },
            error: (err) => err.response?.data?.message || "Lỗi cập nhật email"
        }).finally(() => setLoadingEmail(false));
    };

    // --- LOGIC 3: Gửi mã xác minh & Mở Popup ---
    const handleSendCode = async () => {
        const promise = sendVerificationCode(token);
        notifyPromise(promise, {
            loading: "Đang gửi mã xác minh...",
            success: () => {
                setShowVerifyPopup(true); // Mở popup nhập mã sau khi gửi thành công
                return "Đã gửi mã! Kiểm tra email của bạn.";
            },
            error: (err) => err.response?.data?.message || "Không thể gửi mã."
        });
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Quản lý tài khoản</h2>

            {/* --- PHẦN 1: THÔNG TIN HỒ SƠ --- */}
            <div className={styles.sectionSubtitle}>Thông tin hồ sơ</div>
            
            {/* 1. SỐ ĐIỆN THOẠI */}
            <div className={styles.itemRow} onClick={() => setShowPhonePopup(true)}>
                <div className={styles.leftInfo}>
                    <div className={styles.itemLabel}>Số điện thoại</div>
                    <div className={styles.itemDesc}>Dùng để đăng nhập và bảo mật</div>
                </div>
                <div className={styles.rightAction}>
                    <span className={styles.valueText}>{info.phoneNumber || "Chưa cập nhật"}</span>
                    <FaChevronRight className={styles.arrowIcon} />
                </div>
            </div>

            {/* 2. EMAIL (Xử lý logic phức tạp nhất) */}
            <div className={styles.itemRowNoHover}>
                <div className={styles.leftInfo}>
                    <div className={styles.itemLabel}>Email</div>
                    
                    {/* KHU VỰC HIỂN THỊ / INPUT */}
                    {isEditingEmail ? (
                        /* CHẾ ĐỘ SỬA: Hiện ô Input */
                        <div className={styles.inlineInputContainer} style={{marginTop: '5px'}}>
                            <input 
                                className={styles.inlineInput}
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                autoFocus
                                placeholder="Nhập email mới..."
                                disabled={loadingEmail}
                            />
                        </div>
                    ) : (
                        /* CHẾ ĐỘ XEM: Hiện Email + Các Tag trạng thái */
                        <div className={styles.itemDesc} style={{color: '#333'}}>
                            {info.email}
                            
                            {info.emailConfirmed ? (
                                <span className={styles.verifiedTag}>Đã xác minh</span>
                            ) : (
                                /* Nếu CHƯA xác minh: Hiện cảnh báo + Nút Sửa nhanh + Nút Xác minh */
                                <div className={styles.unverifiedContainer} style={{display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '8px'}}>
                                    <span className={styles.unverifiedTag}>Chưa xác minh</span>
                                    
                                    {/* Nút cây bút chì nhỏ để sửa lại email nếu lỡ nhập sai (UX Improvement) */}
                                    <span 
                                        className={styles.editIconBtn} 
                                        onClick={handleStartEditEmail}
                                        title="Sửa lại email"
                                        style={{cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', fontSize: '12px'}}
                                    >
                                        <FaPen size={10} style={{marginRight: 3}}/> Sửa
                                    </span>

                                    {/* Nút kích hoạt gửi mã */}
                                    <button 
                                        className={styles.btnVerifySmall}
                                        onClick={handleSendCode}
                                    >
                                        Xác minh ngay
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.rightAction}>
                    {/* NÚT THAO TÁC BÊN PHẢI */}
                    {isEditingEmail ? (
                        /* Khi đang sửa: Hiện nút Hủy / Lưu */
                        <div style={{display:'flex', gap:'5px'}}>
                            <button className={styles.btnCancel} onClick={() => setIsEditingEmail(false)} disabled={loadingEmail}>Hủy</button>
                            <button className={styles.btnSave} onClick={handleSaveEmail} disabled={loadingEmail}>
                                {loadingEmail ? "Lưu..." : "Cập nhật"}
                            </button>
                        </div>
                    ) : (
                        /* Khi đang xem: Hiện nút "Thay đổi" (Nếu không phải Google Account) */
                        !isGoogleAccount && (
                            <div className={styles.itemRow} onClick={handleStartEditEmail} style={{padding: 0, border: 'none', background: 'transparent'}}>
                                <span className={styles.linkText}>Thay đổi</span>
                                <FaChevronRight className={styles.arrowIcon} style={{marginLeft: '10px'}}/>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* --- PHẦN 2: KIỂM SOÁT TÀI KHOẢN --- */}
            <div className={styles.sectionSubtitle}>Kiểm soát tài khoản</div>
            
            <div className={`${styles.itemRow} ${styles.dangerRow}`} onClick={() => setShowDeletePopup(true)}>
                <div className={styles.leftInfo}>
                    <div className={styles.itemLabel}>Xóa tài khoản</div>
                    <div className={styles.itemDesc}>Tài khoản sẽ bị xóa vĩnh viễn</div>
                </div>
                <div className={styles.rightAction}>
                    <span className={styles.dangerText}>Xóa</span>
                    <FaChevronRight className={styles.arrowIconDanger}/>
                </div>
            </div>

            {/* --- POPUPS SECTION --- */}
            
            {/* Popup Sửa SĐT */}
            {showPhonePopup && (
                <PhoneEditorPopup 
                    currentPhone={info.phoneNumber}
                    currentUserInfo={info}
                    token={token}
                    onClose={() => setShowPhonePopup(false)}
                    onUpdateSuccess={(newPhone) => setInfo({...info, phoneNumber: newPhone})}
                />
            )}

            {/* Popup Xóa Tài Khoản */}
            {showDeletePopup && (
                <DeleteAccountPopup 
                    token={token}
                    onClose={() => setShowDeletePopup(false)}
                    // 👇 QUAN TRỌNG: Truyền hàm logout mạnh hơn vào đây
                    onLogout={handleLogoutAfterDelete} 
                />
            )}

            {/* Popup Nhập Mã Xác Minh Email */}
            {showVerifyPopup && (
                <EmailVerification 
                    email={info.email}
                    token={token}
                    onClose={() => setShowVerifyPopup(false)}
                    onVerified={() => {
                        setInfo({...info, emailConfirmed: true});
                        setShowVerifyPopup(false);
                        notifySuccess("Email đã được xác minh thành công!");
                    }}
                />
            )}
        </div>
    );
};

export default AccountSection;