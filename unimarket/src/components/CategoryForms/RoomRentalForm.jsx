// src/components/CategoryForms/RoomRentalForm.jsx
import React from "react";
import styles from "../PostTinDang.module.css";

const RoomRentalForm = ({ data, onChange }) => {
  
  const amenityOptions = [
    { key: "wifi", label: "WiFi" },
    { key: "may-lanh", label: "Máy lạnh" },
    { key: "may-giat", label: "Máy giặt" },
    { key: "bep", label: "Bếp" },
    { key: "ban-cong", label: "Ban công" },
    { key: "cho-xe", label: "Chỗ để xe" },
    { key: "camera", label: "Camera" },
    { key: "nhan-vien-24h", label: "Nhân viên 24/7" }
  ];

  const handleAmenityChange = (amenity) => {
    const tienIch = data.tienIch || [];
    if (tienIch.includes(amenity)) {
      onChange("tienIch", tienIch.filter(t => t !== amenity));
    } else {
      onChange("tienIch", [...tienIch, amenity]);
    }
  };

  return (
    <div style={{ width: "100%", marginBottom: "20px" }}>
      <h3 style={{ marginBottom: "15px", color: "#ff6b35", borderBottom: "2px solid #ff6b35", paddingBottom: "10px" }}>
        Thông tin chi tiết phòng trọ/bất động sản
      </h3>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
        ⭐ Các trường đánh dấu * là bắt buộc để hoàn tất bài đăng
      </p>

      {/* Row 1: Loại phòng & Diện tích */}
      <div style={{ display: "flex", gap: "20px" }}>
        {/* Loại phòng */}
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Loại phòng <span style={{ color: "red" }}>*</span></label>
          <select 
            value={data.loaiHinhPhong || ""} 
            onChange={(e) => onChange("loaiHinhPhong", e.target.value)}
            required
          >
            <option value="">-- Chọn loại phòng --</option>
            <option value="phòng trọ">Phòng trọ</option>
            <option value="căn hộ mini">Căn hộ mini</option>
            <option value="nhà nguyên căn">Nhà nguyên căn</option>
            <option value="ký túc xá">Ký túc xá</option>
            <option value="chung cư">Chung cư</option>
          </select>
        </div>

        {/* Diện tích */}
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Diện tích (m²) <span style={{ color: "red" }}>*</span></label>
          <input 
            type="number" 
            value={data.dienTichPhong || ""} 
            onChange={(e) => onChange("dienTichPhong", e.target.value)}
            placeholder="VD: 25"
            min="1"
            required
          />
        </div>
      </div>

      {/* Row 2: Sức chứa & Thời hạn */}
      <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
        {/* Sức chứa */}
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Sức chứa (số người) <span style={{ color: "red" }}>*</span></label>
          <input 
            type="number" 
            value={data.sucChua || ""} 
            onChange={(e) => onChange("sucChua", e.target.value)}
            placeholder="VD: 2"
            min="1"
            required
          />
        </div>

        {/* Thời hạn cho thuê */}
        <div className={styles.formGroup} style={{ width: "50%" }}>
          <label>Thời hạn cho thuê (tháng) <span style={{ color: "red" }}>*</span></label>
          <select 
            value={data.thoiHanChoThue || ""} 
            onChange={(e) => onChange("thoiHanChoThue", e.target.value)}
            required
          >
            <option value="">-- Chọn thời hạn --</option>
            <option value="1">1 tháng (linh hoạt)</option>
            <option value="3">3 tháng</option>
            <option value="6">6 tháng</option>
            <option value="12">12 tháng</option>
          </select>
        </div>
      </div>

      {/* Row 4: Tiện ích (Checkboxes) */}
      <div style={{ marginTop: "15px" }}>
        <label style={{ display: "block", marginBottom: "10px", fontWeight: "600" }}>
          Tiện ích đi kèm (có thể chọn nhiều)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {amenityOptions.map(amenity => (
            <label 
              key={amenity.key} 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
                backgroundColor: data.tienIch?.includes(amenity.label) ? "#fff3e0" : "transparent",
                transition: "background-color 0.2s"
              }}
            >
              <input 
                type="checkbox" 
                checked={data.tienIch?.includes(amenity.label) || false}
                onChange={() => handleAmenityChange(amenity.label)}
                style={{ cursor: "pointer", width: "16px", height: "16px" }}
              />
              <span style={{ fontWeight: "500" }}>{amenity.label}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
};

export default RoomRentalForm;
