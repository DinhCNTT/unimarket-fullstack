import React from "react";
import { useChat } from "./context/ChatContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; // ✅ Đảm bảo đường dẫn đúng
import Swal from "sweetalert2";
import styles from './ModuleChatCss/ChatProductBanner.module.css';

const ChatProductBanner = () => {
  const { infoTinDang } = useChat();
  const navigate = useNavigate();

  const getFullImageUrl = (url) => {
    if (!url) return "/default-image.png";
    return url.startsWith("http") ? url : `http://localhost:5133${url}`;
  };

  const handleImageClick = async () => {
    if (infoTinDang.isPostDeleted) {
      Swal.fire({
        icon: "info", title: "Tin đăng đã bị xóa",
        text: "Người bán đã gỡ tin này. Cuộc trò chuyện vẫn tiếp tục.",
        confirmButtonText: "OK", confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      const res = await api.get(`/TinDang/get-post/${infoTinDang.maTinDang}`);
      if (!res.data) {
        Swal.fire("Lỗi", "Không nhận được dữ liệu tin đăng.", "error");
        return;
      }
      navigate(`/tin-dang/${res.data.maTinDang}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        Swal.fire({
          icon: "error", title: "Tin đăng không tồn tại",
          text: "Người bán đã gỡ tin này sau khi giao dịch xong.",
          confirmButtonText: "OK", confirmButtonColor: "#d33",
        });
      } else {
        Swal.fire("Lỗi", "Không thể kiểm tra trạng thái tin đăng.", "error");
        console.error(err);
      }
    }
  };

  return (
    <div
      className={styles.productBanner}
      onClick={handleImageClick}
      data-deleted={infoTinDang.isPostDeleted}
    >
      <div className={styles.productInfo}>
        <img
          src={getFullImageUrl(infoTinDang.anh)}
          alt="Ảnh tin đăng"
          className={styles.productImage}
        />
        <div className={styles.productMeta}>
          <span className={styles.productName}>
            {infoTinDang.isPostDeleted
              ? `${infoTinDang.tieuDe} `
              : infoTinDang.tieuDe}
          </span>
          <span className={styles.productPrice}>
            {infoTinDang.gia.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
          </span>
        </div>
        {infoTinDang.isPostDeleted && (
          <span className={styles.deletedBadge}>
            Tin đã xóa
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(ChatProductBanner); // Bọc trong React.memo