import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // [NEW] Thêm useLocation
import axios from 'axios';
import { FaSearch, FaClock, FaTimes, FaArrowLeft, FaCheck } from "react-icons/fa";

import './MarketHeroHeader.css';
import "./SearchBar.css"; 

import { CategoryContext } from '../context/CategoryContext';
import { useProductSearch } from '../hooks/useProductSearch';

// --- Icons SVG (Giữ nguyên) ---
const IconChevronDown = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 5L9 1" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLocation = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#FFC107"/>
    <circle cx="12" cy="9" r="2.5" fill="#fff"/>
  </svg>
);

const MarketHeroHeader = () => {
  // =========================================================
  // 1. SỬ DỤNG HOOK & CONTEXT
  // =========================================================
  const {
    inputValue, setInputValue,
    suggestions, searchHistory,
    showSuggestions, setShowSuggestions,
    loadingSuggestions, loadingHistory,
    user,
    handleSearch,
    deleteSearchHistoryItem,
    highlightText,
    formatDate,
    selectedLocation, 
    setSelectedLocation 
  } = useProductSearch();

  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const navigate = useNavigate();
  const location = useLocation(); // [NEW] Lấy thông tin URL hiện tại

  // =========================================================
  // [QUAN TRỌNG] HÀM WRAPPER: XỬ LÝ CONTEXT TRƯỚC KHI SEARCH
  // =========================================================
  const onTriggerSearch = (keywordInput) => {
    // 1. Xác định từ khóa (nếu click gợi ý thì dùng keywordInput, nếu enter thì dùng inputValue)
    const finalKeyword = keywordInput || inputValue;

    console.log("--- HERO HEADER SEARCH ---");
    console.log("URL:", location.pathname);

    // 2. Logic Set Context theo URL
    let categoryToSet = null;

    if (location.pathname.includes("/market/do-dien-tu")) {
        categoryToSet = "Đồ điện tử";
    } else if (location.pathname.includes("/market/nha-tro")) {
        categoryToSet = "Bất động sản";
    }

    // 3. Thực hiện Set Context nếu cần
    if (categoryToSet) {
        console.log(`Auto-setting Category: ${categoryToSet}`);
        setSelectedCategory(categoryToSet);
        setSelectedSubCategory(""); // Reset sub category
    }

    // 4. Gọi hàm search gốc để chuyển trang
    handleSearch(finalKeyword);
  };

  // =========================================================
  // 2. LOGIC RIÊNG CỦA HERO HEADER
  // =========================================================
  
  // Refs
  const bannerRef = useRef(null);
  const dropdownLocationRef = useRef(null);
  const suggestionsRef = useRef(null);
  const hoverTimerRef = useRef(null);

  // UI States
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Location UI States
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [provinces, setProvinces] = useState([]); 
  const [tempCity, setTempCity] = useState(null); 
  const [popupView, setPopupView] = useState('PROVINCE'); 
  const [locationSearchText, setLocationSearchText] = useState(""); 

  // Constants
  const HOVER_CLOSE_DELAY_MS = 300;
  const HERO_SCROLL_ENTER = 400;
  const HERO_SCROLL_EXIT = 440;

  // --- Scroll Logic ---
  useEffect(() => {
    const setHeroMode = () => {
      const y = window.scrollY;
      if (y <= HERO_SCROLL_ENTER && !document.body.classList.contains('mp-hero-active')) {
        document.body.classList.add('mp-hero-active');
      } else if (y >= HERO_SCROLL_EXIT && document.body.classList.contains('mp-hero-active')) {
        document.body.classList.remove('mp-hero-active');
      }
    };
    setHeroMode();
    window.addEventListener('scroll', setHeroMode);
    window.addEventListener('resize', setHeroMode);
    return () => {
      window.removeEventListener('scroll', setHeroMode);
      window.removeEventListener('resize', setHeroMode);
      document.body.classList.remove('mp-hero-active');
    };
  }, []);

  // --- Click Outside Logic ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownLocationRef.current && !dropdownLocationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowSuggestions]);

  // --- API ---
  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        if (mounted) setCategories(res.data || []);
      } catch (error) { console.error(error); }
    };
    fetchCategories();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/tindang/tinhthanh");
        if (response.data) setProvinces(response.data);
      } catch (error) { console.error(error); }
    };
    fetchProvinces();
  }, []);


  // --- Handlers: Location Popup UI ---
  const handleLocationClick = () => {
    if (!showLocationDropdown) {
        setPopupView('PROVINCE');
        setLocationSearchText("");
    }
    setShowLocationDropdown(!showLocationDropdown);
    setShowSuggestions(false); 
  };

  const handleSelectNationwide = () => {
    setSelectedLocation("Toàn quốc");
    setTempCity(null);
    setShowLocationDropdown(false);
  };

  const handleSelectCity = (city) => {
    setTempCity(city);
    setLocationSearchText("");
    setPopupView('DISTRICT');
  };

  const handleBackToProvinces = () => {
    setPopupView('PROVINCE');
    setLocationSearchText("");
  };

  const handleSelectDistrict = (districtName) => {
    let finalLocation = "";
    if (districtName === "Tất cả") {
        finalLocation = tempCity.tenTinhThanh;
    } else {
        finalLocation = `${districtName}, ${tempCity.tenTinhThanh}`;
    }
    setSelectedLocation(finalLocation);
    setShowLocationDropdown(false);
  };

  // Filter Logic for Location
  const filteredProvinces = provinces.filter(p => 
    p.tenTinhThanh.toLowerCase().includes(locationSearchText.toLowerCase())
  );
  const filteredDistricts = tempCity ? tempCity.quanHuyens.filter(d => 
    d.tenQuanHuyen.toLowerCase().includes(locationSearchText.toLowerCase())
  ) : [];
  const shouldShowNationwide = "toàn quốc".includes(locationSearchText.toLowerCase());


  // =========================================================
  // 3. RENDER
  // =========================================================
  return (
    <div className="mp-hero-wrapper">
      {/* HEADER LOGO */}
      <header className="mp-hero-top" ref={bannerRef}>
        <div className="nav-left">
          <a className="logo-link" href="/" onClick={(e) => { e.preventDefault(); navigate('/market'); }}>
            <img src="/logoWeb (1).png" alt="Unimarket" className="logo-img" />
          </a>
        </div>
      </header>

      {/* SEARCH ROW */}
      <div className="mp-search-row">
        <div className="mp-search-inner">
          <div className="hero-search-bar">

            {/* 1. Danh mục Dropdown */}
            <div 
              className="search-category-wrapper"
              onMouseEnter={() => {
                if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                setShowCategoryDropdown(true);
              }}
              onMouseLeave={() => {
                hoverTimerRef.current = setTimeout(() => {
                  setShowCategoryDropdown(false);
                }, HOVER_CLOSE_DELAY_MS);
              }}
            >
              <button className="search-category-btn">
                Danh mục <span className="icon-chevron"><IconChevronDown /></span>
              </button>

              {showCategoryDropdown && (
                <div className="hero-dropdown-content">
                  {categories.map((parent) => (
                    <div key={parent.id} className="hero-parent-item">
                      <div className="hero-parent-link" onClick={() => {
                          setSelectedCategory(parent.tenDanhMucCha);
                          navigate('/loc-tin-dang');
                      }}>
                        {parent.icon && <img src={parent.icon} alt="" className="hero-cat-icon" />}
                        {parent.tenDanhMucCha}
                      </div>
                      
                      {parent.danhMucCon && parent.danhMucCon.length > 0 && (
                        <div className="hero-sub-menu">
                          {parent.danhMucCon.map((child) => (
                            <div key={child.id} className="hero-sub-link" onClick={() => {
                                setSelectedCategory(parent.tenDanhMucCha);
                                setSelectedSubCategory(child.tenDanhMucCon);
                                navigate('/loc-tin-dang');
                            }}>
                              {child.tenDanhMucCon}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="search-divider"></div>

            {/* 2. Ô nhập liệu (Đã dùng logic Wrapper) */}
            <div className="search-input-area" ref={suggestionsRef} style={{ position: 'relative' }}>
              <span className="search-icon"><IconSearch /></span>
              
              <input
                type="text"
                className="hero-input-field"
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', paddingLeft: '8px' }}
                placeholder="Tìm kiếm sản phẩm trên Unimarket"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                    // [NEW] Sử dụng hàm Wrapper
                    if (e.key === "Enter") onTriggerSearch();
                    else if (e.key === "Escape") setShowSuggestions(false);
                }}
                onFocus={() => {
                    if (inputValue.trim() || (user && searchHistory.length > 0)) {
                        setShowSuggestions(true);
                    }
                }}
              />
              
              {showSuggestions && (
                <div className="SearchBarSuggestionsDropdown" style={{ top: '45px', left: '-40px', width: '140%' }}> 
                  {/* Lịch sử tìm kiếm */}
                  {!inputValue.trim() && user && searchHistory.length > 0 && (
                    <>
                      <div className="SearchBarSuggestionsHeader">
                        <span className="SearchBarSuggestionsTitle">Lịch sử tìm kiếm</span>
                      </div>
                      {searchHistory.map((historyItem) => (
                        <div
                          key={historyItem.id}
                          className="SearchBarSuggestionItem SearchBarHistoryItem"
                          onClick={() => {
                              setInputValue(historyItem.keyword);
                              onTriggerSearch(historyItem.keyword); // [NEW] Dùng Wrapper
                          }}
                        >
                          <FaClock className="SearchBarSuggestionIcon SearchBarHistoryIcon" />
                          <div className="SearchBarSuggestionContent">
                            <div className="SearchBarSuggestionTitle">{historyItem.keyword}</div>
                            <div className="SearchBarSuggestionCategory">{formatDate(historyItem.createdAt)}</div>
                          </div>
                          <button
                            className="SearchBarHistoryDelete"
                            onClick={(e) => deleteSearchHistoryItem(historyItem.id, e)}
                            title="Xóa lịch sử"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Gợi ý API */}
                  {inputValue.trim() && (
                    <>
                      <div className="SearchBarSuggestionsHeader">
                        <span className="SearchBarSuggestionsTitle">Tìm kiếm từ khóa "{inputValue}"</span>
                      </div>
                      
                      {loadingSuggestions ? (
                        <div className="SearchBarSuggestionLoading">
                          <span>Đang tìm kiếm...</span>
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.maTinDang}-${index}`}
                            className="SearchBarSuggestionItem"
                            onClick={() => {
                                setInputValue(suggestion.tieuDe);
                                onTriggerSearch(suggestion.tieuDe); // [NEW] Dùng Wrapper
                            }}
                          >
                            <FaSearch className="SearchBarSuggestionIcon" />
                            <div className="SearchBarSuggestionContent">
                              <div className="SearchBarSuggestionTitle">
                                {highlightText(suggestion.tieuDe, inputValue)}
                              </div>
                              <div className="SearchBarSuggestionCategory">
                                trong {suggestion.danhMucCha}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="SearchBarSuggestionEmpty">
                          <span>Không tìm thấy gợi ý nào</span>
                        </div>
                      )}
                    </>
                  )}

                  {!inputValue.trim() && user && searchHistory.length === 0 && !loadingHistory && (
                    <div className="SearchBarSuggestionEmpty"><span>Chưa có lịch sử tìm kiếm</span></div>
                  )}
                  {!inputValue.trim() && !user && (
                    <div className="SearchBarSuggestionEmpty"><span>Đăng nhập để xem lịch sử tìm kiếm</span></div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Nút Địa điểm */}
            <div className="search-location-wrapper" ref={dropdownLocationRef} style={{ position: 'relative' }}>
                <button className="location-btn" onClick={handleLocationClick}>
                  <IconLocation />
                  <span className="loc-text">
                    {(selectedLocation && selectedLocation.trim() !== "") ? selectedLocation : "Toàn quốc"}
                  </span>
                  <IconChevronDown />
                </button>

                {showLocationDropdown && (
                  <div className="LocationPopupCard">
                    <div className="LocationPopupHeader">
                        {popupView === 'DISTRICT' && (
                            <button className="LocationBackBtn" onClick={handleBackToProvinces}>
                                <FaArrowLeft />
                            </button>
                        )}
                        <span className="LocationPopupTitleText">
                            {popupView === 'PROVINCE' ? "Chọn tỉnh thành" : "Chọn quận huyện"}
                        </span>
                    </div>

                    <div className="LocationSearchWrapper">
                        <FaSearch className="LocationSearchIcon" />
                        <input 
                            type="text" 
                            className="LocationSearchInput"
                            placeholder={popupView === 'PROVINCE' ? "Tìm tỉnh thành" : "Tìm quận huyện"}
                            value={locationSearchText}
                            onChange={(e) => setLocationSearchText(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="LocationListWrapper">
                        {/* DANH SÁCH TỈNH */}
                        {popupView === 'PROVINCE' && (
                            <>
                                {shouldShowNationwide && (
                                  <div className="LocationItem" onClick={handleSelectNationwide}>
                                      <span className={`LocationItemName ${(!selectedLocation || selectedLocation === "Toàn quốc") ? 'active-text' : ''}`}>
                                          Toàn quốc
                                      </span>
                                      {(!selectedLocation || selectedLocation === "Toàn quốc") && (
                                          <div className="LocationCheckIcon"><FaCheck /></div>
                                      )}
                                  </div>
                                )}
                                {filteredProvinces.map(city => (
                                    <div key={city.maTinhThanh} className="LocationItem" onClick={() => handleSelectCity(city)}>
                                        <span className={`LocationItemName ${tempCity?.maTinhThanh === city.maTinhThanh ? 'active-text' : ''}`}>
                                            {city.tenTinhThanh}
                                        </span>
                                        {tempCity?.maTinhThanh === city.maTinhThanh && (
                                            <div className="LocationCheckIcon"><FaCheck /></div>
                                        )}
                                    </div>
                                ))}
                                {filteredProvinces.length === 0 && !shouldShowNationwide && (
                                    <div className="LocationEmpty">Không tìm thấy tỉnh thành</div>
                                )}
                            </>
                        )}

                        {/* DANH SÁCH HUYỆN */}
                        {popupView === 'DISTRICT' && (
                            <>
                                <div className="LocationItem" onClick={() => handleSelectDistrict("Tất cả")}>
                                    <span className="LocationItemName">Tất cả</span>
                                </div>
                                {filteredDistricts.map(dist => (
                                    <div key={dist.maQuanHuyen} className="LocationItem" onClick={() => handleSelectDistrict(dist.tenQuanHuyen)}>
                                        <span className="LocationItemName">{dist.tenQuanHuyen}</span>
                                    </div>
                                ))}
                                {filteredDistricts.length === 0 && (
                                    <div className="LocationEmpty">Không tìm thấy quận huyện</div>
                                )}
                            </>
                        )}
                    </div>
                  </div>
                )}
            </div>

            {/* 4. Nút Tìm kiếm */}
            <button className="hero-search-btn" onClick={() => onTriggerSearch()}> {/* [NEW] Dùng Wrapper */}
              Tìm kiếm
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketHeroHeader;