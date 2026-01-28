import React, { useEffect, useState, useContext, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CategoryContext } from "../../context/CategoryContext"; 
import { SearchContext } from "../../context/SearchContext";
import styles from "./NavCategories.module.css";

import { FaChevronDown, FaClipboardList, FaGem, FaHandshake } from "react-icons/fa";

// --- COMPONENT PORTAL ---
const DropdownPortal = ({ children, coords, onClose }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    function handleScroll() { onClose(); }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        zIndex: 999999,
        // minWidth để đảm bảo menu không bị co quá nhỏ
        minWidth: "200px", 
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const NavCategories = ({ isScrolled }) => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  
  // --- STATE CHO MENU DANH MỤC (MỚI) ---
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [categoryCoords, setCategoryCoords] = useState({ top: 0, left: 0 });
  const categoryRef = useRef(null);

  // --- STATE CHO MENU NGƯỜI BÁN ---
  const [showSellerMenu, setShowSellerMenu] = useState(false);
  const [sellerCoords, setSellerCoords] = useState({ top: 0, left: 0 });
  const sellerRef = useRef(null);
  
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const { setSearchTerm } = useContext(SearchContext);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5133/api/category/get-categories-with-icon"
        );
        setCategories(res.data);
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubCategory("");
    setSearchTerm("");
    navigate("/loc-tin-dang");
    setShowCategoryMenu(false); // Đóng menu sau khi chọn
  };

  const handleSubCategoryClick = (e, parentCategory, subCategory) => {
    e.stopPropagation();
    setSelectedCategory(parentCategory);
    setSelectedSubCategory(subCategory);
    setSearchTerm("");
    navigate("/loc-tin-dang");
    setShowCategoryMenu(false); // Đóng menu sau khi chọn
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSearchTerm("");
    navigate("/market");
  };

  // --- HANDLER TOGGLE DANH MỤC ---
  const handleToggleCategoryMenu = () => {
    if (showCategoryMenu) {
      setShowCategoryMenu(false);
      return;
    }
    if (categoryRef.current) {
      const rect = categoryRef.current.getBoundingClientRect();
      setCategoryCoords({
        top: rect.bottom + 10,
        left: rect.left 
      });
      setShowCategoryMenu(true);
      setShowSellerMenu(false); // Đóng menu kia nếu đang mở
    }
  };

  // --- HANDLER TOGGLE NGƯỜI BÁN ---
  const handleToggleSellerMenu = () => {
    if (showSellerMenu) {
      setShowSellerMenu(false);
      return;
    }
    if (sellerRef.current) {
      const rect = sellerRef.current.getBoundingClientRect();
      setSellerCoords({
        top: rect.bottom + 10,
        left: rect.left 
      });
      setShowSellerMenu(true);
      setShowCategoryMenu(false); // Đóng menu kia nếu đang mở
    }
  };

  return (
    <div className={styles.navLeft}>
      <a href="/" className={styles.logoLink} onClick={handleLogoClick} aria-label="Unimarket home">
        <img src="/logoWeb (1).png" alt="Unimarket" className={styles.logoImg} />
      </a>

      <nav className={styles.mainMenu}>
        
        {/* --- MENU 1: DANH MỤC (CLICK + PORTAL) --- */}
        <div 
            className={styles.dropdown} 
            ref={categoryRef}
            onClick={handleToggleCategoryMenu}
        >
          <span className={`${styles.dropdownTitle} ${isScrolled ? styles.scrolledText : ""}`}>
            Danh mục <FaChevronDown size={12} style={{ marginLeft: 5 }} />
          </span>
        </div>

        {/* Portal Danh Mục */}
        {showCategoryMenu && (
            <DropdownPortal 
                coords={categoryCoords} 
                onClose={() => setShowCategoryMenu(false)}
            >
                <div className={styles.dropdownContent}>
                    {categories.map((parent) => (
                    <div 
                        key={parent.id} 
                        className={styles.parentCategory} 
                        onClick={() => handleCategoryClick(parent.tenDanhMucCha)}
                    >
                        {parent.icon && <img src={parent.icon} alt="icon" className={styles.categoryIcon} />}
                        <span>{parent.tenDanhMucCha}</span>

                        {parent.danhMucCon && parent.danhMucCon.length > 0 && (
                            <div className={styles.subMenu}>
                                {parent.danhMucCon.map((sub) => (
                                    <div 
                                        key={sub.id} 
                                        className={styles.subLink}
                                        onClick={(e) => handleSubCategoryClick(e, parent.tenDanhMucCha, sub.tenDanhMucCon)}
                                    >
                                        {sub.tenDanhMucCon}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    ))}
                </div>
            </DropdownPortal>
        )}

        {/* --- MENU 2: DÀNH CHO NGƯỜI BÁN --- */}
        {!isScrolled && (
          <>
            <div 
              className={styles.sellerDropdown} 
              ref={sellerRef}
              onClick={handleToggleSellerMenu}
            >
              <span className={`${styles.sellerTitle} ${isScrolled ? styles.scrolledText : ""}`}>
                Dành cho người bán <FaChevronDown size={12} style={{ marginLeft: 5 }} />
              </span>
            </div>

            {/* Portal Người Bán */}
            {showSellerMenu && (
              <DropdownPortal 
                coords={sellerCoords} 
                onClose={() => setShowSellerMenu(false)}
              >
                <div className={styles.sellerContent}>
                  <div className={styles.sellerItem} onClick={() => { navigate("/quan-ly-tin"); setShowSellerMenu(false); }}>
                    <FaClipboardList className={styles.itemIcon} /> 
                    <span>Quản lý tin</span>
                  </div>
                  
                  <div className={styles.sellerItem} onClick={() => { navigate("/goi-pro"); setShowSellerMenu(false); }}>
                    <FaGem className={styles.itemIcon} color="#FFD700" /> 
                    <span>Gói Pro</span>
                  </div>
                  
                  <div className={styles.sellerItem} onClick={() => { navigate("/doi-tac"); setShowSellerMenu(false); }}>
                    <FaHandshake className={styles.itemIcon} color="#FF5722" /> 
                    <span>Dành cho Đối tác</span>
                  </div>
                </div>
              </DropdownPortal>
            )}
          </>
        )}

      </nav>
    </div>
  );
};

export default NavCategories;