import React, { useState } from "react";
import styles from "./DescriptionSection.module.css";

const DescriptionSection = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={styles.container}>
      <h5 className={styles.title}>Mô tả chi tiết</h5>
      <p className={`${styles.text} ${expanded ? styles.expanded : styles.collapsed}`}>
        {text}
      </p>
      {text.length > 150 && (
        <button className={styles.toggleBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </div>
  );
};
export default DescriptionSection;