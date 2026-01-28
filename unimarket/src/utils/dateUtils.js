// src/utils/dateUtils.js  
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

export const formatRelativeTime = (dateInput) => {
  // 1. Kiểm tra nếu không có dữ liệu đầu vào
  if (!dateInput) return null;

  const date = new Date(dateInput);
  const now = new Date();

  // 2. Kiểm tra nếu date bị lỗi (Invalid Date) -> Trả về null ngay
  if (isNaN(date.getTime())) {
    console.warn("Ngày tháng không hợp lệ:", dateInput); // Log để bạn biết mà sửa Backend
    return null; 
  }

  const seconds = Math.floor((now - date) / 1000);

  // Xử lý các mốc thời gian
  if (seconds < 60) return "Vừa xong";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;

  const years = Math.floor(days / 365);
  return `${years} năm trước`;
};