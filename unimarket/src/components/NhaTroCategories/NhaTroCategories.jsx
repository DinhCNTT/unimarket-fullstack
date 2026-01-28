// src/components/NhaTroCategories/NhaTroCategories.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { CategoryContext } from "../../context/CategoryContext";
import { useNavigate } from "react-router-dom";
import styles from "./NhaTroCategories.module.css";

const NhaTroCategories = () => {
  const [mainCategories, setMainCategories] = useState([]);
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const navigate = useNavigate();

  const categoryImages = {
    "mua bán nhà đất": "/images/MuaBan.png",
    "cho thuê nhà đất": "/images/ChoThue.png",
    "mua bán": "/images/MuaBan.png",
    "cho thuê": "/images/ChoThue.png",
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        const allCategories = response.data;

        // Tìm danh mục cha "Bất động sản"
        const batDongSanParent = allCategories.find(
          (cat) => cat.tenDanhMucCha && 
          (cat.tenDanhMucCha.toLowerCase().trim() === "bất động sản" ||
           cat.tenDanhMucCha.toLowerCase().trim() === "nhà trọ")
        );

        if (batDongSanParent && batDongSanParent.danhMucCon) {
          // Tìm 2 danh mục con chính: "Mua bán" và "Cho Thuê"
          const muaBanCat = batDongSanParent.danhMucCon.find(
            (sub) => sub.tenDanhMucCon.toLowerCase().includes("mua") || 
                     sub.tenDanhMucCon.toLowerCase().includes("bán")
          );

          const choThuesCat = batDongSanParent.danhMucCon.find(
            (sub) => sub.tenDanhMucCon.toLowerCase().includes("cho thuê") ||
                     sub.tenDanhMucCon.toLowerCase().includes("thuê")
          );

          // Nếu không tìm được, lấy 2 cái đầu tiên
          const selectedCats = [];
          if (muaBanCat) selectedCats.push({ ...muaBanCat, type: "muaBan" });
          if (choThuesCat) selectedCats.push({ ...choThuesCat, type: "choThue" });

          // Nếu chưa đủ 2, lấy thêm từ danh sách
          if (selectedCats.length < 2) {
            const remaining = batDongSanParent.danhMucCon.filter(
              (cat) => !selectedCats.some((selected) => selected.maDanhMuc === cat.maDanhMuc)
            );
            selectedCats.push(...remaining.slice(0, 2 - selectedCats.length));
          }

          setMainCategories(selectedCats.slice(0, 2));
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục bất động sản:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubCategoryClick = (subCategoryName) => {
    setSelectedCategory("Bất động sản");
    setSelectedSubCategory(subCategoryName);
    navigate("/loc-tin-dang");
  };

  if (mainCategories.length === 0) return null;

  return (
    <div className={styles.container}>
      {mainCategories.map((category, index) => (
        <div key={index} className={styles.categoryBox}>
          <div className={styles.boxHeader}>
            <div className={styles.boxContent}>
              <img
                src={categoryImages[category.tenDanhMucCon.toLowerCase()] || "https://cdn-icons-png.flaticon.com/512/3050/3050159.png"}
                alt={category.tenDanhMucCon}
                className={styles.boxImage}
              />
              <div className={styles.boxInfo}>
                <h2 className={styles.boxTitle}>{category.tenDanhMucCon}</h2>
                <p className={styles.boxCount}>Khám phá tin đăng bất động sản</p>
              </div>
            </div>
          </div>

          {category.danhMucCon && category.danhMucCon.length > 0 && (
            <div className={styles.subCategories}>
              {category.danhMucCon.slice(0, 4).map((subCat, subIndex) => (
                <a
                  key={subIndex}
                  href="#"
                  className={styles.subCategoryLink}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubCategoryClick(subCat.tenDanhMucCon);
                  }}
                >
                  {subCat.tenDanhMucCon}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NhaTroCategories;
