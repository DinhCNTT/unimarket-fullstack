// src/components/NhaTroHeroHeader/NhaTroHeroHeader.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  FaSearch, FaTimes, FaChevronDown,
  FaTag, FaGraduationCap, FaSnowflake, FaClock, FaHome, FaWifi,
  FaBuilding, FaMapMarkerAlt, FaBolt
} from "react-icons/fa";
import { MdApartment } from "react-icons/md";
import styles from './NhaTroHeroHeader.module.css';

/**
 * NhaTroHeroHeader
 * 
 * Không có banner ảnh — NhaTroTopNavbar (position:absolute, height:320px)
 * đã hiển thị banner + ảnh nền.
 * 
 * Component này chỉ render: Search Card + Quick Stats + Quick Filter Pills
 * Được đặt ngay bên dưới navbar với padding-top: 286px (320 - 34)
 * để search card floating đè lên 34px mép dưới navbar.
 */
const NhaTroHeroHeader = ({ onQuickFilter }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const wrapperRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [locationSearchText, setLocationSearchText] = useState("");

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);

  // Đóng dropdowns khi click ngoài hoặc scroll
  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
        setShowCategoryDropdown(false);
        setShowSuggestions(false);
      }
    };
    const onScroll = () => {
      setShowLocationDropdown(false);
      setShowCategoryDropdown(false);
      setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  // Load tỉnh thành
  useEffect(() => {
    axios.get("http://localhost:5133/api/tindang/tinhthanh")
      .then(r => setProvinces(r.data || []))
      .catch(() => { });
  }, []);

  // Load quận huyện khi chọn tỉnh
  useEffect(() => {
    if (!selectedProvince?.maTinhThanh) return;
    axios.get(`http://localhost:5133/api/tindang/tinhthanh/${selectedProvince.maTinhThanh}/quanhuynh`)
      .then(r => setDistricts(r.data || []))
      .catch(() => { });
  }, [selectedProvince]);

  // Load danh mục nhà trọ
  useEffect(() => {
    axios.get("http://localhost:5133/api/category/get-categories-with-icon")
      .then(r => {
        const nhaTro = r.data.find(c => c.tenDanhMucCha?.toLowerCase().trim() === "nhà trọ");
        if (nhaTro?.danhMucCon) setSelectedSubCategories(nhaTro.danhMucCon);
      })
      .catch(() => { });
  }, []);

  // Gợi ý tìm kiếm
  useEffect(() => {
    if (!searchText.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    setLoadingSuggestions(true);
    const t = setTimeout(async () => {
      try {
        const r = await axios.get(
          `http://localhost:5133/api/tindang/suggestions?query=${encodeURIComponent(searchText)}&limit=8`
        );
        setSuggestions(r.data || []);
        setShowSuggestions(true);
      } catch { }
      finally { setLoadingSuggestions(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchText]);

  // Cập nhật hiển thị vị trí
  useEffect(() => {
    const parts = [];
    if (selectedDistrict) parts.push(selectedDistrict.tenQuanHuyen);
    if (selectedProvince) parts.push(selectedProvince.tenTinhThanh);
    setSelectedLocation(parts.join(", "));
  }, [selectedProvince, selectedDistrict]);

  const filteredProvinces = provinces.filter(p =>
    p.tenTinhThanh?.toLowerCase().includes(locationSearchText.toLowerCase())
  );
  const filteredDistricts = districts.filter(d =>
    d.tenQuanHuyen?.toLowerCase().includes(locationSearchText.toLowerCase())
  );

  const handleSearch = () => {
    if (!searchText.trim()) return;
    const p = new URLSearchParams();
    p.append('q', searchText);
    if (selectedProvince?.maTinhThanh) p.append('province', selectedProvince.maTinhThanh);
    if (selectedDistrict?.maQuanHuyen) p.append('district', selectedDistrict.maQuanHuyen);
    navigate(`/loc-tin-dang?${p.toString()}`);
    setShowSuggestions(false);
  };

  const isNhaTroPage = location.pathname === '/market/nha-tro';

  return (
    <div className={styles.heroWrapper} ref={wrapperRef}>

      {/* ── SEARCH CARD (floating, đè lên mép dưới navbar) ── */}
      <div className={styles.searchBar}>

        {/* Input + Suggestions */}
        <div className={styles.inputWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm bất động sản..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          {searchText && (
            <button className={styles.clearBtn} onClick={() => { setSearchText(""); setSuggestions([]); }}>
              <FaTimes />
            </button>
          )}
          {showSuggestions && (
            <div className={styles.suggestionsDropdown} ref={suggestionsRef}>
              {loadingSuggestions ? (
                <div className={styles.suggestionItem}>Đang tải...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((s, i) => (
                  <div key={i} className={styles.suggestionItem}
                    onClick={() => { navigate(`/chi-tiet-tin-dang-nha-tro/${s.maTinDang}`); setShowSuggestions(false); }}>
                    <FaSearch className={styles.searchIcon} style={{ fontSize: 14, flexShrink: 0 }} />
                    <div className={styles.suggestionText}>
                      <div className={styles.suggestionTitle}>{s.tieuDe}</div>
                      <div className={styles.suggestionCategory}>{s.danhMucCha}</div>
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

          {/* Location */}
          <div className={styles.filterBtn}>
            <button className={styles.locationBtn} onClick={() => setShowLocationDropdown(v => !v)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#FFC107" />
                <circle cx="12" cy="9" r="2.5" fill="#fff" />
              </svg>
              <span className={styles.locText}>{selectedLocation || "Chọn khu vực"}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showLocationDropdown && (
              <div className={styles.dropdownMenu}>
                <input type="text" placeholder="Tìm tỉnh thành..." value={locationSearchText}
                  onChange={e => setLocationSearchText(e.target.value)} className={styles.dropdownSearch} />
                <div className={styles.optionsContainer}>
                  {!selectedProvince ? (
                    filteredProvinces.map(p => (
                      <div key={p.maTinhThanh} className={styles.option}
                        onClick={() => { setSelectedProvince(p); setLocationSearchText(""); setShowLocationDropdown(false); }}>
                        {p.tenTinhThanh}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className={`${styles.option} ${styles.backOption}`}
                        onClick={() => { setSelectedProvince(null); setSelectedDistrict(null); setLocationSearchText(""); }}>
                        ← Quay lại
                      </div>
                      {filteredDistricts.map(d => (
                        <div key={d.maQuanHuyen} className={styles.option}
                          onClick={() => { setSelectedDistrict(d); setShowLocationDropdown(false); setLocationSearchText(""); }}>
                          {d.tenQuanHuyen}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div className={styles.filterBtn}>
            <div className={styles.filterDropdown} onClick={() => setShowCategoryDropdown(v => !v)}>
              <span className={styles.filterLabel}>Loại hình PT</span>
              <FaChevronDown className={styles.dropdownIcon} />
            </div>
            {showCategoryDropdown && (
              <div className={styles.dropdownMenu}>
                <div className={styles.optionsContainer}>
                  {selectedSubCategories.map(s => (
                    <div key={s.id} className={styles.option}
                      onClick={() => { setSearchText(s.tenDanhMucCon); setShowCategoryDropdown(false); }}>
                      {s.tenDanhMucCon}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search button */}
          <button className={styles.searchBtn} onClick={handleSearch}>
            <FaSearch /><span>Tìm nhà</span>
          </button>
        </div>
      </div>

      {/* ── QUICK STATS + PILLS (bên dưới search card) ── */}
      {isNhaTroPage && (
        <div className={styles.belowBanner}>
          <div className={styles.quickStats}>
            <span className={styles.statItem}><FaBuilding className={styles.statIcon} /> Hàng nghìn phòng sẵn sàng</span>
            <span className={styles.statDot}>•</span>
            <span className={styles.statItem}><FaMapMarkerAlt className={styles.statIcon} /> Toàn quốc</span>
            <span className={styles.statDot}>•</span>
            <span className={styles.statItem}><FaBolt className={styles.statIcon} /> Cập nhật liên tục</span>
          </div>
          <div className={styles.quickFilters}>
            {[
              { label: 'Giá dưới 3 triệu', icon: <FaTag />, filter: { priceMax: 3000000 } },
              { label: 'Gần trường', icon: <FaGraduationCap />, filter: { roomTypes: ['Phòng trọ'] } },
              { label: 'Có máy lạnh', icon: <FaSnowflake />, filter: { amenities: ['Máy lạnh'] } },
              { label: 'Mới đăng', icon: <FaClock />, filter: { sortBy: 'newest' } },
              { label: 'Nhà nguyên căn', icon: <FaHome />, filter: { roomTypes: ['Nhà nguyên căn'] } },
              { label: 'Chung cư mini', icon: <MdApartment />, filter: { roomTypes: ['Chung cư mini'] } },
              { label: 'Có WiFi', icon: <FaWifi />, filter: { amenities: ['WiFi'] } },
            ].map(({ label, icon, filter }) => (
              <button key={label} className={styles.quickPill}
                onClick={() => {
                  onQuickFilter?.(filter);
                  document.getElementById('nha-tro-filters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                <span className={styles.pillIcon}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default NhaTroHeroHeader;
