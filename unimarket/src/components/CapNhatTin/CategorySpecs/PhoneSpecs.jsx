import React, { useMemo } from "react";
import styles from "../CapNhatTin.module.css";

// 1. DATA CẤU HÌNH (Định nghĩa bên ngoài để tối ưu bộ nhớ)
const PHONE_DATA = {
  "Apple": [
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 mini", "iPhone 13",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 mini", "iPhone 12",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
    "iPhone SE 2022 (Gen 3)", "iPhone SE 2020 (Gen 2)", "Khác"
  ],
  "Samsung": [
    "Galaxy S24 Ultra", "Galaxy S24 Plus", "Galaxy S24", 
    "Galaxy S23 Ultra", "Galaxy S23 Plus", "Galaxy S23", "Galaxy S23 FE",
    "Galaxy Z Fold6", "Galaxy Z Flip6", "Galaxy Z Fold5", "Galaxy Z Flip5",
    "Galaxy A55 5G", "Galaxy A35 5G", "Galaxy A25 5G", "Galaxy A15",
    "Galaxy M55", "Galaxy M35", "Khác"
  ],
  "Xiaomi": [
    "Xiaomi 14 Ultra", "Xiaomi 14", "Xiaomi 13T", 
    "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13",
    "Poco F6", "Poco X6 Pro", "Khác"
  ],
  "Oppo": [
    "Find N3", "Find N3 Flip", "Reno11 F 5G", "Reno11 5G", "Oppo A60", "Khác"
  ],
  "Vivo": ["Vivo X100 Pro", "Vivo V30", "Vivo Y100", "Khác"],
  "Huawei": ["Pura 70 Ultra", "Mate 60 Pro", "Khác"],
  "Nokia": ["Nokia G42 5G", "Nokia C32", "Khác"],
  "Sony": ["Xperia 1 VI", "Xperia 10 VI", "Khác"],
  "Khác": ["Khác"]
};

const COLORS = ["Đen", "Trắng", "Đỏ", "Xanh dương", "Xanh lá", "Vàng", "Bạc", "Xám", "Hồng", "Tím", "Titan", "Kem", "Xanh Mint"];
const STORAGES = ["< 64GB", "64GB", "128GB", "256GB", "512GB", "1TB", "> 1TB"];
const WARRANTIES = ["Hết bảo hành", "Còn bảo hành", "Bảo hành chính hãng", "Bảo hành cửa hàng"];

const PhoneSpecs = ({ data, onChange, errors }) => {
  const brands = Object.keys(PHONE_DATA);

  // Logic lấy dòng máy tương ứng (SỬA: data.hang chữ thường)
  const availableModels = useMemo(() => {
    return data.hang ? PHONE_DATA[data.hang] || [] : [];
  }, [data.hang]);

  // Hàm xử lý thay đổi hãng (SỬA: key chữ thường)
  const handleBrandChange = (e) => {
    const newBrand = e.target.value;
    onChange("hang", newBrand);
    onChange("dongMay", ""); // Reset dòng máy về rỗng
  };

  return (
    <div className={styles.dynamicBox}>
      <label className={styles.dynamicTitle}>
        Thông tin chi tiết (Điện thoại)
      </label>
      
      {/* HÀNG 1: Hãng & Dòng máy */}
      <div className={styles.dynamicGrid}>
        {/* Hãng sản xuất */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Hãng sản xuất <span style={{color: 'red'}}>*</span>
          </label>
          <select 
            className={`${styles.select} ${errors?.hang ? styles.inputError : ''}`}
            value={data.hang || ""} 
            onChange={handleBrandChange} 
          >
            <option value="">Chọn hãng</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors?.hang && <span className={styles.errorText}>Vui lòng chọn hãng</span>}
        </div>

        {/* Dòng máy */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Dòng máy <span style={{color: 'red'}}>*</span>
          </label>
          <select 
            className={`${styles.select} ${errors?.dongMay ? styles.inputError : ''}`}
            value={data.dongMay || ""} 
            onChange={(e) => onChange("dongMay", e.target.value)}
            disabled={!data.hang} 
            style={{ 
                backgroundColor: !data.hang ? "#f9f9f9" : "white",
                cursor: !data.hang ? "not-allowed" : "pointer",
                opacity: !data.hang ? 0.7 : 1
            }}
          >
            <option value="">
               {!data.hang ? "Chọn hãng trước" : "Chọn dòng máy"}
            </option>
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors?.dongMay && <span className={styles.errorText}>Vui lòng chọn dòng máy</span>}
        </div>
      </div>

      {/* HÀNG 2: Màu sắc & Dung lượng */}
      <div className={styles.dynamicGrid} style={{marginTop: "15px"}}>
        {/* Màu sắc */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Màu sắc <span style={{color: 'red'}}>*</span>
          </label>
          <select 
            className={`${styles.select} ${errors?.mauSac ? styles.inputError : ''}`}
            value={data.mauSac || ""} 
            onChange={(e) => onChange("mauSac", e.target.value)}
          >
            <option value="">Chọn màu</option>
            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors?.mauSac && <span className={styles.errorText}>Vui lòng chọn màu sắc</span>}
        </div>

        {/* Dung lượng */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Dung lượng <span style={{color: 'red'}}>*</span>
          </label>
          <select 
            className={`${styles.select} ${errors?.dungLuong ? styles.inputError : ''}`}
            value={data.dungLuong || ""} 
            onChange={(e) => onChange("dungLuong", e.target.value)}
          >
            <option value="">Chọn dung lượng</option>
            {STORAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors?.dungLuong && <span className={styles.errorText}>Vui lòng chọn dung lượng</span>}
        </div>
      </div>

      {/* HÀNG 3: Bảo hành & Xuất xứ */}
      <div className={styles.dynamicGrid} style={{marginTop: "15px"}}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Bảo hành <span style={{color: 'red'}}>*</span>
          </label>
          <select 
            className={`${styles.select} ${errors?.baoHanh ? styles.inputError : ''}`}
            value={data.baoHanh || ""} 
            onChange={(e) => onChange("baoHanh", e.target.value)}
          >
            <option value="">Chọn bảo hành</option>
            {WARRANTIES.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          {errors?.baoHanh && <span className={styles.errorText}>Vui lòng chọn bảo hành</span>}
        </div>

         <div className={styles.formGroup}>
          <label className={styles.label}>Xuất xứ</label>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="VD: Việt Nam, Hàn Quốc..." 
            value={data.xuatXu || ""} 
            onChange={(e) => onChange("xuatXu", e.target.value)} 
          />
        </div>
      </div>
    </div>
  );
};

export default PhoneSpecs;