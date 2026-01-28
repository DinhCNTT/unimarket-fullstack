import React, { useState, useEffect, useRef, useContext } from "react"; // [NEW] Thêm useContext
import "./SearchBar.css";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaClock,
  FaTimes,
  FaChevronDown,
  FaArrowLeft,
  FaCheck
} from "react-icons/fa";
import axios from "axios";
import { useProductSearch } from "../hooks/useProductSearch";
import { useLocation } from "react-router-dom"; // [NEW] Import useLocation để biết đang ở trang nào
import { CategoryContext } from "../context/CategoryContext"; // [NEW] Import Context danh mục


const SearchBar = () => {
  // [NEW] ==========================================
  // 0. LOGIC CONTEXT & LOCATION (MỚI THÊM)
  // ==========================================
  const location = useLocation();
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);


  // ==========================================
  // 1. LOGIC TÌM KIẾM (TỪ CUSTOM HOOK)
  // ==========================================
  const {
    inputValue, setInputValue,
    suggestions, searchHistory,
    showSuggestions, setShowSuggestions,
    loadingSuggestions, loadingHistory,
    user,
    handleSearch, // Hàm gốc từ hook
    deleteSearchHistoryItem,
    highlightText,
    formatDate,
    selectedLocation,
    setSelectedLocation
  } = useProductSearch();


  // ==========================================
  // [QUAN TRỌNG] HÀM WRAPPER ĐỂ XỬ LÝ CONTEXT TRƯỚC KHI SEARCH
  // ==========================================
  const onTriggerSearch = (keyword) => {
    // Logic: Nếu đang đứng ở trang Đồ điện tử -> Set luôn Category là "Đồ điện tử"
    if (location.pathname.includes("/market/do-dien-tu")) {
        // Lưu ý: Chuỗi "Đồ điện tử" phải khớp chính xác với tên trong Database của bạn
        setSelectedCategory("Đồ điện tử");
        setSelectedSubCategory(""); // Reset sub-category để tránh lỗi
    }
   
    // Sau khi set context xong thì mới gọi hàm search gốc để chuyển trang
    handleSearch(keyword);
  };


  // ==========================================
  // 2. LOGIC ĐỊA ĐIỂM (UI RIÊNG CỦA COMPONENT NÀY)
  // ==========================================
  const suggestionsRef = useRef(null);
  const locationWrapperRef = useRef(null);


  // Modal States
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStep, setLocationStep] = useState("MAIN");
 
  // Data lists
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
 
  // Temporary selection
  const [tempProvince, setTempProvince] = useState(null);
  const [tempDistrict, setTempDistrict] = useState(null);
 
  // Search filter inside location lists
  const [locationSearchKeyword, setLocationSearchKeyword] = useState("");
 
  // Biến chờ sync quận huyện
  const [pendingDistrictName, setPendingDistrictName] = useState(null);


  // --- Click Outside Handler ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target)) {
        setShowLocationModal(false);
        if (!showLocationModal) {
             setLocationStep("MAIN");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLocationModal, setShowSuggestions]);


  // --- API: Load Provinces ---
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/tindang/tinhthanh");
        if (response.data) setProvinces(response.data);
      } catch (error) {
        console.error("Lỗi lấy danh sách tỉnh thành:", error);
      }
    };
    fetchProvinces();
  }, []);


  // --- API: Load Districts ---
  useEffect(() => {
    const fetchDistricts = async (maTinhThanh) => {
      try {
        const response = await axios.get(`http://localhost:5133/api/tindang/tinhthanh/${maTinhThanh}/quanhuynh`);
        if (response.data) setDistricts(response.data);
      } catch (error) {
        setDistricts([]);
      }
    };


    if (tempProvince?.maTinhThanh) {
      fetchDistricts(tempProvince.maTinhThanh);
    } else {
      setDistricts([]);
      if (!tempProvince) setTempDistrict(null);
    }
  }, [tempProvince]);


  // --- Logic Location Sync ---
  useEffect(() => {
    if (showLocationModal && provinces.length > 0) {
        if (!selectedLocation || selectedLocation === "Toàn quốc") {
            setTempProvince(null);
            setTempDistrict(null);
            return;
        }
        const parts = selectedLocation.split(', ').map(str => str.trim());
        let pName = "";
        let dName = "";


        if (parts.length === 2) {
            dName = parts[0];
            pName = parts[1];
        } else {
            pName = parts[0];
        }


        const foundProv = provinces.find(p => p.tenTinhThanh === pName);
        if (foundProv) {
            setTempProvince(foundProv);
            if (dName) {
                setPendingDistrictName(dName);
            } else {
                setTempDistrict({ maQuanHuyen: 'all', tenQuanHuyen: 'Tất cả' });
            }
        }
    }
  }, [showLocationModal, provinces, selectedLocation]);


  useEffect(() => {
    if (pendingDistrictName && districts.length > 0) {
        const foundDist = districts.find(d => d.tenQuanHuyen === pendingDistrictName);
        if (foundDist) {
            setTempDistrict(foundDist);
        } else if (pendingDistrictName === "Tất cả") {
             setTempDistrict({ maQuanHuyen: 'all', tenQuanHuyen: 'Tất cả' });
        }
        setPendingDistrictName(null);
    }
  }, [districts, pendingDistrictName]);




  // --- Handlers: Location Logic ---
  const toggleLocationModal = () => {
    if (!showLocationModal) {
        setLocationStep("MAIN");
    }
    setShowLocationModal(!showLocationModal);
    setShowSuggestions(false);
  };


  const handleApplyLocation = () => {
    let finalLocationString = "";
    if (!tempProvince) {
        finalLocationString = "Toàn quốc";
    } else {
        if (tempDistrict && tempDistrict.maQuanHuyen !== "all") {
            finalLocationString = `${tempDistrict.tenQuanHuyen}, ${tempProvince.tenTinhThanh}`;
        } else {
            finalLocationString = tempProvince.tenTinhThanh;
        }
    }
    setSelectedLocation(finalLocationString);
    setShowLocationModal(false);
  };


  const handleSelectProvince = (prov) => {
    setTempProvince(prov);
    setTempDistrict(null);
    setDistricts([]);
    setLocationSearchKeyword("");
    setLocationStep("MAIN");
  };


  const handleSelectDistrict = (dist) => {
    setTempDistrict(dist);
    setLocationSearchKeyword("");
    setLocationStep("MAIN");
  };


  const getFilteredProvinces = () => {
    if (!locationSearchKeyword) return provinces;
    return provinces.filter(p => p.tenTinhThanh?.toLowerCase().includes(locationSearchKeyword.toLowerCase()));
  };


  const getFilteredDistricts = () => {
    let list = districts;
    if (locationSearchKeyword) {
      list = districts.filter(d => d.tenQuanHuyen?.toLowerCase().includes(locationSearchKeyword.toLowerCase()));
    }
    return list;
  };


  // ==========================================
  // 3. RENDER SUB-COMPONENTS
  // ==========================================
  const renderLocationMain = () => (
    <div className="LocModalMain">
        <div className="LocModalHeader">Khu vực</div>
        <div className="LocModalInputGroup">
            <label>Chọn tỉnh thành <span className="LocRequired">*</span></label>
            <div className="LocModalSelectBox" onClick={() => {
                setLocationSearchKeyword("");
                setLocationStep("PROVINCE");
            }}>
                <span>{tempProvince ? tempProvince.tenTinhThanh : "Toàn quốc"}</span>
                <FaChevronDown />
            </div>
        </div>
        <div className="LocModalInputGroup">
            <label>Chọn quận huyện <span className="LocRequired">*</span></label>
            <div
                className={`LocModalSelectBox ${!tempProvince ? "LocDisabled" : ""}`}
                onClick={() => {
                    if (tempProvince) {
                        setLocationSearchKeyword("");
                        setLocationStep("DISTRICT");
                    }
                }}
            >
                <span>{tempDistrict ? (tempDistrict.maQuanHuyen === 'all' ? "Tất cả" : tempDistrict.tenQuanHuyen) : "Tất cả"}</span>
                <FaChevronDown />
            </div>
        </div>
        <button className="LocModalApplyBtn" onClick={handleApplyLocation}>
            Áp dụng
        </button>
    </div>
  );


  const renderLocationList = (type) => {
    const isProvince = type === 'PROVINCE';
    const title = isProvince ? "Tỉnh thành" : "Quận huyện";
    const items = isProvince ? getFilteredProvinces() : getFilteredDistricts();
   
    return (
        <div className="LocModalListContainer">
            <div className="LocModalListHeader">
                <button className="LocBackBtn" onClick={() => setLocationStep("MAIN")}>
                    <FaArrowLeft />
                </button>
                <span className="LocListTitle">{title}</span>
            </div>
            <div className="LocSearchInputWrapper">
                <FaSearch className="LocSearchIcon"/>
                <input
                    type="text"
                    placeholder={`Tìm ${title.toLowerCase()}`}
                    value={locationSearchKeyword}
                    onChange={(e) => setLocationSearchKeyword(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="LocListScroll">
                <div
                    className="LocListItem"
                    onClick={() => isProvince ? handleSelectProvince(null) : handleSelectDistrict({ maQuanHuyen: 'all', tenQuanHuyen: 'Tất cả' })}
                >
                    <span>{isProvince ? "Toàn quốc" : "Tất cả"}</span>
                    {((isProvince && !tempProvince) || (!isProvince && (!tempDistrict || tempDistrict.maQuanHuyen === 'all'))) && <FaCheck className="LocCheckIcon" />}
                </div>
                {items && items.length > 0 ? items.map((item) => {
                    const isSelected = isProvince
                        ? tempProvince?.maTinhThanh === item.maTinhThanh
                        : tempDistrict?.maQuanHuyen === item.maQuanHuyen;
                   
                    return (
                        <div
                            key={isProvince ? item.maTinhThanh : item.maQuanHuyen}
                            className="LocListItem"
                            onClick={() => isProvince ? handleSelectProvince(item) : handleSelectDistrict(item)}
                        >
                            <span>{isProvince ? item.tenTinhThanh : item.tenQuanHuyen}</span>
                            <div className={`LocRadioCircle ${isSelected ? "LocSelected" : ""}`}>
                                {isSelected && <FaCheck />}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="LocEmptyResult">Không tìm thấy kết quả</div>
                )}
            </div>
        </div>
    );
  };


  // ==========================================
  // 4. MAIN RENDER
  // ==========================================
  return (
    <div className="SearchBarContainer">
      {/* LOCATION PICKER */}
      <div className="SearchBarLocationWrapper" ref={locationWrapperRef}>
        <div className="SearchBarLocationBtn" onClick={toggleLocationModal}>
          <FaMapMarkerAlt className="SearchBarLocationIcon" />
          <span className="SearchBarLocationText">
             {selectedLocation && selectedLocation !== "Toàn quốc" ? selectedLocation : "Toàn quốc"}
          </span>
          <FaChevronDown className="SearchBarChevron" size={10} />
        </div>
        {showLocationModal && (
            <div className="LocationModalDropdown">
                {locationStep === "MAIN" && renderLocationMain()}
                {locationStep === "PROVINCE" && renderLocationList("PROVINCE")}
                {locationStep === "DISTRICT" && renderLocationList("DISTRICT")}
            </div>
        )}
      </div>


      <div className="SearchBarDivider"></div>


      {/* SEARCH INPUT */}
      <div className="SearchBarInputContainer">
        <input
          type="text"
          placeholder="Tìm sản phẩm trên Unimarket..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            // [NEW] SỬ DỤNG HÀM WRAPPER
            if (e.key === "Enter") onTriggerSearch();
            else if (e.key === "Escape") setShowSuggestions(false);
          }}
          onFocus={() => {
            if (inputValue.trim() || (user && searchHistory.length > 0)) {
                setShowSuggestions(true);
            }
          }}
        />
       
        {/* SUGGESTIONS DROPDOWN */}
        {showSuggestions && (
          <div className="SearchBarSuggestionsDropdown" ref={suggestionsRef}>
            {!inputValue.trim() && user && searchHistory.length > 0 && (
              <>
                <div className="SearchBarSuggestionsHeader">
                  <span className="SearchBarSuggestionsTitle">Lịch sử tìm kiếm</span>
                </div>
                {searchHistory.map((item) => (
                  <div key={item.id} className="SearchBarSuggestionItem SearchBarHistoryItem" onClick={() => {
                      setInputValue(item.keyword);
                      onTriggerSearch(item.keyword); // [NEW] SỬ DỤNG HÀM WRAPPER
                  }}>
                    <FaClock className="SearchBarSuggestionIcon SearchBarHistoryIcon" />
                    <div className="SearchBarSuggestionContent">
                      <div className="SearchBarSuggestionTitle">{item.keyword}</div>
                      <div className="SearchBarSuggestionCategory">{formatDate(item.createdAt)}</div>
                    </div>
                    <button className="SearchBarHistoryDelete" onClick={(e) => deleteSearchHistoryItem(item.id, e)}>
                        <FaTimes />
                    </button>
                  </div>
                ))}
              </>
            )}
           
            {inputValue.trim() && (
              <>
                <div className="SearchBarSuggestionsHeader">
                  <span className="SearchBarSuggestionsTitle">Tìm kiếm "{inputValue}"</span>
                </div>
                {loadingSuggestions ? (
                  <div className="SearchBarSuggestionLoading">Đang tìm kiếm...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((s, idx) => (
                    <div key={`${s.maTinDang}-${idx}`} className="SearchBarSuggestionItem" onClick={() => {
                        setInputValue(s.tieuDe);
                        onTriggerSearch(s.tieuDe); // [NEW] SỬ DỤNG HÀM WRAPPER
                    }}>
                      <FaSearch className="SearchBarSuggestionIcon" />
                      <div className="SearchBarSuggestionContent">
                        <div className="SearchBarSuggestionTitle">{highlightText(s.tieuDe, inputValue)}</div>
                        <div className="SearchBarSuggestionCategory">trong {s.danhMucCha}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="SearchBarSuggestionEmpty">Không tìm thấy gợi ý nào</div>
                )}
              </>
            )}
           
            {!inputValue.trim() && user && searchHistory.length === 0 && !loadingHistory && (
                  <div className="SearchBarSuggestionEmpty">Chưa có lịch sử tìm kiếm</div>
            )}
            {!inputValue.trim() && !user && (
                  <div className="SearchBarSuggestionEmpty">Đăng nhập để xem lịch sử</div>
            )}
          </div>
        )}
      </div>


      <button className="SearchBarBtn" onClick={() => onTriggerSearch()}> {/* [NEW] SỬ DỤNG HÀM WRAPPER */}
        <FaSearch />
      </button>
    </div>
  );
};


export default SearchBar;

