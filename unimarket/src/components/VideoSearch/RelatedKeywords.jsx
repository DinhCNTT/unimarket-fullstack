import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import styles from "./RelatedKeywords.module.css";

const RelatedSearchSidebar = ({ keywords }) => {
  const navigate = useNavigate();

  if (!keywords || keywords.length === 0) return null;

  const handleItemClick = (kw) => {
    navigate(`/search/${encodeURIComponent(kw)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.sidebarContainer}>
      <h3 className={styles.heading}>Những người khác tìm kiếm</h3>
      <ul className={styles.list}>
        {/* THÊM .slice(0, 10) VÀO ĐÂY */}
        {keywords.slice(0, 10).map((item, index) => (
          <li key={index} className={styles.item} onClick={() => handleItemClick(item)}>
            <div className={styles.iconBox}>
               <FiSearch size={14} />
            </div>
            <span className={styles.text}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RelatedSearchSidebar;