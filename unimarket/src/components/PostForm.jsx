import React, { useState, useEffect } from "react";
import axios from "axios";
import TopNavbar from "./TopNavbar/TopNavbar";
// 1. Dùng useParams để lấy biến từ URL, useNavigate để chuyển trang
import { useNavigate, useParams } from "react-router-dom";
import styles from "./PostForm.module.css";


const PostForm = () => {
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSubCategories, setShowSubCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const navigate = useNavigate();
 
  // 2. Lấy slug từ URL (ví dụ: 'do-dien-tu')
  const { categorySlug } = useParams();


  // 3. Map từ Slug trên URL sang Tên Danh Mục Chính Xác trong Database
  const slugToNameMap = {
    "do-dien-tu": "Đồ điện tử",
    "xe-co": "Xe cộ",
    "nha-tro": "Nhà trọ",
    "bat-dong-san": "Bất động sản",
    // ... thêm các mục khác nếu cần
  };


  // Xác định xem có đang bị khóa hay không
  const lockedCategoryName = categorySlug ? slugToNameMap[categorySlug] : null;


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5133/api/category/get-categories-with-icon");
        console.log("Dữ liệu danh mục:", res.data);


        const validCategories = res.data.map(category => ({
          ...category,
          DanhMucCon: Array.isArray(category.danhMucCon) ? category.danhMucCon.filter(sub => sub?.id) : [],
        }));
       
        setCategories(validCategories);


        // 4. LOGIC KHÓA: Nếu URL có slug hợp lệ -> Tự động chọn danh mục đó
        if (lockedCategoryName) {
          const targetCategory = validCategories.find(c =>
            c.tenDanhMucCha.toLowerCase() === lockedCategoryName.toLowerCase()
          );


          if (targetCategory) {
            setSelectedCategory(targetCategory);
            setSubCategories(targetCategory.DanhMucCon);
            setShowSubCategories(true); // Vào thẳng danh mục con
          }
        }


      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      }
    };
    fetchCategories();


    setModalVisible(true);
  }, [lockedCategoryName]); // Chạy lại khi URL thay đổi (VD: user tự sửa URL)


  const toggleModal = () => {
    setModalVisible(!modalVisible);
    // Chỉ reset về danh mục cha nếu KHÔNG bị khóa
    if (!lockedCategoryName) {
      setShowSubCategories(false);
    }
  };


  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSubCategories(category.DanhMucCon);
    setShowSubCategories(true);
  };


  const handleBackToCategories = () => {
    // 5. Nếu đang bị khóa bởi URL -> Không cho quay lại
    if (lockedCategoryName) return;
    setShowSubCategories(false);
  };


  const handleSubCategorySelect = (subCategory) => {
    console.log("Danh mục con đã chọn:", subCategory.tenDanhMucCon);
    setModalVisible(false);
    if (!lockedCategoryName) {
        setShowSubCategories(false);
    }

    // Gửi cả parent category name (danh mục cha)
    navigate(`/post-tin?categoryId=${subCategory.id}&categoryName=${subCategory.tenDanhMucCon}&parentCategory=${selectedCategory.tenDanhMucCha}`);
  };


  const handleClickOutside = (event) => {
    if (event.target.closest(`.${styles.content}`) === null) {
      setModalVisible(false);
    }
  };


  return (
    <>
      <TopNavbar />
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.section}>
           
            {/* --- Layout chia 2 cột --- */}
            <div className={styles.layoutContainer}>
              <div className={styles.leftColumn}>
                <h2 className={styles.mainTitle}>Đăng tin mới</h2>
                <p className={styles.subtitle}>Chọn danh mục để bắt đầu đăng tin</p>
                <div className={styles.header} onClick={toggleModal}>
                  <div className={styles.headerContent}>
                    <span className={styles.headerLabel}>Danh mục</span>
                    <span className={styles.headerValue}>
                      {selectedCategory ? selectedCategory.tenDanhMucCha : "Chọn danh mục"}
                    </span>
                  </div>
                  <svg className={styles.chevron} width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className={styles.rightColumn}>
                <img
                  src="/images/FormDangTin.png"
                  alt="Minh họa đăng tin"
                  className={styles.illustrationImage}
                />
              </div>
            </div>


            {modalVisible && (
              <div className={`${styles.modal} ${styles.active}`} onClick={handleClickOutside}>
                <div className={styles.content}>
                  {!showSubCategories ? (
                    /* --- TRƯỜNG HỢP: HIỂN THỊ DANH MỤC CHA (Chỉ hiện khi KHÔNG khóa) --- */
                    <>
                      <div className={styles.modalHeader}>
                        <h3 className={styles.modalTitle}>Chọn danh mục</h3>
                        <button className={styles.btnClose} onClick={toggleModal}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className={styles.grid}>
                        {categories.map((category) => (
                          <div key={category.id} className={styles.item} onClick={() => handleCategorySelect(category)}>
                            <div className={styles.itemLeft}>
                              {category.icon && <img src={category.icon} alt={category.tenDanhMucCha} className={styles.icon} />}
                              <span className={styles.itemText}>{category.tenDanhMucCha}</span>
                            </div>
                            <svg className={styles.arrow} width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* --- TRƯỜNG HỢP: HIỂN THỊ DANH MỤC CON --- */
                    <>
                      <div className={styles.modalHeader}>
                        {/* 6. Ẩn nút Quay lại nếu đang bị khóa */}
                        {!lockedCategoryName && (
                          <button className={styles.btnBack} onClick={handleBackToCategories}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Quay lại</span>
                          </button>
                        )}
                       
                        <h3 className={styles.modalTitle}>
                            {selectedCategory?.tenDanhMucCha}
                            {/* UI nhỏ để báo hiệu */}
                            {lockedCategoryName && <span style={{fontSize: '13px', fontWeight: '400', marginLeft: '8px', color: '#888'}}>(Tự động chọn)</span>}
                        </h3>


                        {/* Nút đóng modal: Luôn hiện để user có thể thoát ra */}
                        <button className={styles.btnClose} onClick={() => setModalVisible(false)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                      </div>
                     
                      <div className={styles.subList}>
                        {subCategories.map((subCategory) => (
                          <div
                            key={subCategory.id}
                            className={styles.subItem}
                            onClick={() => handleSubCategorySelect(subCategory)}
                          >
                            <span className={styles.subName}>{subCategory.tenDanhMucCon}</span>
                            <svg className={styles.arrow} width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};


export default PostForm;