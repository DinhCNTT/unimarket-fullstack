// src/services/api.js
import axios from "axios";

// ✅ 1. Sử dụng biến môi trường VITE_API_URL bạn vừa tạo
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ----------------------------------------------------------------
// ✅ 2. Interceptor cho REQUEST (Tự động đính kèm token)
// Lấy từ cả 2 phiên bản của bạn, ưu tiên sessionStorage
// ----------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const sessionToken = sessionStorage.getItem("token");
    const localToken = localStorage.getItem("token");

    // Sử dụng token nào tìm thấy (ưu tiên session)
    const token = sessionToken || localToken;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------
// ✅ 3. Interceptor cho RESPONSE (Tự động xử lý lỗi 401)
// Xử lý khi token hết hạn hoặc không hợp lệ
// ----------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    // Request thành công, cứ trả về
    return response;
  },
  (error) => {
    // Chỉ xử lý nếu có response lỗi từ server và status là 401
    // ⚠️ Nhưng không phải từ endpoint /viewhistory/* hoặc /trendingkeyword/* để tránh trigger 404->401
    if (error.response && error.response.status === 401 && error.config) {
      // Lấy URL của request để kiểm tra
      const url = error.config.url || "";

      // Không xử lý 401 cho các endpoint mới (vì chúng chỉ là 404)
      const shouldHandle401 = !url.includes("/viewhistory/") && !url.includes("/trendingkeyword/");

      if (shouldHandle401) {
        console.error("Lỗi 401: Unauthorized. Token hết hạn hoặc không hợp lệ.");
      // Xóa tất cả thông tin đăng nhập ở CẢ hai nơi
      // 1. Xóa từ sessionStorage
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userFullName");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("userPhoneNumber");
      sessionStorage.removeItem("userAvatar");
      sessionStorage.removeItem("token");

      // 2. Xóa từ localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userFullName");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userPhoneNumber");
      localStorage.removeItem("userAvatar");
      localStorage.removeItem("token");

      // Kích hoạt 'logout_signal' để các tab khác cũng tự động đăng xuất
      localStorage.setItem("logout_signal", Date.now().toString());
      setTimeout(() => {
        localStorage.removeItem("logout_signal");
      }, 100);

      // Thông báo và chuyển hướng
      alert("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.");

      // Chuyển hướng về trang đăng nhập
      window.location.href = "/login";
    }
  }
    // Trả về lỗi để các hàm .catch() khác có thể xử lý (nếu không phải lỗi 401)
    return Promise.reject(error);
  }
);

export default api;
