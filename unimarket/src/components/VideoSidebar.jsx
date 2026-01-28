import React from "react";
import { FaUser, FaHome } from "react-icons/fa";
import { useSearchContext } from "../context/SearchContext";
import "./VideoSidebar.css";

export default function VideoSidebar({ searchBar }) {
  const { isSearching } = useSearchContext();

  return (
    <div className={`sidebar ${isSearching ? "collapsed" : ""}`}>
      {/* Logo và tên thương hiệu */}
      <div className="logo-section">
        <img src="/logoWeb.png" alt="Logo" className="logo" />
        {!isSearching && <h1 className="brand-name">UniMarket</h1>}
      </div>

      {/* Thanh tìm kiếm (nhận từ props) */}
      <div className="search-section">
        {searchBar}
      </div>

      {/* Menu điều hướng */}
      <div className="menu-section">
        <div className="menu-item active">
          <FaHome className="menu-icon" />
          {!isSearching && <span className="menu-text">For You</span>}
        </div>
        <div className="menu-item">
          <FaUser className="menu-icon" />
          {!isSearching && <span className="menu-text">Profile</span>}
        </div>
      </div>
    </div>
  );
}