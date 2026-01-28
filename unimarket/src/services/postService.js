// src/services/postService.js
import api from "./api";

/**
 * Lấy chi tiết tin đăng và các tin tương tự
 * @param {string} id - ID của tin đăng
 */
export const getPostAndSimilar = async (id) => {
  try {
    // Dùng 'api' (đã có baseURL) thay vì 'axios'
    const response = await api.get(`/tindang/get-post-and-similar/${id}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy tin đăng:", error);
    throw error; // Ném lỗi để hook/component có thể bắt
  }
};

/**
 * Bắt đầu một cuộc trò chuyện mới
 * @param {object} chatData - { MaNguoiDung1, MaNguoiDung2, MaTinDang }
 */
export const startChat = async (chatData) => {
  try {
    // Dùng 'api' (đã có baseURL) thay vì 'axios'
    const response = await api.post("/chat/start", chatData);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi bắt đầu chat:", error);
    throw error; // Ném lỗi để hook/component có thể bắt
  }
};

// Sau này nếu có thêm API (ví dụ: lưu tin, báo cáo tin...),
// bạn chỉ cần thêm các hàm 'export const' tương tự ở đây.