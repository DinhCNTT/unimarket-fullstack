// src/utils/formatters.js

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) return "";

  const formattedValue = new Intl.NumberFormat('vi-VN', { 
    minimumFractionDigits: 0, 
  }).format(price);

  return formattedValue + ' đ';
};

export const getMediaUrl = (mediaUrl) => {
  if (!mediaUrl) return "";
  if (mediaUrl.startsWith("http")) return mediaUrl;
  // Sử dụng biến môi trường
  return `${import.meta.env.VITE_API_URL}${mediaUrl}`;
};