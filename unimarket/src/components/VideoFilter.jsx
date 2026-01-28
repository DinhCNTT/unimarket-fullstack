import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./VideoFilter.module.css";
import { FaChevronDown, FaTimes } from "react-icons/fa";

// Hằng số giá tối đa
const MAX_PRICE_LIMIT = 50000000; // 50 triệu

// Hàm định dạng số cho dễ đọc
const formatPriceDisplay = (value) => {
  if (value === MAX_PRICE_LIMIT) return "50 triệu";
  if (value >= 1000000) return `${value / 1000000} triệu`;
  if (value === 0) return "0";
  return new Intl.NumberFormat("vi-VN").format(value);
};

const VideoFilter = ({ onApplyFilter, onClearFilter }) => {
  // --- State cho Danh mục ---
  const [categories, setCategories] = useState([]);
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [activeParentCategory, setActiveParentCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState({
    parent: null,
    child: null,
  });

  // --- State cho Giá ---
  const [isPriceOpen, setPriceOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE_LIMIT);
  const [isPriceFiltered, setIsPriceFiltered] = useState(false);

  // --- Refs để đóng dropdown khi click ra ngoài ---
  const categoryRef = useRef(null);
  const priceRef = useRef(null);

  // Lấy dữ liệu danh mục từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5133/api/Category/get-categories-with-icon"
        );
        setCategories(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // Xử lý click ra ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
      if (priceRef.current && !priceRef.current.contains(event.target)) {
        setPriceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Hàm xử lý cho Giá ---
  const handleMinSliderChange = (e) => {
    const value = Math.min(Number(e.target.value), maxPrice - 1000000);
    setMinPrice(value);
  };

  const handleMaxSliderChange = (e) => {
    const value = Math.max(Number(e.target.value), minPrice + 1000000);
    setMaxPrice(value);
  };

  const handleMinInputChange = (e) => {
    const value = Number(e.target.value.replace(/\D/g, ""));
    setMinPrice(value > MAX_PRICE_LIMIT ? MAX_PRICE_LIMIT : value);
  };

  const handleMaxInputChange = (e) => {
    const value = Number(e.target.value.replace(/\D/g, ""));
    setMaxPrice(value > MAX_PRICE_LIMIT ? MAX_PRICE_LIMIT : value);
  };

  const handleApplyPrice = () => {
    setPriceOpen(false);
    setIsPriceFiltered(true);
    if (onApplyFilter) {
      onApplyFilter({
        categoryId: selectedCategory.child?.id || selectedCategory.parent?.id,
        minPrice,
        maxPrice,
      });
    }
  };

  const handleClearPrice = () => {
    setMinPrice(0);
    setMaxPrice(MAX_PRICE_LIMIT);
    setIsPriceFiltered(false);
    if (onApplyFilter) {
      onApplyFilter({
        categoryId: selectedCategory.child?.id || selectedCategory.parent?.id,
        minPrice: 0,
        maxPrice: MAX_PRICE_LIMIT,
      });
    }
  };

  // --- Hàm xử lý cho Danh mục ---
  const handleSelectCategory = (parent, child = null) => {
    setSelectedCategory({ parent, child });
    setCategoryOpen(false);
    
    if (onApplyFilter) {
      onApplyFilter({
        categoryId: child?.id || parent?.id,
        minPrice,
        maxPrice,
      });
    }
  };

  const handleClearCategory = () => {
    setSelectedCategory({ parent: null, child: null });
    setActiveParentCategory(null);
    if (onApplyFilter) {
      onApplyFilter({
        categoryId: null,
        minPrice,
        maxPrice,
      });
    }
  };

  // --- Hiển thị tên cho các nút ---
  const hasActiveFilters = selectedCategory.parent || isPriceFiltered;

  const handleClearAll = () => {
    handleClearPrice();
    handleClearCategory();
    if (onClearFilter) {
      onClearFilter();
    }
  };

  return (
    <div className={styles.filterBar}>
      {/* --- Bên trái: Các nút lọc --- */}
      <div className={styles.filterContainer}>
        {/* --- Nút Lọc Danh Mục --- */}
        <div className={styles.filterGroup} ref={categoryRef}>
          <button
            className={`${styles.filterButton} ${
              isCategoryOpen ? styles.active : ""
            }`}
            onClick={() => setCategoryOpen(!isCategoryOpen)}
          >
            <span>Danh mục</span>
            <FaChevronDown size={12} className={styles.chevron} />
          </button>
          
          {isCategoryOpen && (
            <div className={`${styles.dropdownMenu} ${styles.categoryDropdown}`}>
              <div className={styles.parentMenu}>
                {categories.map((parent) => (
                  <div
                    key={parent.id}
                    className={`${styles.categoryItem} ${
                      activeParentCategory?.id === parent.id ? styles.activeItem : ""
                    }`}
                    onMouseEnter={() => setActiveParentCategory(parent)}
                    onClick={() => handleSelectCategory(parent)}
                  >
                    {parent.icon && (
                      <img
                        src={parent.icon}
                        alt={parent.tenDanhMucCha}
                        className={styles.categoryIcon}
                      />
                    )}
                    <span>{parent.tenDanhMucCha}</span>
                  </div>
                ))}
              </div>
              <div className={styles.childMenu}>
                {activeParentCategory && (
                  <>
                    <div
                      className={`${styles.categoryItem} ${styles.allItem}`}
                      onClick={() => handleSelectCategory(activeParentCategory)}
                    >
                      Tất cả {activeParentCategory.tenDanhMucCha}
                    </div>
                    {activeParentCategory.danhMucCon.map((child) => (
                      <div
                        key={child.id}
                        className={styles.categoryItem}
                        onClick={() => handleSelectCategory(activeParentCategory, child)}
                      >
                        <span>{child.tenDanhMucCon}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- Nút Lọc Giá --- */}
        <div className={styles.filterGroup} ref={priceRef}>
          <button
            className={`${styles.filterButton} ${
              isPriceOpen ? styles.active : ""
            }`}
            onClick={() => setPriceOpen(!isPriceOpen)}
          >
            <span>Khoảng giá</span>
            <FaChevronDown size={12} className={styles.chevron} />
          </button>
          
          {isPriceOpen && (
            <div className={`${styles.dropdownMenu} ${styles.priceDropdown}`}>
              {/* Thanh trượt */}
              <div className={styles.sliderContainer}>
                <div className={styles.sliderTrack}></div>
                <div
                  className={styles.sliderRange}
                  style={{
                    left: `${(minPrice / MAX_PRICE_LIMIT) * 100}%`,
                    width: `${((maxPrice - minPrice) / MAX_PRICE_LIMIT) * 100}%`,
                  }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max={MAX_PRICE_LIMIT}
                  value={minPrice}
                  onChange={handleMinSliderChange}
                  className={styles.slider}
                />
                <input
                  type="range"
                  min="0"
                  max={MAX_PRICE_LIMIT}
                  value={maxPrice}
                  onChange={handleMaxSliderChange}
                  className={styles.slider}
                />
                <div className={styles.sliderLabels}>
                  <span>0đ</span>
                  <span>50 triệu</span>
                </div>
              </div>
              
              {/* Inputs */}
              <div className={styles.inputGroup}>
                <div className={styles.priceInputContainer}>
                  <input
                    type="text"
                    value={new Intl.NumberFormat("vi-VN").format(minPrice)}
                    onChange={handleMinInputChange}
                    className={styles.priceInput}
                    placeholder="Từ"
                  />
                  <span className={styles.currencySymbol}>đ</span>
                </div>
                <span className={styles.divider}>-</span>
                <div className={styles.priceInputContainer}>
                  <input
                    type="text"
                    value={new Intl.NumberFormat("vi-VN").format(maxPrice)}
                    onChange={handleMaxInputChange}
                    className={styles.priceInput}
                    placeholder="Đến"
                  />
                  <span className={styles.currencySymbol}>đ</span>
                </div>
              </div>
              
              {/* Nút bấm */}
              <div className={styles.buttonGroup}>
                <button className={styles.applyButton} onClick={handleApplyPrice}>
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Bên phải: Các điều kiện lọc đang active --- */}
      {hasActiveFilters && (
        <div className={styles.activeFiltersContainer}>
          <span className={styles.activeFiltersLabel}>Đang lọc:</span>
          
          {/* Tag Danh mục */}
          {selectedCategory.parent && (
            <div className={styles.filterTag}>
              <span className={styles.filterTagText}>
                {selectedCategory.child?.tenDanhMucCon || selectedCategory.parent?.tenDanhMucCha}
              </span>
              <button 
                className={styles.filterTagClose}
                onClick={handleClearCategory}
              >
                <FaTimes size={12} />
              </button>
            </div>
          )}

          {/* Tag Giá */}
          {isPriceFiltered && (minPrice !== 0 || maxPrice !== MAX_PRICE_LIMIT) && (
            <div className={styles.filterTag}>
              <span className={styles.filterTagText}>
                {formatPriceDisplay(minPrice)} - {formatPriceDisplay(maxPrice)}
              </span>
              <button 
                className={styles.filterTagClose}
                onClick={handleClearPrice}
              >
                <FaTimes size={12} />
              </button>
            </div>
          )}

          {/* Nút Xóa tất cả */}
          <button 
            className={styles.clearAllButton}
            onClick={handleClearAll}
          >
            Xóa tất cả
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoFilter;