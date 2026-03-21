// src/pages/MarketPageNhaTro.jsx
import React, { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import NhaTroTopNavbar from "../components/TopNavbar/NhaTroTopNavbar";
import NhaTroHeroHeader from "../components/NhaTroHeroHeader/NhaTroHeroHeader";
import CategoryListNhaTro from "../components/CategoryListNhaTro/CategoryListNhaTro";
import NhaTroFilters from "../components/NhaTroFilters/NhaTroFilters";
import NhaTroPostGrid from "../components/NhaTroPostGrid/NhaTroPostGrid";
import NhaTroCategories from "../components/NhaTroCategories/NhaTroCategories";
import UniMarketIntro from "../components/UniMarketIntro";
import FloatingAiButton from "../components/AI/FloatingAiButton";
import Footer from "../components/Footer";
import FooterBanner from "../components/FooterBanner/FooterBanner";
import { useTinDangData } from "../hooks/useTinDangData";
import "./MarketPage.css";
import styles from "./MarketPageNhaTro.module.css";

const MarketPageNhaTro = () => {
  const { user } = useContext(AuthContext);

  // ── Filter state (được NhaTroFilters emit lên) ─────────────
  const [filters, setFilters] = useState({
    priceMin: null,
    priceMax: null,
    areaMin: null,
    areaMax: null,
    roomTypes: [],
    amenities: [],
    sortBy: "newest",
  });

  // ── Fetch data trực tiếp tại page để truyền xuống PostGrid ──
  const { posts, savedIds, isLoggedIn, handleToggleSave, loading } =
    useTinDangData("danhchoban", "nhà trọ", filters);

  // ── Callback khi NhaTroFilters thay đổi ────────────
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // ── Callback từ Quick Filter Pills (merge partial filter) ────
  const handleQuickFilter = useCallback((partial) => {
    setFilters(prev => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="marketplace-page nhaTroVariant">
      {/* Navbar */}
      <NhaTroTopNavbar />

      {/* Hero + Search + Quick Stats + Quick Pills */}
      <NhaTroHeroHeader onQuickFilter={handleQuickFilter} />

      <div className={styles.pageBody}>
        {/* Carousel danh mục con (Phòng trọ, Chung cư mini, …) */}
        <CategoryListNhaTro />

        {/* Bộ lọc nâng cao */}
        <div id="nha-tro-filters">
          <NhaTroFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Grid / List tin đăng */}
        <div className={styles.gridSection}>
          <NhaTroPostGrid
            posts={posts}
            savedIds={savedIds}
            isLoggedIn={isLoggedIn}
            onToggleSave={handleToggleSave}
            loading={loading}
            sortBy={filters.sortBy}
          />
        </div>

        {/* Danh mục BĐS (Mua bán / Cho thuê) */}
        <NhaTroCategories />

        {/* Giới thiệu UniMarket */}
        <div className={styles.introWrap}>
          <UniMarketIntro />
        </div>

        {/* Prompt đăng nhập cho guest */}
        {!user && (
          <div className={styles.loginPrompt}>
            Hãy{" "}
            <a href="/login">đăng nhập</a>{" "}
            hoặc{" "}
            <a href="/register">đăng ký</a>{" "}
            để đăng tin hoặc quản lý tin của bạn!
          </div>
        )}
      </div>

      <FooterBanner />
      <Footer />

      {/* Floating AI Button */}
      <div style={{ position: "fixed", right: 0, bottom: 0, zIndex: 99999, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <FloatingAiButton user={user} />
        </div>
      </div>
    </div>
  );
};

export default MarketPageNhaTro;
