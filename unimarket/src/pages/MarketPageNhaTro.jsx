// src/pages/MarketPageNhaTro.jsx
import React, { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import NhaTroTopNavbar from "../components/TopNavbar/NhaTroTopNavbar";
import NhaTroHeroHeader from "../components/NhaTroHeroHeader/NhaTroHeroHeader";
import CategoryListNhaTro from "../components/CategoryListNhaTro/CategoryListNhaTro";
import TinDangDCBNhaTro from "../components/TinDangDCBNhaTro";
import UniMarketIntro from "../components/UniMarketIntro";
import "./MarketPage.css";
import FloatingAiButton from "../components/AI/FloatingAiButton";
import Footer from "../components/Footer";
import FooterBanner from "../components/FooterBanner/FooterBanner";


const MarketPageNhaTro = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="marketplace-page nhaTroVariant">
      <NhaTroTopNavbar />
      <NhaTroHeroHeader />
     
      <div className="main-content" style={{ minHeight: "100vh" }}>
       
        <CategoryListNhaTro />

        <div className="section-wrapper">
          {/* ✅ Sử dụng component TinDangDCBNhaTro dành riêng cho trang nhà trọ */}
          <TinDangDCBNhaTro />
        </div>

        {!user && (
          <div className="section-wrapper">
            <p className="login-prompt">
              Hãy <a href="/login">đăng nhập</a> hoặc <a href="/register">đăng ký</a> để đăng tin hoặc quản lý tin của bạn!
            </p>
          </div>
        )}

        <div className="section-wrapper">
          <UniMarketIntro />
        </div>
      </div>
      <FooterBanner />
      <Footer />
     
      <div style={{ position: 'fixed', right: 0, bottom: 0, zIndex: 99999, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <FloatingAiButton user={user} />
        </div>
      </div>
    </div>
  );
};

export default MarketPageNhaTro;
