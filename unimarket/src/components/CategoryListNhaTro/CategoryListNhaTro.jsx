// src/components/CategoryListNhaTro/CategoryListNhaTro.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { CategoryContext } from "../../context/CategoryContext";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./CategoryListNhaTro.module.css";

// --- MAPPING ẢNH CHO DANH MỤC BẤT ĐỘNG SẢN ---
const CATEGORY_IMAGES_MAP = {
  "mua bán nhà đất": "/images/MuaBan.png",
  "cho thuê nhà đất": "/images/ChoThue.png",
  "căn hộ chung cư": "/images/MuaBan.png",
  "văn phòng, mặt bằng kinh doanh": "/images/ChoThue.png",
  "phòng trọ": "/images/ChoThue.png",
};

// --- MAPPING ICON CHO TỪNG DANH MỤC CON ---
const CATEGORY_ICONS_MAP = {
  "phòng trọ": "/images/PhongTro.png",
  "chung cư mini": "/images/ChungCuMini.png",
  "nhà nguyên căn": "/images/NhaNguyenCan.png",
  "ký túc xá": "/images/KyTucXa.png",
  "sleepbox": "/images/SleepBox.png",
};

const DEFAULT_IMAGE = "/images/MuaBan.png";
const DEFAULT_ICON = "https://cdn-icons-png.flaticon.com/512/3050/3050159.png";

const CategoryListNhaTro = () => {
  const [subCategories, setSubCategories] = useState([]);
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const navigate = useNavigate();
  const listRef = useRef(null);

  useEffect(() => {
    const fetchBatDongSanCategories = async () => {
      try {
        // Gọi API lấy danh mục kèm icon (đã có cấu trúc cha-con)
        const response = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        const allCategories = response.data;

        // 1. Tìm danh mục cha là "Nhà trọ"
        const batDongSanParent = allCategories.find(
          (cat) => cat.tenDanhMucCha && 
          cat.tenDanhMucCha.toLowerCase().trim() === "nhà trọ"
        );

        if (batDongSanParent && batDongSanParent.danhMucCon) {
          // 2. Map dữ liệu để thêm ảnh từ bảng Mapping phía trên
          const formattedSubCats = batDongSanParent.danhMucCon.map((sub) => {
            const keyName = sub.tenDanhMucCon.toLowerCase().trim();
            const matchedKey = Object.keys(CATEGORY_IMAGES_MAP).find(
              k => keyName.includes(k) || k.includes(keyName)
            );

            // Tìm icon riêng cho mỗi subcategory
            const iconKey = Object.keys(CATEGORY_ICONS_MAP).find(
              k => keyName.includes(k) || k.includes(keyName)
            );

            return {
              ...sub,
              image: matchedKey ? CATEGORY_IMAGES_MAP[matchedKey] : DEFAULT_IMAGE,
              icon: iconKey ? CATEGORY_ICONS_MAP[iconKey] : DEFAULT_ICON
            };
          });

          setSubCategories(formattedSubCats);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục bất động sản:", error);
      }
    };

    fetchBatDongSanCategories();
  }, []);

  const handleSubCategoryClick = (subName) => {
    setSelectedCategory("Nhà trọ");
    setSelectedSubCategory(subName);
    navigate("/loc-tin-dang");
  };

  const handleViewAll = () => {
    setSelectedCategory("Nhà trọ");
    setSelectedSubCategory("");
    navigate("/loc-tin-dang");
  };

  // Xử lý scroll
  const scroll = (direction) => {
    if (listRef.current) {
      const { current } = listRef;
      const scrollAmount = 300;
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  if (subCategories.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>KHÁM PHÁ NHÀ TRỌ</h2>
      </div>

      <div className={styles.carouselWrapper}>
        <div className={styles.list} ref={listRef}>
          {subCategories.map((sub, index) => (
            <div
              key={index}
              className={styles.item}
              onClick={() => handleSubCategoryClick(sub.tenDanhMucCon)}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={sub.icon || sub.image}
                  alt={sub.tenDanhMucCon}
                  className={styles.image}
                  onError={(e) => e.target.src = DEFAULT_ICON}
                />
              </div>
              <p className={styles.name}>{sub.tenDanhMucCon}</p>
            </div>
          ))}

          {/* Nút "Tất cả" ở cuối danh sách */}
          <div className={styles.item} onClick={handleViewAll}>
            <div className={styles.imageWrapper}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/7282/7282516.png"
                alt="Tất cả"
                className={styles.image}
              />
            </div>
            <p className={styles.name}>Tất cả</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryListNhaTro;
