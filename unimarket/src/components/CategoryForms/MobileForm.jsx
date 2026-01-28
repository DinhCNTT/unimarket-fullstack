// src/components/MobileForm.jsx
import React, { useMemo } from "react";
import styles from "../PostTinDang.module.css"; // Ensure this path is correct for your project structure
// Import shared data constants
import { 
  PHONE_DATA, 
  PHONE_COLORS, 
  PHONE_STORAGES, 
  PHONE_WARRANTIES 
} from "../../constants/PhoneData";

const MobileForm = ({ data, onChange }) => {

  // 1. Get list of Brand Names from the keys of PHONE_DATA object
  const brands = Object.keys(PHONE_DATA);

  // 2. Logic to get specific models based on selected Brand
  const availableModels = useMemo(() => {
    // If a brand is selected, return its 'models' array from PHONE_DATA
    // Otherwise, return an empty array
    return data.Hang ? PHONE_DATA[data.Hang]?.models || [] : [];
  }, [data.Hang]);

  // 3. Handle input changes
  const handleChange = (key, value) => {
    if (key === "Hang") {
        onChange("Hang", value);
        onChange("DongMay", ""); // Reset model when brand changes to avoid mismatch
    } else {
        onChange(key, value);
    }
  };

  return (
    <div style={{ width: "100%", marginBottom: "20px" }}>
      <h3 style={{ marginBottom: "15px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        Thông tin chi tiết điện thoại
      </h3>

      {/* Row 1: Brand & Model */}
      <div style={{ display: "flex", gap: "20px" }}>
          {/* Brand Selection */}
          <div className={styles.formGroup} style={{ width: "50%" }}>
            <label>Hãng sản xuất <span style={{ color: "red" }}>*</span></label>
            <select
              value={data.Hang || ""}
              onChange={(e) => handleChange("Hang", e.target.value)}
              required
            >
              <option value="">Chọn hãng</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Model Selection (Dependent on Brand) */}
          <div className={styles.formGroup} style={{ width: "50%" }}>
            <label>Dòng máy <span style={{ color: "red" }}>*</span></label>
            <select
              value={data.DongMay || ""}
              onChange={(e) => handleChange("DongMay", e.target.value)}
              required
              disabled={!data.Hang}
              style={{ 
                  cursor: !data.Hang ? "not-allowed" : "pointer", 
                  opacity: !data.Hang ? 0.6 : 1,
                  backgroundColor: !data.Hang ? "#f5f5f5" : "white" 
              }}
            >
              <option value="">
                {!data.Hang ? "Vui lòng chọn hãng trước" : "Chọn dòng máy"}
              </option>
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
      </div>

      {/* Row 2: Color & Storage */}
      <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Màu sắc <span style={{ color: "red" }}>*</span></label>
          <select 
            value={data.MauSac || ""} 
            onChange={(e) => handleChange("MauSac", e.target.value)} 
            required
          >
            <option value="">Chọn màu</option>
            {PHONE_COLORS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Dung lượng <span style={{ color: "red" }}>*</span></label>
          <select 
            value={data.DungLuong || ""} 
            onChange={(e) => handleChange("DungLuong", e.target.value)} 
            required
          >
            <option value="">Chọn dung lượng</option>
            {PHONE_STORAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Warranty & Origin */}
      <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Chính sách bảo hành</label>
          <select 
            value={data.BaoHanh || ""} 
            onChange={(e) => handleChange("BaoHanh", e.target.value)}
          >
            <option value="">Chọn bảo hành</option>
            {PHONE_WARRANTIES.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Xuất xứ</label>
          <input 
            type="text" 
            placeholder="VD: Việt Nam, Hàn Quốc..." 
            value={data.XuatXu || ""} 
            onChange={(e) => handleChange("XuatXu", e.target.value)} 
          />
        </div>
      </div>
    </div>
  );
};

export default MobileForm;