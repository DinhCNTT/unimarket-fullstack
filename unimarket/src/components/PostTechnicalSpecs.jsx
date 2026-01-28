import React from "react";
import styles from "./PostTechnicalSpecs.module.css";

const PostTechnicalSpecs = (props) => {
  const { detailsJson } = props;

  // --- PHẦN 1: XỬ LÝ DỮ LIỆU TỪ SQL SERVER (Props) ---
  
  // 1. Lấy Tình Trạng
  // Chấp nhận cả viết hoa (TinhTrang) hoặc viết thường (tinhTrang) hoặc prop tên condition
  const sqlCondition = props.TinhTrang || props.tinhTrang || props.condition;
  
  // 2. Lấy Thương Lượng
  let sqlNegotiable = props.CoTheThoaThuan; 
  if (sqlNegotiable === undefined) sqlNegotiable = props.coTheThoaThuan;
  if (sqlNegotiable === undefined) sqlNegotiable = props.negotiable;

  // Xử lý giá trị: Chấp nhận Boolean true hoặc chuỗi "True"/"true"
  const isNegotiable = 
    sqlNegotiable === true || 
    String(sqlNegotiable).toLowerCase() === "true";

  // --- PHẦN 2: XỬ LÝ DỮ LIỆU TỪ MONGODB (JSON) ---
  let mongoSpecs = {};
  try {
    if (detailsJson) {
      mongoSpecs = typeof detailsJson === "string" ? JSON.parse(detailsJson) : detailsJson;
    }
  } catch (error) {
    console.error("Lỗi parse JSON:", error);
    mongoSpecs = {};
  }
  
  // Lọc bỏ các key trùng lặp trong JSON (để ưu tiên dữ liệu SQL)
  const { 
    TinhTrang, tinhTrang, tinh_trang, Condition, condition, 
    CoTheThoaThuan, coTheThoaThuan, co_the_thoa_thuan, Negotiable, negotiable,
    ...displaySpecs 
  } = mongoSpecs;


  // --- PHẦN 3: ĐIỀU KIỆN HIỂN THỊ ---
  // Nếu không có Tình trạng VÀ không có thông số chi tiết -> Ẩn luôn
  if (!sqlCondition && Object.keys(displaySpecs).length === 0) return null;

  // --- PHẦN 4: HÀM FORMAT HIỂN THỊ ---
  const formatCondition = (val) => {
    if (!val) return "Không xác định";
    // Mapping dữ liệu từ "DaSuDung" -> "Đã sử dụng"
    if (val === "Moi" || val === "New" || val === "new") return "Mới";
    if (val === "DaSuDung" || val === "Used" || val === "used") return "Đã sử dụng";
    return val;
  };

  const labelMapping = {
    "Hang": "Hãng",
    "DongMay": "Dòng máy",
    "MauSac": "Màu sắc",
    "DungLuong": "Dung lượng",
    "BaoHanh": "Bảo hành",
    "XuatXu": "Xuất xứ",
    "Ram": "RAM",
    "Cpu": "Vi xử lý",
    "OCung": "Ổ cứng"
  };

  return (
    <div className={styles.specsContainer}>
      <h3 className={styles.specsTitle}>Thông tin chi tiết</h3>

      <div className={styles.specsTable}>
        
        {/* 1. HIỂN THỊ TÌNH TRẠNG (Từ SQL) */}
        {sqlCondition && (
          <div className={styles.specRow}>
            <span className={styles.specLabel}>Tình trạng</span>
            <span className={styles.specValue}>{formatCondition(sqlCondition)}</span>
          </div>
        )}

        {/* 2. HIỂN THỊ THƯƠNG LƯỢNG (Từ SQL) */}
        <div className={styles.specRow}>
          <span className={styles.specLabel}>Thương lượng</span>
          <span className={styles.specValue}>
            {isNegotiable ? "Có thể thương lượng" : "Không thương lượng"}
          </span>
        </div>

        {/* 3. HIỂN THỊ CÁC THÔNG SỐ KHÁC (Từ MongoDB) */}
        {Object.entries(displaySpecs).map(([key, value]) => {
          // Bỏ qua giá trị rỗng
          if (value === null || value === undefined || value === "") return null;
          
          return (
            <div key={key} className={styles.specRow}>
              <span className={styles.specLabel}>
                {labelMapping[key] || key}
              </span>
              <span className={styles.specValue}>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PostTechnicalSpecs;