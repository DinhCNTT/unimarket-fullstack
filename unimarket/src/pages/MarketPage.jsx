//src/pages/MarketPage.jsx
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar/TopNavbar";
import MarketHeroHeader from "../components/MarketHeroHeader";
import CategoryList from "../components/CategoryList";
import TinDangDanhChoBan from "../components/TinDangDanhChoBan";
import TrendingKeywords from "../components/TrendingKeywords/TrendingKeywords";
import UniMarketIntro from "../components/UniMarketIntro";
import "./MarketPage.css";
import FloatingAiButton from "../components/AI/FloatingAiButton";
import Footer from "../components/Footer";
import FooterBanner from "../components/FooterBanner/FooterBanner";


const MarketplacePage = () => {
  const { user } = useContext(AuthContext);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  return (
    <div className="marketplace-page">
      <TopNavbar />
      <MarketHeroHeader />
      {/* Removed centered text AI button; using floating icon-only button instead */}
      <div className="main-content" style={{ minHeight: "200vh" }}>
        <CategoryList />


        <div className="section-wrapper">
          <TinDangDanhChoBan />
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
        {/* Đã xóa dòng FeatureSection tiêu đề, chỉ giữ lại nội dung component */}
        <div className="section-wrapper">
           <TrendingKeywords />
        </div>
      </div>
      <FooterBanner />
      <Footer />
        {/* ✅ FloatingAiButton - Fixed position, always on top */}
      <div style={{ position: 'fixed', right: 0, bottom: 0, zIndex: 99999, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <FloatingAiButton user={user} />
        </div>
      </div>
    </div>
  );
};


export default MarketplacePage;