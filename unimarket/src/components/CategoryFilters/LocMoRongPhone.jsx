import React, { useState, useEffect, useRef } from 'react';
import styles from './LocMoRongPhone.module.css';
import { FaFilter, FaTimes, FaChevronDown, FaMapMarkerAlt } from 'react-icons/fa';
import { PHONE_DATA, PHONE_STORAGES, PHONE_COLORS, PHONE_WARRANTIES } from '../../constants/PhoneData';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css'; 

const LocMoRongPhone = ({ onExit, onFilterChange, activeFilters }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [miniSearchKeyword, setMiniSearchKeyword] = useState(""); 
  
  const [tempFilters, setTempFilters] = useState(activeFilters);
  const [priceMin, setPriceMin] = useState(activeFilters.minPrice || "");
  const [priceMax, setPriceMax] = useState(activeFilters.maxPrice || "");

  const dropdownRef = useRef(null);
  const brands = Object.keys(PHONE_DATA);

  // Sync props to state
  useEffect(() => {
      setTempFilters(activeFilters);
      setPriceMin(activeFilters.minPrice !== undefined && activeFilters.minPrice !== null ? activeFilters.minPrice : "");
      setPriceMax(activeFilters.maxPrice !== undefined && activeFilters.maxPrice !== null ? activeFilters.maxPrice : "");
  }, [activeFilters]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
        setTempFilters(activeFilters);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeFilters]);

  const toggleDropdown = (name) => {
    if (openDropdown !== name) {
        setMiniSearchKeyword("");
        setTempFilters(activeFilters);
    }
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleTempSelect = (key, value) => {
    setTempFilters(prev => ({
        ...prev,
        [key]: prev[key] === value ? null : value
    }));
  };

  const handleApplyFilter = (key) => {
      onFilterChange(key, tempFilters[key]);
      setOpenDropdown(null);
  };

  const handleClearFilter = (key) => {
      const newTemp = { ...tempFilters, [key]: null };
      setTempFilters(newTemp);
      onFilterChange(key, null);
  };

  const handleSliderChange = (value) => {
      setPriceMin(value[0]);
      setPriceMax(value[1]);
  };

  const handleApplyPrice = () => {
      const min = priceMin !== "" ? Number(priceMin) : null;
      const max = priceMax !== "" ? Number(priceMax) : null;
      
      onFilterChange('minPrice', min);
      setTimeout(() => {
          onFilterChange('maxPrice', max);
      }, 0);
      
      setOpenDropdown(null);
  };

  const handleResetPrice = () => {
      setPriceMin("");
      setPriceMax("");
      onFilterChange('minPrice', null);
      setTimeout(() => {
          onFilterChange('maxPrice', null);
      }, 0);
  };

  // --- RENDERERS ---
  const renderPriceDropdown = () => {
    const sliderMin = priceMin !== "" ? Number(priceMin) : 0;
    const sliderMax = priceMax !== "" ? Number(priceMax) : 50000000;

    return (
        <div className={styles.dropdownContent}>
            <div className={styles.priceRangeContainer}>
                <p className={styles.dropdownTitle}>Chọn khoảng giá</p>
                <div style={{ padding: '0 10px', marginBottom: '25px' }}>
                    <Slider 
                        range min={0} max={50000000} step={500000}
                        value={[sliderMin, sliderMax]} 
                        onChange={handleSliderChange}
                        trackStyle={[{ backgroundColor: '#ffba00' }]}
                        handleStyle={[{ borderColor: '#ffba00', backgroundColor: '#fff', opacity: 1 }, { borderColor: '#ffba00', backgroundColor: '#fff', opacity: 1 }]}
                        railStyle={{ backgroundColor: '#eee' }}
                    />
                </div>
                <div className={styles.priceLabelRow}><span>0</span><span>50 triệu+</span></div>
                <div className={styles.priceInputs}>
                    <input type="number" placeholder="Thấp nhất" className={styles.priceInput} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                    <span>-</span>
                    <input type="number" placeholder="Cao nhất" className={styles.priceInput} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                </div>
                <div className={styles.quickPriceTags}>
                    <button className={styles.quickTag} onClick={() => { setPriceMin(0); setPriceMax(2000000); }}>&lt; 2 triệu</button>
                    <button className={styles.quickTag} onClick={() => { setPriceMin(2000000); setPriceMax(5000000); }}>2 - 5 triệu</button>
                    <button className={styles.quickTag} onClick={() => { setPriceMin(5000000); setPriceMax(10000000); }}>5 - 10 triệu</button>
                    <button className={styles.quickTag} onClick={() => { setPriceMin(10000000); setPriceMax(null); }}>&gt; 10 triệu</button>
                </div>
                <div className={styles.dropdownFooter}>
                    <button className={styles.btnReset} onClick={handleResetPrice}>Xóa lọc</button>
                    <button className={styles.btnApply} onClick={handleApplyPrice}>Áp dụng</button>
                </div>
            </div>
        </div>
    );
  };

  const renderListDropdown = (title, data, filterKey) => {
    const filteredData = data.filter(item => item.toLowerCase().includes(miniSearchKeyword.toLowerCase()));
    return (
        <div className={styles.dropdownContent}>
            <div className={styles.listContainer}>
                {data.length > 5 && (
                    <div className={styles.searchWrapper}>
                        <input type="text" placeholder={`Tìm ${title.toLowerCase()}...`} className={styles.miniSearch} value={miniSearchKeyword} onChange={(e) => setMiniSearchKeyword(e.target.value)} autoFocus />
                    </div>
                )}
                <div className={styles.listScroll}>
                    {filteredData.length > 0 ? filteredData.map(item => {
                        const isSelected = tempFilters[filterKey] === item;
                        return (
                            <div key={item} className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ''}`} 
                                 onClick={() => handleTempSelect(filterKey, item)}>
                                <div className={styles.checkboxRow}>
                                    <div className={`${styles.radioCircle} ${isSelected ? styles.radioChecked : ''}`}></div>
                                    <span>{item}</span>
                                </div>
                            </div>
                        )
                    }) : <div className={styles.emptyText}>Không tìm thấy kết quả</div>}
                </div>
                <div className={styles.dropdownFooter}>
                    <button className={styles.btnReset} onClick={() => handleClearFilter(filterKey)}>Xóa lọc</button>
                    <button className={styles.btnApply} onClick={() => handleApplyFilter(filterKey)}>Áp dụng</button>
                </div>
            </div>
        </div>
    );
  };

  const renderBrandDropdown = () => {
      const filteredBrands = brands.filter(b => b.toLowerCase().includes(miniSearchKeyword.toLowerCase()));
      return (
        <div className={styles.dropdownContent}>
            <div className={styles.listContainer}>
                <div className={styles.searchWrapper}>
                    <input type="text" placeholder="Nhập tìm hãng" className={styles.miniSearch} value={miniSearchKeyword} onChange={(e) => setMiniSearchKeyword(e.target.value)} autoFocus />
                </div>
                <div className={styles.listScroll}>
                    {filteredBrands.map(brandName => {
                        // Key 'hang' đồng nhất
                        const isSelected = tempFilters.hang === brandName;
                        return (
                            <div key={brandName} className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ''}`} 
                                onClick={() => handleTempSelect('hang', brandName)}> 
                                <div className={styles.brandImgContainer} style={{width: '30px', height: '30px'}}>
                                     <img src={PHONE_DATA[brandName].logo} alt={brandName} className={styles.brandImg} onError={(e) => e.target.style.display = 'none'} />
                                </div>
                                <span>{brandName}</span>
                                {isSelected && <div style={{marginLeft:'auto', color:'#ffba00'}}>✔</div>}
                            </div>
                        )
                    })}
                </div>
                 <div className={styles.dropdownFooter}>
                    <button className={styles.btnReset} onClick={() => handleClearFilter('hang')}>Xóa lọc</button>
                    <button className={styles.btnApply} onClick={() => handleApplyFilter('hang')}>Áp dụng</button>
                </div>
            </div>
        </div>
      );
  };

  const hasPriceFilter = (activeFilters.minPrice !== undefined && activeFilters.minPrice !== null) || (activeFilters.maxPrice !== undefined && activeFilters.maxPrice !== null);

  return (
    <div className={styles.container}>
      <div className={styles.filterBar} ref={dropdownRef}>
        <button className={styles.filterIconBtn}><FaFilter /> Lọc</button>
        <button className={styles.activeTag} onClick={(e) => { e.stopPropagation(); onExit(); }}>
            Điện thoại <div className={styles.closeCircle}><FaTimes size={10}/></div>
        </button>

        {/* CÁC NÚT LỌC */}
        <div className={styles.filterGroup}>
            <button className={`${styles.pillBtn} ${openDropdown === 'PRICE' || hasPriceFilter ? styles.pillActive : ''}`} onClick={() => toggleDropdown('PRICE')}>
                Giá <FaChevronDown size={10}/>
            </button>
            {openDropdown === 'PRICE' && renderPriceDropdown()}
        </div>

        <div className={styles.filterGroup}>
            <button className={`${styles.pillBtn} ${openDropdown === 'BRAND' || activeFilters.hang ? styles.pillActive : ''}`} onClick={() => toggleDropdown('BRAND')}>
                {activeFilters.hang ? activeFilters.hang : 'Hãng'} <FaChevronDown size={10}/>
            </button>
            {openDropdown === 'BRAND' && renderBrandDropdown()}
        </div>

        <div className={styles.filterGroup}>
            <button className={`${styles.pillBtn} ${openDropdown === 'STORAGE' || activeFilters.dungLuong ? styles.pillActive : ''}`} onClick={() => toggleDropdown('STORAGE')}>
               {activeFilters.dungLuong ? activeFilters.dungLuong : 'Dung lượng'} <FaChevronDown size={10}/>
            </button>
            {openDropdown === 'STORAGE' && renderListDropdown("Dung lượng", PHONE_STORAGES, 'dungLuong')}
        </div>

        <div className={styles.filterGroup}>
            <button className={`${styles.pillBtn} ${openDropdown === 'COLOR' || activeFilters.mauSac ? styles.pillActive : ''}`} onClick={() => toggleDropdown('COLOR')}>
               {activeFilters.mauSac ? activeFilters.mauSac : 'Màu sắc'} <FaChevronDown size={10}/>
            </button>
            {openDropdown === 'COLOR' && renderListDropdown("Màu sắc", PHONE_COLORS, 'mauSac')}
        </div>

        <div className={styles.filterGroup}>
            <button className={`${styles.pillBtn} ${openDropdown === 'CONDITION' || activeFilters.tinhTrang ? styles.pillActive : ''}`} onClick={() => toggleDropdown('CONDITION')}>
               {activeFilters.tinhTrang ? activeFilters.tinhTrang : 'Tình trạng'} <FaChevronDown size={10}/>
            </button>
            {openDropdown === 'CONDITION' && renderListDropdown("Tình trạng", PHONE_WARRANTIES, 'tinhTrang')}
        </div>
      </div>

      <div className={styles.locationRow}>
          <span className={styles.labelLocation}>Khu vực:</span>
          {["Tp Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương"].map(loc => (
              <button key={loc} className={styles.locationPill}>{loc}</button>
          ))}
          <button className={styles.locationPill}><FaMapMarkerAlt /> Gần tôi</button>
      </div>

      <div className={styles.brandRow}>
          {brands.map((brandName) => {
              const brandInfo = PHONE_DATA[brandName];
              
              // 1. Kiểm tra chính xác key 'hang'
              const isActive = activeFilters.hang === brandName; 
              
              return (
                  <div key={brandName} className={`${styles.brandItem} ${isActive ? styles.brandActive : ''}`}
                    // 🔥 FIX LỖI Ở ĐÂY: Đổi 'Hang' thành 'hang' (chữ thường)
                    onClick={() => onFilterChange('hang', isActive ? null : brandName)}
                    title={brandName}>
                      <div className={styles.brandImgContainer}>
                        <img src={brandInfo.logo} alt={brandName} className={styles.brandImg} onError={(e) => e.target.style.display = 'none'} />
                      </div>
                      <span className={styles.brandName}>{brandName}</span>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

export default LocMoRongPhone;