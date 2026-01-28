import React, { useRef, useState, useEffect } from 'react';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import styles from './CategoryBar.module.css';

// Import SidebarHeader
import SidebarHeader from '../Common/SidebarHeader'; 

const CategoryBar = ({ categories, selectedId, onSelect }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // --- STATE & LOGIC ẨN HIỆN KHI CUỘN ---
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // 1. Lấy phần tử div đang cuộn (đã đặt ID bên ExplorePage.jsx)
    const scrollableDiv = document.getElementById('scrollableDiv');

    if (!scrollableDiv) return;

    const handleScroll = () => {
      // 2. Lấy vị trí cuộn từ div đó (scrollTop) chứ không phải window.scrollY
      const currentScrollY = scrollableDiv.scrollTop;

      // Logic: 
      // - Nếu cuộn xuống (current > last) VÀ đã cuộn qua 50px => ẨN
      // - Nếu cuộn lên (current < last) => HIỆN
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    // 3. Gắn sự kiện vào scrollableDiv
    scrollableDiv.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => scrollableDiv.removeEventListener('scroll', handleScroll);
  }, []); // Chỉ chạy 1 lần khi mount
  // ----------------------------------------

  // Hàm kiểm tra mũi tên (giữ nguyên)
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [categories]); 

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200; 
      const currentScroll = scrollRef.current.scrollLeft;
      scrollRef.current.scrollTo({
        left: direction === 'right' ? currentScroll + scrollAmount : currentScroll - scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollPosition, 300); 
    }
  };

  return (
    <div className={`${styles.stickyWrapper} ${isHidden ? styles.hidden : ''}`}>

      <div className={styles.containerRelative}>
        {showLeftArrow && (
          <button 
            className={`${styles.arrowBtn} ${styles.arrowLeft}`} 
            onClick={() => scroll('left')}
          >
            <FiChevronLeft size={20} />
          </button>
        )}

        <div 
            className={styles.scrollContainer} 
            ref={scrollRef}
            onScroll={checkScrollPosition} 
        >
          <button
            className={`${styles.categoryBtn} ${selectedId === 0 ? styles.active : ''}`}
            onClick={() => onSelect(0)}
          >
            Tất cả
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.categoryBtn} ${selectedId === cat.id ? styles.active : ''}`}
              onClick={() => onSelect(cat.id)}
            >
              {cat.ten}
            </button>
          ))}

          <div style={{ minWidth: '40px' }}></div>
        </div>

        {showRightArrow && (
          <button 
            className={`${styles.arrowBtn} ${styles.arrowRight}`} 
            onClick={() => scroll('right')}
          >
            <FiChevronRight size={20} /> 
          </button>
        )}
      </div>

      <div className={styles.headerRightSection}>
        <SidebarHeader />
      </div>

    </div>
  );
};

export default CategoryBar;