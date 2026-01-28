import React, { useState } from "react";
import styles from "./PostDescription.module.css"; 

const PostDescription = ({ description }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const descriptionHtml = (description || "").replace(/\n/g, "<br/>");
  const needsTruncation = description?.split("\n").length > 8; // Logic "Xem thêm"

  return (
    <div className={styles.moTaChiTiet}>
      {/* Thẻ div này sẽ tự động kế thừa font từ .moTaChiTiet */}
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
        Mô tả chi tiết
      </div>
      
      <div
        className={`${styles.moTaNdWrapper} ${
          !needsTruncation || showFullDescription ? styles.moTaNdFull : styles.moTaNdClamp
        }`}
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
      
      {needsTruncation && (
        <button
          className={styles.moTaNdToggle}
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </div>
  );
};

export default PostDescription;