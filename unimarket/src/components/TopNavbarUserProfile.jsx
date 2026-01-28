import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryContext } from "../context/CategoryContext";
import { SearchContext } from "../context/SearchContext";
import { FaArrowLeft, FaHome, FaUser } from "react-icons/fa";
import "./TopNavbarUserProfile.css";

const TopNavbarUserProfile = ({ profileUser, isScrolled }) => {
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext);
  const navigate = useNavigate();

  const resetFiltersAndNavigate = (path) => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSearchTerm("");
    navigate(path);
  };

  const handleBackClick = () => navigate(-1);
  const handleHomeClick = () => resetFiltersAndNavigate("/market");
  const handleLogoClick = () => resetFiltersAndNavigate("/market");

  return (
    <header className={`topnavbar-userprofile ${isScrolled ? 'topnavbar-userprofile-scrolled' : ''}`}>
      <div className="topnavbar-userprofile-container">
        
        {/* Khi không scroll - hiển thị full navbar */}
        {!isScrolled && (
          <>
            {/* Left: Back + Logo */}
            <div className="topnavbar-userprofile-left">
              <button
                className="topnavbar-userprofile-btn-back"
                onClick={handleBackClick}
                title="Quay lại"
              >
                <FaArrowLeft />
              </button>

              <div
                className="topnavbar-userprofile-logo"
                onClick={handleLogoClick}
                title="Về trang chủ"
              >
                <img
                  src="/logoWeb.png"
                  alt="Logo"
                  className="topnavbar-userprofile-logo-img"
                />
                <span className="topnavbar-userprofile-logo-text">UniMarket</span>
              </div>
            </div>

            {/* Center: Profile Name */}
            <div className="topnavbar-userprofile-center">
              {profileUser && (profileUser.fullName || profileUser.tenNguoiDung) ? (
                <div className="topnavbar-userprofile-title">
                  <span className="prefix">Trang cá nhân của</span>{" "}
                  <span className="name">{profileUser.fullName || profileUser.tenNguoiDung}</span>
                </div>
              ) : (
                <div className="topnavbar-userprofile-loading">
                  <span className="dots" /> Đang tải thông tin...
                </div>
              )}
            </div>

            {/* Right: Home */}
            <div className="topnavbar-userprofile-right">
              <button
                className="topnavbar-userprofile-btn-home"
                onClick={handleHomeClick}
                title="Trang chủ"
              >
                <FaHome />
              </button>
            </div>
          </>
        )}

        {/* Khi scroll - hiển thị avatar + tên profile trong khối trắng bo tròn */}
        {isScrolled && (
          <div className="topnavbar-userprofile-scrolled-content">
            {profileUser && (profileUser.fullName || profileUser.tenNguoiDung) ? (
              <>
                <div className="topnavbar-userprofile-scrolled-avatar">
                  {profileUser.avatarUrl || profileUser.anhDaiDien ? (
                    <img 
                      src={profileUser.avatarUrl || profileUser.anhDaiDien} 
                      alt="Avatar" 
                      className="topnavbar-userprofile-scrolled-avatar-img"
                    />
                  ) : (
                    <div className="topnavbar-userprofile-scrolled-avatar-default">
                      <FaUser />
                    </div>
                  )}
                </div>
                <div className="topnavbar-userprofile-scrolled-title">
                  Trang cá nhân của {profileUser.fullName || profileUser.tenNguoiDung}
                </div>
              </>
            ) : (
              <div className="topnavbar-userprofile-scrolled-loading">
                Đang tải thông tin...
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
};

export default TopNavbarUserProfile;