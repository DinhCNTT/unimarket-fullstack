import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import styles from './Settings.module.css';
import TopNavbar from '../TopNavbar/TopNavbar';

// Icons
import { FaUser, FaLock, FaShieldAlt, FaShareAlt } from 'react-icons/fa';

// Sections
import AccountSection from './sections/AccountSection';
import PrivacySection from './sections/PrivacySection';
import SecuritySection from './sections/SecuritySection';
import SocialSection from './sections/SocialSection';

const AccountSettings = () => {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // State để biết đang xem mục nào (để highlight menu)
    const [activeTab, setActiveTab] = useState('account');

    useEffect(() => {
        if (!token) navigate("/login");
    }, [token, navigate]);

    // Danh sách Menu
    const menuItems = [
        { id: 'account', label: 'Quản lý tài khoản', icon: <FaUser /> },
        { id: 'privacy', label: 'Quyền riêng tư', icon: <FaLock /> },
        { id: 'security', label: 'Bảo mật & Đăng nhập', icon: <FaShieldAlt /> },
        { id: 'social', label: 'Tài khoản liên kết', icon: <FaShareAlt /> },
    ];

    // Hàm xử lý click menu -> Cuộn mượt tới phần đó
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            // Trừ đi khoảng cách header (120px) để thoáng hơn
            const headerOffset = 120;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    // LOGIC TỰ ĐỘNG HIGHLIGHT MENU KHI CUỘN (ScrollSpy)
    useEffect(() => {
        const handleScroll = () => {
            const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
            if (scrolledToBottom) {
                setActiveTab('social');
                return;
            }

            const sections = menuItems.map(item => document.getElementById(item.id));
            let currentSection = activeTab; 
            
            for (const section of sections) {
                if (section) {
                    const rect = section.getBoundingClientRect();
                    if (rect.top >= 0 && rect.top <= 300) {
                        currentSection = section.id;
                        break; 
                    } 
                    else if (rect.top < 0 && rect.bottom > 150) {
                        currentSection = section.id;
                    }
                }
            }
            setActiveTab(currentSection);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [activeTab]);

    return (
        // Nền xám nhạt bao trùm toàn bộ
        <div style={{ minHeight: '100vh', background: '#f3f4f6', paddingBottom: '60px' }}>
            <TopNavbar />
            
            <div className={styles.container}>
                {/* --- KHUNG 1: MENU (Cố định) --- */}
                <div className={styles.sidebar}>
                    {menuItems.map((item) => (
                        <div 
                            key={item.id}
                            className={`${styles.menuItem} ${activeTab === item.id ? styles.active : ''}`}
                            onClick={() => scrollToSection(item.id)}
                        >
                            <span className={styles.menuIcon}>{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                </div>

                {/* --- KHUNG 2: NỘI DUNG (Cuộn) --- */}
                <div className={styles.contentPanel}>
                    
                    <div id="account" className={styles.sectionWrapper}>
                        <AccountSection />
                    </div>

                    <hr className={styles.divider} />

                    <div id="privacy" className={styles.sectionWrapper}>
                        <PrivacySection />
                    </div>

                    <hr className={styles.divider} />

                    <div id="security" className={styles.sectionWrapper}>
                        <SecuritySection />
                    </div>

                    <hr className={styles.divider} />

                    <div id="social" className={styles.sectionWrapper}>
                        <SocialSection />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AccountSettings;