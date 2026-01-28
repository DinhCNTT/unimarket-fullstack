import React from 'react';
import { useLocation } from 'react-router-dom';
import styles from './FooterBanner.module.css'; 
import bannerImg from '../../assets/footer_promo_banner.png';

const appStoreUrl = "https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg";
const googlePlayUrl = "https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg";

const FooterBanner = () => {
  const location = useLocation();
  const isNhaTroPage = location.pathname === '/market/nha-tro' || location.pathname.includes('/nha-tro');

  return (
    <div className={`${styles.container} ${isNhaTroPage ? styles.nhaTroVariant : ''}`}>
      <div className={styles.innerContent}>
        
        {/* --- PHẦN BÊN TRÁI: TEXT + BUTTONS --- */}
        <div className={styles.leftSection}>
            <h2 className={styles.heading}>Mua thì hời, bán thì lời</h2>
            <p className={styles.subText}>Tải app ngay!</p>
            
            <div className={styles.btnGroup}>
                <a href="#" className={styles.storeLink}>
                    <img src={appStoreUrl} alt="Download on App Store" />
                </a>
                <a href="#" className={styles.storeLink}>
                    <img src={googlePlayUrl} alt="Get it on Google Play" />
                </a>
            </div>
        </div>

        {/* --- PHẦN BÊN PHẢI: ẢNH BANNER CŨ --- */}
        <div className={styles.rightSection}>
            <a href="#"> {/* Link bao quanh ảnh nếu muốn bấm vào ảnh cũng tải app */}
                <img 
                    src={bannerImg} 
                    alt="Tải ứng dụng UniMarket ngay" 
                    className={styles.bannerImage} 
                />
            </a>
        </div>

      </div>
    </div>
  );
};

export default FooterBanner;