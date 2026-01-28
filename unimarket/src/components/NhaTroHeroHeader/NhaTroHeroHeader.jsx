// src/components/NhaTroHeroHeader/NhaTroHeroHeader.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaTimes, FaMapMarkerAlt, FaChevronDown } from "react-icons/fa";
import baner1 from '../../assets/baner1.png';
import phongTroBanner from '../../assets/phong_tro_banner.jpg';
import styles from './NhaTroHeroHeader.module.css';

const NhaTroHeroHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const heroContainerRef = useRef(null);

  // Detect current page để set banner tương ứng
  const getBannerImage = () => {
    if (location.pathname === '/nha-tro') {
      return phongTroBanner;
    }
    return baner1; // Default banner cho trang chủ
  };

  // Search States
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Location States
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [locationSearchText, setLocationSearchText] = useState("");

  // Category States
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (heroContainerRef.current && !heroContainerRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
        setShowCategoryDropdown(false);
        setShowSuggestions(false);
      }
    };

    // Scroll handler - close dropdowns when user scrolls
    const handleScroll = () => {
      setShowLocationDropdown(false);
      setShowCategoryDropdown(false);
      setShowSuggestions(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/tindang/tinhthanh");
        setProvinces(response.data || []);
      } catch (error) {
        console.error("Lỗi tải tỉnh thành:", error);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvince?.maTinhThanh) {
      const fetchDistricts = async () => {
        try {
          const response = await axios.get(
            `http://localhost:5133/api/tindang/tinhthanh/${selectedProvince.maTinhThanh}/quanhuynh`
          );
          setDistricts(response.data || []);
        } catch (error) {
          console.error("Lỗi tải quận huyện:", error);
        }
      };
      fetchDistricts();
    }
  }, [selectedProvince]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        const allCategories = response.data;
        
        // Tìm danh mục cha là "Nhà trọ"
        const batDongSanCat = allCategories.find(
          cat => cat.tenDanhMucCha && 
          cat.tenDanhMucCha.toLowerCase().trim() === "nhà trọ"
        );
        
        if (batDongSanCat && batDongSanCat.danhMucCon) {
          setSelectedSubCategories(batDongSanCat.danhMucCon);
          console.log("✅ Loaded sub categories:", batDongSanCat.danhMucCon);
        } else {
          console.log("❌ Không tìm thấy danh mục 'Nhà trọ'");
          console.log("📊 Available categories:", allCategories);
        }
        setCategories(allCategories || []);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(
          `http://localhost:5133/api/tindang/suggestions?query=${encodeURIComponent(searchText)}&limit=8`
        );
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Lỗi tải gợi ý:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Handle search
  const handleSearch = () => {
    if (!searchText.trim()) return;

    const params = new URLSearchParams();
    params.append('q', searchText);
    
    if (selectedProvince?.maTinhThanh) {
      params.append('province', selectedProvince.maTinhThanh);
    }
    if (selectedDistrict?.maQuanHuyen) {
      params.append('district', selectedDistrict.maQuanHuyen);
    }

    navigate(`/loc-tin-dang?${params.toString()}`);
    setShowSuggestions(false);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    navigate(`/chi-tiet-tin-dang-nha-tro/${suggestion.maTinDang}`);
    setShowSuggestions(false);
  };

  // Update location display
  const updateLocationDisplay = () => {
    const parts = [];
    if (selectedDistrict) parts.push(selectedDistrict.tenQuanHuyen);
    if (selectedProvince) parts.push(selectedProvince.tenTinhThanh);
    setSelectedLocation(parts.join(", ") || "");
  };

  useEffect(() => {
    updateLocationDisplay();
  }, [selectedProvince, selectedDistrict]);

  // Filter provinces/districts
  const filteredProvinces = provinces.filter(p =>
    p.tenTinhThanh?.toLowerCase().includes(locationSearchText.toLowerCase())
  );

  const filteredDistricts = districts.filter(d =>
    d.tenQuanHuyen?.toLowerCase().includes(locationSearchText.toLowerCase())
  );

  return (
    <div 
      className={styles.heroContainer} 
      ref={heroContainerRef}
    >
      <div className={styles.heroContent}>
        {/* Subtitle cho trang nhà trọ */}
        {location.pathname === '/nha-tro' && (
          <h2 className={styles.heroSubtitle}>Nhà vừa ý, giá hợp lý!</h2>
        )}
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <div className={styles.inputWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Tìm bất động sản..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
            {searchText && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setSearchText("");
                  setSuggestions([]);
                }}
              >
                <FaTimes />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className={styles.suggestionsDropdown} ref={suggestionsRef}>
                {loadingSuggestions ? (
                  <div className={styles.suggestionItem}>Đang tải...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((sugg, idx) => (
                    <div
                      key={idx}
                      className={styles.suggestionItem}
                      onClick={() => handleSuggestionClick(sugg)}
                    >
                      <FaSearch className={styles.suggestionIcon} />
                      <div className={styles.suggestionText}>
                        <div className={styles.suggestionTitle}>{sugg.tieuDe}</div>
                        <div className={styles.suggestionCategory}>{sugg.danhMucCha}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.suggestionItem}>Không tìm thấy kết quả</div>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className={styles.filtersContainer}>
            {/* Location Filter */}
            <div className={styles.filterBtn}>
              <button
                className={styles.locationBtn}
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#FFC107"></path>
                  <circle cx="12" cy="9" r="2.5" fill="#fff"></circle>
                </svg>
                <span className={styles.locText}>
                  {selectedLocation || "Chọn khu vực"}
                </span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>

              {/* Location Dropdown */}
              {showLocationDropdown && (
                <div className={styles.dropdownMenu}>
                  <input
                    type="text"
                    placeholder="Tìm tỉnh thành..."
                    value={locationSearchText}
                    onChange={(e) => setLocationSearchText(e.target.value)}
                    className={styles.dropdownSearch}
                  />

                  <div className={styles.optionsContainer}>
                    {!selectedProvince ? (
                      // Show provinces
                      filteredProvinces.map(province => (
                        <div
                          key={province.maTinhThanh}
                          className={styles.option}
                          onClick={() => {
                            setSelectedProvince(province);
                            setLocationSearchText("");
                            setShowLocationDropdown(false);
                          }}
                        >
                          {province.tenTinhThanh}
                        </div>
                      ))
                    ) : (
                      <>
                        {/* Back to province selection */}
                        <div
                          className={`${styles.option} ${styles.backOption}`}
                          onClick={() => {
                            setSelectedProvince(null);
                            setSelectedDistrict(null);
                            setLocationSearchText("");
                          }}
                        >
                          ← Quay lại
                        </div>

                        {/* Show districts */}
                        {filteredDistricts.map(district => (
                          <div
                            key={district.maQuanHuyen}
                            className={styles.option}
                            onClick={() => {
                              setSelectedDistrict(district);
                              setShowLocationDropdown(false);
                              setLocationSearchText("");
                            }}
                          >
                            {district.tenQuanHuyen}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className={styles.filterBtn}>
              <div
                className={styles.filterDropdown}
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <span className={styles.filterLabel}>Loại hình PT</span>
                <FaChevronDown className={styles.dropdownIcon} />
              </div>

              {/* Category Dropdown */}
              {showCategoryDropdown && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.optionsContainer}>
                    {selectedSubCategories.map(subCat => (
                      <div
                        key={subCat.id}
                        className={styles.option}
                        onClick={() => {
                          setSearchText(subCat.tenDanhMucCon);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {subCat.tenDanhMucCon}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search Button */}
            <button className={styles.searchBtn} onClick={handleSearch}>
              <FaSearch />
              <span>Tìm nhà</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NhaTroHeroHeader;
