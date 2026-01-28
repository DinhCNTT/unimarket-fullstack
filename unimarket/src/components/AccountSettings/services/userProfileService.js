import axios from "axios";

const API_BASE = "http://localhost:5133/api";

// 1. Lấy thông tin user
export const getUserProfile = (token) => {
  return axios.get(`${API_BASE}/userprofile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 2. Cập nhật thông tin cá nhân (Họ tên, SĐT, v.v.)
export const updateUserProfile = (token, data) => {
  return axios.put(`${API_BASE}/userprofile/update`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 3. Cập nhật email mới
export const updateEmail = (token, newEmail) => {
  return axios.put(
    `${API_BASE}/userprofile/email`,
    { newEmail },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// 4. Gửi mã xác minh (cho email)
export const sendVerificationCode = (token) => {
  return axios.post(`${API_BASE}/emailverification/send-code`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 5. Xác minh mã code
export const verifyCode = (token, email, code) => {
  return axios.post(
    `${API_BASE}/emailverification/verify-code`,
    { email, code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// 6. Upload avatar
export const uploadAvatar = (token, formData) => {
  return axios.post(`${API_BASE}/userprofile/upload-avatar`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 7. Xóa tài khoản vĩnh viễn
export const deleteAccount = (token) => {
  return axios.delete(`${API_BASE}/userprofile/delete`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getPrivacy = (token) => {
  return axios.get(`${API_BASE}/userprofile/privacy`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 9. Cập nhật trạng thái riêng tư (Bật/Tắt)
export const updatePrivacy = (token, isPrivateAccount) => {
  return axios.put(
    `${API_BASE}/userprofile/privacy`,
    { isPrivateAccount }, // Body gửi lên đúng format model PrivacyUpdateModel ở Backend
    { headers: { Authorization: `Bearer ${token}` } }
  );
};