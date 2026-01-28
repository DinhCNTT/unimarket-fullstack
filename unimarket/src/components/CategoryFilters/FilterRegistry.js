//src/components/CategoryFilters/FilterRegistry.js
// Import các component bộ lọc con
import LocMoRongPhone from "./LocMoRongPhone";
// Sau này import thêm: import LocMoRongLaptop from "./LocMoRongLaptop";

// Bảng cấu hình: Mapping từ "Tên Danh Mục" sang "Component"
export const FILTER_COMPONENTS = {
    // Key phải trùng với tên bạn dùng trong Logic hoặc Database
    'Điện thoại': LocMoRongPhone,
    
    // Ví dụ sau này mở rộng:
    // 'Laptop': LocMoRongLaptop,
    // 'Bất động sản': LocMoRongNhaDat,
};