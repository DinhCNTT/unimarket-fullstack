// components/AccountSettings/sections/SecuritySection.jsx
import React, { useState, useEffect, useContext } from 'react';
import styles from '../Settings.module.css';
import { FaChevronRight, FaTrash, FaDesktop, FaMobileAlt, FaKey, FaPlusCircle } from 'react-icons/fa'; // Import thêm icon
import PasswordChangeModal from '../components/PasswordChange';
import axios from 'axios';
import { AuthContext } from "../../../context/AuthContext";
import toast from 'react-hot-toast';

const SecuritySection = () => {
    const { token } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State quản lý thiết bị
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);

    // State quản lý trạng thái mật khẩu (Mới thêm)
    const [hasPassword, setHasPassword] = useState(null); // Để null ban đầu để biết đang load

    // Lấy danh sách thiết bị VÀ kiểm tra mật khẩu khi component load
    useEffect(() => {
        if(token) {
            fetchDevices();
            checkHasPassword();
        }
    }, [token]);

    const fetchDevices = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/userprofile/devices", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDevices(res.data);
        } catch (error) {
            console.error("Lỗi lấy thiết bị", error);
        } finally {
            setLoadingDevices(false);
        }
    };

    // Hàm kiểm tra user có pass chưa
    const checkHasPassword = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/userprofile/has-password", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasPassword(res.data.hasPassword);
        } catch (error) {
            console.error("Lỗi kiểm tra mật khẩu", error);
        }
    };

    // ... (Giữ nguyên phần handleDeleteDevice và formatTime) ...
    const handleDeleteDevice = async (deviceId) => {
        if(!window.confirm("Bạn muốn đăng xuất khỏi thiết bị này?")) return;
        try {
            await axios.delete(`http://localhost:5133/api/userprofile/devices/${deviceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Đã đăng xuất thiết bị");
            fetchDevices(); 
        } catch (error) {
            toast.error("Lỗi xóa thiết bị");
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN') + ' lúc ' + date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
    }

    // Callback khi đổi/tạo mật khẩu thành công thì cập nhật lại state
    const handlePasswordChangeSuccess = () => {
        setHasPassword(true); // Đã tạo xong thì chắc chắn là true
        setIsModalOpen(false);
    };

    return (
        <div>
            <h2 className={styles.sectionTitle}>Bảo mật</h2>

            {/* Mục mật khẩu: Logic hiển thị dựa trên hasPassword */}
            <div className={styles.itemRow} onClick={() => setIsModalOpen(true)} style={{cursor: 'pointer'}}>
                <div className={styles.itemLabel} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Mật khẩu
                    {/* Hiển thị badge trạng thái nếu chưa có pass */}
                    {hasPassword === false && (
                        <span style={{ fontSize: '12px', color: '#e67e22', background: '#fff3cd', padding: '2px 8px', borderRadius: '10px' }}>
                            Chưa thiết lập
                        </span>
                    )}
                </div>
                <div className={styles.itemAction}>
                    {/* Đổi text dựa trên trạng thái */}
                    {hasPassword === false ? (
                        <span style={{ color: '#1877f2', fontWeight: '600', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FaPlusCircle /> Tạo mật khẩu
                        </span>
                    ) : (
                        <span>Đổi mật khẩu <FaChevronRight size={12}/></span>
                    )}
                </div>
            </div>

            {/* ... (Phần hiển thị thiết bị giữ nguyên) ... */}
            <div className={styles.sectionSubtitle} style={{marginTop: 30}}>Thiết bị của bạn</div>
            
            {loadingDevices ? (
                <p style={{color: '#888', fontSize: 14}}>Đang tải thông tin thiết bị...</p>
            ) : devices.length === 0 ? (
                <p>Chưa có thông tin thiết bị.</p>
            ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                    {devices.map(device => (
                        <div className={styles.itemRow} key={device.id}>
                            {/* ... (Giữ nguyên nội dung render thiết bị) ... */}
                            <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                                {device.deviceName.toLowerCase().includes('phone') || device.deviceName.toLowerCase().includes('android') 
                                    ? <FaMobileAlt size={24} color="#555"/> 
                                    : <FaDesktop size={24} color="#555"/>
                                }
                                <div>
                                    <div className={styles.itemLabel}>
                                        {device.deviceName} {device.isCurrent && <span style={{color: '#1877f2', fontSize: 12, fontWeight: 'bold'}}>(Thiết bị này)</span>}
                                    </div>
                                    <div className={styles.itemDesc}>
                                        {device.isCurrent ? 'Đang hoạt động' : `Hoạt động: ${formatTime(device.lastLogin)}`} 
                                        • {device.location || 'Không xác định'}
                                    </div>
                                </div>
                            </div>
                            
                            {!device.isCurrent && (
                                <div className={styles.itemAction} onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDevice(device.id);
                                }}>
                                    <div style={{padding: 8, cursor: 'pointer'}} title="Đăng xuất thiết bị này">
                                        <FaTrash size={14} color="#757575"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Popup Component */}
            {isModalOpen && (
                <PasswordChangeModal 
                    onClose={() => setIsModalOpen(false)} 
                    hasPasswordInitial={hasPassword} // TRUYỀN ĐÚNG STATE, KHÔNG HARDCODE TRUE
                    onSuccess={handlePasswordChangeSuccess} // Thêm callback để update UI
                />
            )}
        </div>
    );
};

export default SecuritySection;