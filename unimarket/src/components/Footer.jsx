import React from 'react';
import { useLocation } from 'react-router-dom';
import './Footer.css';
import { FaFacebookF, FaYoutube, FaInstagram, FaTiktok, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const location = useLocation();
  const isNhaTroPage = location.pathname === '/market/nha-tro' || location.pathname.includes('/nha-tro');

  return (
    <footer className={`footer ${isNhaTroPage ? 'nhaTroVariant' : ''}`}>
      <div className="footer-container">
        <div className="footer-grid">
          {/* Column 1: About */}
          <div className="footer-column">
            <img src="/logoWeb.png" alt="Unimarket" className="footer-logo" />
            <p className="footer-about">Unimarket - Nền tảng mua bán, trao đổi hàng hóa đa dạng, uy tín hàng đầu.</p>
            <div className="footer-social">
              <a href="#" className="social-icon"><FaFacebookF /></a>
              <a href="#" className="social-icon"><FaYoutube /></a>
              <a href="#" className="social-icon"><FaInstagram /></a>
              <a href="#" className="social-icon"><FaTiktok /></a>
            </div>
          </div>
          
          {/* Column 2: Categories */}
          <div className="footer-column">
            <h5 className="footer-heading">Hỗ trợ khách hàng</h5>
            <a href="#" className="footer-link">Trung tâm trợ giúp</a>
            <a href="#" className="footer-link">An toàn mua sắm</a>
            <a href="#" className="footer-link">Liên hệ hỗ trợ</a>
          </div>
          
          {/* Column 3: Information */}
          <div className="footer-column">
            <h5 className="footer-heading">Thông tin</h5>
            <a href="#" className="footer-link">Giới thiệu</a>
            <a href="#" className="footer-link">Quy chế hoạt động</a>
            <a href="#" className="footer-link">Chính sách bảo mật</a>
            <a href="#" className="footer-link">Giải quyết tranh chấp</a>
            <a href="#" className="footer-link">Tuyển dụng</a>
            <a href="#" className="footer-link">Truyền thông</a>
          </div>
          
          {/* Column 4: Mobile App */}
          <div className="footer-column">
            <h5 className="footer-heading">Tải ứng dụng Unimarket</h5>
            <a href="#" className="app-download">
              {/* App Store logo */}
              <img 
                src="https://static.chotot.com/storage/default/ios.svg" 
                alt="App Store" 
                className="app-logo"
              />
            </a>
            <a href="#" className="app-download">
              {/* Google Play logo */}
              <img 
                src="https://static.chotot.com/storage/default/android.svg" 
                alt="Google Play" 
                className="app-logo"
              />
            </a>
            <div className="footer-contact">
              <h5 className="footer-heading">Liên hệ</h5>
              <p className="footer-contact-item"><FaPhone className="contact-icon" /> 0842 070 552</p>
              <p className="footer-contact-item"><FaEnvelope className="contact-icon" /> support@unimarket.vn</p>
              <p className="footer-contact-item"><FaMapMarkerAlt className="contact-icon" />Tp Hồ Chí Minh, Việt Nam</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>© {new Date().getFullYear()} Unimarket. Bản quyền thuộc về Công ty TNHH Unimarket Việt Nam.</p>
            <p className="footer-license">Giấy phép số 1234/GP-BTTTT do Bộ TT&TT cấp ngày 01/01/2025</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
