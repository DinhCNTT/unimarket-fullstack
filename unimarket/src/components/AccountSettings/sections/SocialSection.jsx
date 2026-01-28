import React, { useState, useEffect } from 'react';
import styles from '../Settings.module.css'; 
import { FaFacebook, FaGoogle, FaTiktok, FaInstagram, FaCheck, FaTimes, FaTrash } from 'react-icons/fa'; // Thêm icon
import axios from 'axios';
// 👇 Import file thông báo của bạn (Đảm bảo đường dẫn đúng)
import { notifySuccess, notifyError } from '../helpers/notificationService';

const PROVIDER_CONFIG = {
    Facebook: { icon: <FaFacebook color="#1877F2" size={24}/>, placeholder: 'https://facebook.com/username' },
    Google:   { icon: <FaGoogle color="#DB4437" size={24}/>,   placeholder: 'email@gmail.com' },
    TikTok:   { icon: <FaTiktok color="#000" size={24}/>,      placeholder: 'https://tiktok.com/@username' },
    Instagram:{ icon: <FaInstagram color="#E1306C" size={24}/>, placeholder: 'https://instagram.com/username' }
};

const SocialSection = () => {
    const [socialLinks, setSocialLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State quản lý việc đang sửa/nhập link nào
    const [editingProvider, setEditingProvider] = useState(null); 
    const [inputUrl, setInputUrl] = useState(""); 

    // ✅ Dùng HTTP theo cấu hình port 5133 của bạn để tránh lỗi SSL
    const API_BASE_URL = 'http://localhost:5133'; 

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await axios.get(`${API_BASE_URL}/api/userprofile/social-links`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (Array.isArray(response.data)) {
                setSocialLinks(response.data);
            }
        } catch (error) {
            console.error("Lỗi API:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    // --- XỬ LÝ KHI ẤN "LIÊN KẾT NGAY" HOẶC "SỬA" ---
    const handleStartEdit = (provider, currentUrl = "") => {
        setEditingProvider(provider);
        setInputUrl(currentUrl || ""); // Nếu đã có link thì điền sẵn
    };

    // --- XỬ LÝ HỦY BỎ ---
    const handleCancelEdit = () => {
        setEditingProvider(null);
        setInputUrl("");
    };

    // --- XỬ LÝ LƯU (GỌI API) ---
    const handleSaveLink = async (provider) => {
        if (!inputUrl.trim()) {
            notifyError("Vui lòng nhập đường dẫn liên kết!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            
            // Gọi API Update/Create
            const response = await axios.post(`${API_BASE_URL}/api/userprofile/toggle-social`, 
                { provider: provider, url: inputUrl }, // Gửi kèm URL
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if(response.status === 200) {
                notifySuccess(response.data.message || "Cập nhật thành công!");
                await fetchLinks(); // Load lại danh sách
                handleCancelEdit(); // Tắt form nhập
            }
        } catch (error) {
            console.error(error);
            notifyError(error.response?.data?.message || "Lỗi kết nối Server!");
        }
    };

    // --- XỬ LÝ XÓA LIÊN KẾT ---
    const handleUnlink = async (provider) => {
        if(!window.confirm(`Bạn có chắc muốn hủy liên kết ${provider}?`)) return;

        try {
            const token = localStorage.getItem("token");
            // Gửi url rỗng để Backend hiểu là xóa (theo logic backend ở trên)
            const response = await axios.post(`${API_BASE_URL}/api/userprofile/toggle-social`, 
                { provider: provider, url: "" }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if(response.status === 200) {
                notifySuccess("Đã hủy liên kết thành công.");
                await fetchLinks();
            }
        } catch (error) {
            notifyError("Không thể hủy liên kết lúc này.");
        }
    };

    return (
        <div>
            <h2 className={styles.sectionTitle}>Tài khoản liên kết</h2>
            <div className={styles.itemDesc} style={{marginBottom: 20}}>
                Thêm liên kết mạng xã hội để hiển thị trên hồ sơ của bạn.
            </div>

            {loading && socialLinks.length === 0 && <div style={{color:'#666'}}>Đang tải...</div>}

            <div className={styles.listContainer}>
                {socialLinks.map((social, idx) => {
                    const config = PROVIDER_CONFIG[social.provider] || {}; 
                    const isEditing = editingProvider === social.provider;

                    return (
                        <div key={idx} className={styles.itemRow} style={{padding: '15px 0', borderBottom: '1px solid #eee'}}>
                            {/* CỘT TRÁI: ICON + TÊN */}
                            <div style={{display:'flex', alignItems:'center', gap: 15, flex: 1}}>
                                {config.icon}
                                <div>
                                    <div className={styles.itemLabel} style={{fontSize: 16, fontWeight: 600}}>{social.provider}</div>
                                    {/* Nếu đã liên kết thì hiện Link rút gọn, chưa thì hiện text gợi ý */}
                                    {!isEditing && (
                                        <div style={{fontSize: 13, color: '#888', marginTop: 4}}>
                                            {social.isLinked 
                                                ? (social.profileUrl || "Đã liên kết") 
                                                : "Chưa kết nối"}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* CỘT PHẢI: FORM NHẬP hoặc NÚT BẤM */}
                            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                                
                                {isEditing ? (
                                    // --- FORM NHẬP LIỆU ---
                                    <div style={{display:'flex', alignItems:'center', gap: 8, animation: 'fadeIn 0.3s'}}>
                                        <input 
                                            type="text" 
                                            value={inputUrl}
                                            onChange={(e) => setInputUrl(e.target.value)}
                                            placeholder={config.placeholder}
                                            style={{
                                                padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', 
                                                outline: 'none', fontSize: 14, width: 220
                                            }}
                                            autoFocus
                                        />
                                        <button 
                                            onClick={() => handleSaveLink(social.provider)}
                                            style={{padding: 8, borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer'}}
                                            title="Lưu"
                                        >
                                            <FaCheck />
                                        </button>
                                        <button 
                                            onClick={handleCancelEdit}
                                            style={{padding: 8, borderRadius: 6, border: 'none', background: '#f3f4f6', color: '#666', cursor: 'pointer'}}
                                            title="Hủy"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ) : (
                                    // --- CHẾ ĐỘ HIỂN THỊ NÚT ---
                                    <>
                                        {social.isLinked ? (
                                            <>
                                                <button 
                                                    className={styles.itemAction} 
                                                    style={{color: '#3b82f6', background: 'none', border: 'none', cursor:'pointer', fontWeight: 500}}
                                                    onClick={() => handleStartEdit(social.provider, social.profileUrl)}
                                                >
                                                    Sửa
                                                </button>
                                                <button 
                                                    style={{color: '#ef4444', background: 'none', border: 'none', cursor:'pointer', marginLeft: 8}}
                                                    onClick={() => handleUnlink(social.provider)}
                                                    title="Hủy liên kết"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                className={styles.itemAction} 
                                                style={{color: '#FE2C55', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer'}}
                                                onClick={() => handleStartEdit(social.provider)}
                                            >
                                                Liên kết ngay
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SocialSection;