import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaEye, FaTrash, FaBookmark } from "react-icons/fa";
import { toast } from "sonner";
import styles from "./SavedPostsDropdown.module.css";

const SavedPostsDropdown = ({ user, onClose }) => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedPosts();

    // Auto-close khi click ngoài hoặc scroll
    const handleClickOutside = (e) => {
      const dropdown = document.querySelector('[class*="SavedPostsDropdown"]');
      if (dropdown && !dropdown.contains(e.target)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const fetchSavedPosts = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        "http://localhost:5133/api/yeuthich/danh-sach",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Lấy tối đa 5 tin đầu
      const posts = response.data.slice(0, 5);
      setSavedPosts(posts);
      setTotalCount(response.data.length);
    } catch (error) {
      console.error("Lỗi lấy tin đã lưu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSavedPost = async (e, maTinDang) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5133/api/yeuthich/xoa/${maTinDang}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Xoá từ UI
      setSavedPosts(savedPosts.filter(p => p.maTinDang !== maTinDang));
      setTotalCount(totalCount - 1);
      toast.success("✅ Đã xoá tin đã lưu");
    } catch (error) {
      console.error("Lỗi xoá tin:", error);
      toast.error("❌ Lỗi xoá tin");
    }
  };

  const handleViewPost = (e, maTinDang) => {
    e.stopPropagation();
    onClose();
    navigate(`/tin-dang/${maTinDang}`);
  };

  const handleViewAll = () => {
    onClose();
    navigate("/tin-dang-da-luu");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMsg}>Đang tải...</div>
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyMsg}>
          💭 Bạn chưa lưu tin đăng nào
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}><FaBookmark style={{ marginRight: "8px", color: "#e74c3c" }} /> Tin Đã Lưu</h3>
        {totalCount > 5 && (
          <button className={styles.viewMoreBtn} onClick={handleViewAll} title="Xem tất cả">
            Xem thêm ({totalCount})
          </button>
        )}
      </div>

      {/* Danh sách 5 tin đầu tiên */}
      <div className={styles.postsList}>
        {savedPosts.map((post) => (
          <div key={post.maTinDang} className={styles.postItem}>
            {/* Ảnh tin đăng - bên trái */}
            <div className={styles.imageContainer}>
              {post.images && post.images.length > 0 && (
                <img
                  src={post.images[0]}
                  alt={post.tieuDe}
                  className={styles.postImage}
                />
              )}
              
              {/* Icon xem + xoá overlay */}
              <div className={styles.iconOverlay}>
                <button
                  className={styles.iconAction}
                  title="Xem tin"
                  onClick={(e) => handleViewPost(e, post.maTinDang)}
                >
                  <FaEye size={14} />
                </button>
                <button
                  className={styles.iconAction}
                  title="Xoá tin"
                  onClick={(e) => handleDeleteSavedPost(e, post.maTinDang)}
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>

            {/* Tên tin đăng - bên phải */}
            <p className={styles.postTitle}>{post.tieuDe}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedPostsDropdown;
