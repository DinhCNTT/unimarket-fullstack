import React, { useRef, useEffect } from "react";
import styles from "./SearchTabs.module.css";

const SearchTabs = ({ activeTab, onTabChange }) => {
  const underlineRef = useRef();
  const menuRef = useRef();

  const handleHover = (e) => {
    if (!underlineRef.current || !menuRef.current) return;
    const rect = e.target.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    underlineRef.current.style.left = `${rect.left - menuRect.left}px`;
    underlineRef.current.style.width = `${rect.width}px`;
  };

  const resetUnderline = () => {
    if (underlineRef.current && menuRef.current) {
      const activeItem = menuRef.current.querySelector(`.${styles.active}`);
      if (activeItem) {
        const rect = activeItem.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        underlineRef.current.style.left = `${rect.left - menuRect.left}px`;
        underlineRef.current.style.width = `${rect.width}px`;
      } else {
        underlineRef.current.style.width = "0";
      }
    }
  };

  // Reset underline khi activeTab thay đổi
  useEffect(() => {
    resetUnderline();
  }, [activeTab]);

  return (
    <div className={styles.menu} ref={menuRef} onMouseLeave={resetUnderline}>
      <div
        className={`${styles.menuItem} ${activeTab === "top" ? styles.active : ""}`}
        onMouseEnter={handleHover}
        onClick={() => onTabChange("top")}
      >
        Top
      </div>
      <div
        className={`${styles.menuItem} ${activeTab === "user" ? styles.active : ""}`}
        onMouseEnter={handleHover}
        onClick={() => onTabChange("user")}
      >
        User
      </div>
      <div className={styles.underline} ref={underlineRef}></div>
    </div>
  );
};

export default SearchTabs;