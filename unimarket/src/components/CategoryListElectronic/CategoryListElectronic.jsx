// src/components/CategoryListElectronic/CategoryListElectronic.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { CategoryContext } from "../../context/CategoryContext";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./CategoryListElectronic.module.css";

// --- GIẢI PHÁP ẢNH: MAPPING THỦ CÔNG ---
// Bạn hãy thay các link ảnh bên dưới bằng link ảnh thật (hoặc ảnh trong folder public)
// Key là tên danh mục con (viết thường để dễ so sánh), Value là đường dẫn ảnh.
const CATEGORY_IMAGES_MAP = {
  "điện thoại": "https://cdn.chotot.com/admincentre/_6HkUV9GLkQVYzGLAGlX01LgB_RTMmf-ZeaS4KC9zcM/preset:raw/plain/79176088b89fc1b7ce1d670ddbbda98c-2817709716384223622.jpg?w=96&q=95 1x", // Ví dụ icon điện thoại
  "máy tính bảng": "https://cdn.chotot.com/admincentre/KqchT0W4MxT4CIIbDLe1YvwT3On4hihu_InIFezRTcM/preset:raw/plain/3715ad7eb3a305c041bcd690b9946b53-2817709890339556531.jpg?w=96&q=95 1x",
  "laptop": "https://cdn.chotot.com/admincentre/-lewyUi6OD_pO-8_QCVNIgowdt_TvilN6TByCq7FN8I/preset:raw/plain/64503378ceb48854f3d28c3e098c5136-2817710072897534395.jpg?w=256&q=95 2x",
  "máy tính để bàn": "https://cdn.chotot.com/admincentre/XPtQRO5obAnsBcEC85sgHft5OWmOedTmrjNU3ooMj2E/preset:raw/plain/11ae6817eaba2d6544c006997dcef2ad-2817710190632836314.jpg?w=256&q=95 2x",
  "loa": "https://cdn.chotot.com/admincentre/ZQQV1_yWaGjjwrOajOV5VsaRQ2JFwDtcegfhbJAz7ZQ/preset:raw/plain/dcc99fa6d8394fa42086d1fba8c1ebb3-2817710681964191380.jpg?w=256&q=95 2x",
  "tai nghe": "https://cdn.chotot.com/admincentre/rQqj9MOhgUWHot04w_S3zjcTW6obvhq2XFW0HjlUIZA/preset:raw/plain/05a7c40b08e85640160e71430b32ac9a-2817711079739816379.jpg?w=256&q=95 1x",
  "máy ảnh, máy quay": "https://cdn.chotot.com/admincentre/S7H4QW_H2Gl37jSaAudF1t9i-iQgd_uojpEWbiTbUa0/preset:raw/plain/2bde9f39573238375c01cf23f6bb9657-2817711149724671194.jpg?w=256&q=95",
  "phụ kiện": "https://cdn.chotot.com/admincentre/a1J6wGhJyyCLBjfAw703etDGIUKnqPFYXmdv5rRKl5M/preset:raw/plain/14bd7c38dac3034995a5e21b249863eb-2817808595367207726.jpg?w=256&q=95",
  "linh kiện máy tính": "https://cdn.chotot.com/admincentre/ebo2eC_NPj047vcGfRPgqtteiEeI1aTY6E4UJZnXuTk/preset:raw/plain/43a5a757a5ded7c260a26356340cd2e2-2817808750266079688.jpg?w=256&q=95",
  "tivi, âm thanh": "https://cdn.chotot.com/admincentre/08AErVO2KlVZASAyOOcXp9OAqBorNgtCGdeSDauhiTM/preset:raw/plain/60f30f1e6778fae29587cfe3115d0e88-2817846864127936513.jpg?w=256&q=95 2x",
  "thiết bị đeo thông minh": "https://cdn-icons-png.flaticon.com/512/3014/3014207.png",
  // Thêm các danh mục khác vào đây...
};

const DEFAULT_IMAGE = "https://cdn-icons-png.flaticon.com/512/263/263142.png"; // Ảnh mặc định nếu không khớp tên

const CategoryListElectronic = () => {
  const [subCategories, setSubCategories] = useState([]);
  const { setSelectedCategory, setSelectedSubCategory } = useContext(CategoryContext);
  const navigate = useNavigate();
  const listRef = useRef(null);

  useEffect(() => {
    const fetchElectronicCategories = async () => {
      try {
        // Gọi API lấy danh mục kèm icon (đã có cấu trúc cha-con)
        const response = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        const allCategories = response.data;

        // 1. Tìm danh mục cha là "Đồ điện tử"
        const electronicParent = allCategories.find(
          (cat) => cat.tenDanhMucCha && cat.tenDanhMucCha.toLowerCase().trim() === "đồ điện tử"
        );

        if (electronicParent && electronicParent.danhMucCon) {
          // 2. Map dữ liệu để thêm ảnh từ bảng Mapping phía trên
          const formattedSubCats = electronicParent.danhMucCon.map((sub) => {
             const keyName = sub.tenDanhMucCon.toLowerCase().trim();
             // Nếu tên trong API có chứa từ khóa trong Map thì lấy ảnh đó
             // Logic tìm kiếm tương đối:
             const matchedKey = Object.keys(CATEGORY_IMAGES_MAP).find(k => keyName.includes(k) || k.includes(keyName));

             return {
                ...sub,
                image: matchedKey ? CATEGORY_IMAGES_MAP[matchedKey] : DEFAULT_IMAGE
             };
          });

          setSubCategories(formattedSubCats);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục đồ điện tử:", error);
      }
    };

    fetchElectronicCategories();
  }, []);

  const handleSubCategoryClick = (subName) => {
    // Khi click vào con, set Parent là Đồ điện tử, Sub là tên vừa click
    setSelectedCategory("Đồ điện tử");
    setSelectedSubCategory(subName);
    navigate("/loc-tin-dang");
  };

  const handleViewAll = () => {
      setSelectedCategory("Đồ điện tử");
      setSelectedSubCategory("");
      navigate("/loc-tin-dang");
  }

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
        <h2 className={styles.title}>KHÁM PHÁ ĐỒ ĐIỆN TỬ</h2>
      </div>

      <div className={styles.scrollWrapper}>
        <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={() => scroll("left")}>
          <FaChevronLeft />
        </button>

        <div className={styles.list} ref={listRef}>
          {subCategories.map((sub, index) => (
            <div 
                key={index} 
                className={styles.item} 
                onClick={() => handleSubCategoryClick(sub.tenDanhMucCon)}
            >
              <div className={styles.imageBox}>
                <img 
                    src={sub.image} 
                    alt={sub.tenDanhMucCon} 
                    className={styles.image} 
                    onError={(e) => e.target.src = DEFAULT_IMAGE}
                />
              </div>
              <span className={styles.name}>{sub.tenDanhMucCon}</span>
            </div>
          ))}

            {/* Nút "Tất cả" ở cuối danh sách  */}
             <div className={styles.item} onClick={handleViewAll}>
              <div className={styles.imageBox}>
                <img 
                    src="https://cdn.chotot.com/admincentre/1uxcsrvSPxvrHAWAy52WT9lzXBKw1oN3h4-ZXapqEDA/preset:raw/plain/7ebfcf0dbb7af17f07b5ebd94d7a3358-2948580609653709280.jpg?w=96&q=95 1x" 
                    alt="Tất cả" 
                    className={styles.image} 
                />
              </div>
              <span className={styles.name}>Tất cả Đồ điện tử</span>
            </div>
        </div>

        <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={() => scroll("right")}>
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default CategoryListElectronic;
