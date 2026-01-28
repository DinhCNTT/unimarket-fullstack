import axios from "axios";

const API_URL = "http://localhost:5133/api/auth";

// Đăng ký tài khoản
const register = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { email, password });
    return response.data;
  } catch (error) {
    console.error("Đăng ký thất bại:", error.response?.data || error.message);
    throw error;
  }
};

// Đăng nhập và lưu token cùng thông tin người dùng
const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });

    if (response.data.token) {
      const user = response.data;

      // Lưu thông tin vào localStorage
      localStorage.setItem("token", user.token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userFullName", user.fullName || "");
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userPhoneNumber", user.phoneNumber || "");

      // ✅ Lưu avatarUrl nếu có
      if (user.avatarUrl) {
        localStorage.setItem("userAvatar", user.avatarUrl);
      }
    }

    return response.data;
  } catch (error) {
    console.error("Đăng nhập thất bại:", error.response?.data || error.message);
    throw error;
  }
};

// Gửi lại mail xác minh email
const sendEmailVerification = async (userId) => {
  try {
    const response = await axios.post(`${API_URL}/send-email-verification`, { userId });
    return response.data;
  } catch (error) {
    console.error("Gửi mail xác minh thất bại:", error.response?.data || error.message);
    throw error;
  }
};

// Đăng xuất, xóa thông tin
const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userFullName");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userPhoneNumber");
  localStorage.removeItem("userAvatar"); // ✅ Xóa avatar
};

// Lấy thông tin người dùng từ localStorage
const getUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user")) || null;
    const avatarUrl = localStorage.getItem("userAvatar") || null;

    if (user) {
      return {
        ...user,
        avatarUrl, // ✅ Gắn avatarUrl vào user
      };
    }

    return null;
  } catch (error) {
    console.error("Lỗi khi lấy user từ localStorage:", error);
    return null;
  }
};

const getUserId = () => localStorage.getItem("userId");

const isAdmin = () => getUser()?.role === "Admin";

const isStaff = () => getUser()?.role === "Staff";

const isAuthenticated = () => !!getUser();

export default {
  register,
  login,
  logout,
  getUser,
  getUserId,
  isAdmin,
  isStaff,
  isAuthenticated,
  sendEmailVerification,
};
