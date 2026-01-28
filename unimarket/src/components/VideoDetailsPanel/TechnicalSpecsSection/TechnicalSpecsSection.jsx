import React from 'react';
import styles from './TechnicalSpecsSection.module.css';

// 1. Từ điển map key sang tiếng Việt hiển thị cho đẹp
const SPEC_LABELS = {
  hang: "Hãng sản xuất",
  dongMay: "Dòng máy",
  mauSac: "Màu sắc",
  dungLuong: "Dung lượng",
  baoHanh: "Bảo hành",
  xuatXu: "Xuất xứ",
  tinhTrang: "Tình trạng",
  namSanXuat: "Năm sản xuất",
  kichThuoc: "Kích thước màn hình",
  pin: "Dung lượng Pin",
  // Thêm các key khác nếu có...
};

// Hàm helper: Nếu không tìm thấy trong từ điển thì tự format (vd: cameraSau -> Camera Sau)
const formatLabel = (key) => {
  if (SPEC_LABELS[key]) return SPEC_LABELS[key];
  // Fallback: Tách camelCase thành chữ thường và viết hoa chữ đầu
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const TechnicalSpecsSection = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const specs = Object.entries(data);

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>
        <span className={styles.headingText}>Thông số kỹ thuật</span>
      </h3>
      
      <div className={styles.listContainer}>
        {specs.map(([key, value], index) => (
          <div key={index} className={styles.itemRow}>
            <div className={styles.itemLabel}>
              {formatLabel(key)}
            </div>
            <div className={styles.itemValue}>
              {value?.toString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnicalSpecsSection;