// src/pages/MarketPageElectronic.jsx
import React, { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import TopNavbar from "../components/TopNavbar/TopNavbar";
import MarketHeroHeader from "../components/MarketHeroHeader";
import CategoryListElectronic from "../components/CategoryListElectronic/CategoryListElectronic";
import TinDangDanhChoBan from "../components/TinDangDanhChoBan";
import UniMarketIntro from "../components/UniMarketIntro";
import "./MarketPage.css";
import FloatingAiButton from "../components/AI/FloatingAiButton";
import Footer from "../components/Footer";
import FooterBanner from "../components/FooterBanner/FooterBanner";


const MarketPageElectronic = () => {
  const { user } = useContext(AuthContext);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  return (
    <div className="marketplace-page">
      <TopNavbar />
      <MarketHeroHeader />
     
      <div className="main-content" style={{ minHeight: "200vh" }}>
       
        <CategoryListElectronic />


        <div className="section-wrapper">
          {/* ✅ QUAN TRỌNG: Truyền đúng từ khóa Danh Mục Cha cần lọc */}
          <TinDangDanhChoBan categoryGroup="đồ điện tử" />
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


export default MarketPageElectronic;

