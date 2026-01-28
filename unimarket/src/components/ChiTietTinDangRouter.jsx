import React from "react";
import { useParams } from "react-router-dom";
import { usePostDetails } from "../hooks/usePostDetails";
import ChiTietTinDang from "./ChiTietTinDang";
import ChiTietTinDangNhaTro from "./ChiTietTinDangNhaTro";

/**
 * Router component thông minh:
 * - Dùng usePostDetails để lấy dữ liệu (hook này fetch qua endpoint đúng)
 * - Check danh mục cha từ dữ liệu
 * - Nếu là "Nhà trọ" → Render ChiTietTinDangNhaTro
 * - Nếu không → Render ChiTietTinDang cũ
 */
const ChiTietTinDangRouter = ({ onOpenChat }) => {
  const { id } = useParams();
  
  // Dùng hook để fetch dữ liệu (endpoint đúng)
  const { post, loading } = usePostDetails(id, onOpenChat);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Đang tải...</div>;
  }

  if (!post) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Tin đăng không tồn tại</div>;
  }

  // Debug: log dữ liệu
  console.log("🔍 Full post object:", post);
  console.log("🔍 post.danhMucCha:", post.danhMucCha);
  console.log("🔍 post.DanhMucCha:", post.DanhMucCha);
  console.log("🔍 post.category:", post.category);
  console.log("🔍 post.danhmuc:", post.danhmuc);

  // Check danh mục cha - cần check cả trường hợp có khoảng trắng
  const danhMucCha = post.danhMucCha ? post.danhMucCha.toLowerCase().trim() : "";
  const isNhaTro = danhMucCha === "nhà trọ" || danhMucCha.includes("nhà trọ");

  console.log("🏠 isNhaTro:", isNhaTro);

  // Render component phù hợp dựa trên danh mục
  if (isNhaTro) {
    console.log("✅ Rendering ChiTietTinDangNhaTro");
    return <ChiTietTinDangNhaTro onOpenChat={onOpenChat} initialPost={post} />;
  } else {
    console.log("✅ Rendering ChiTietTinDang");
    return <ChiTietTinDang onOpenChat={onOpenChat} />;
  }
};

export default ChiTietTinDangRouter;
