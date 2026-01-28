// src/pages/ViewHistoryPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import styles from "./ViewHistoryPage.module.css";
import TopNavbar from "../../components/TopNavbar/TopNavbar";
import ViewHistoryListItem from "./ViewHistoryListItem";
import { viewHistoryService } from "../../services/viewHistoryService";
import { AuthContext } from "../../context/AuthContext";

const PAGE_SIZE = 12;

const ViewHistoryPage = () => {
  const [viewHistory, setViewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [savedIds, setSavedIds] = useState([]);

  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const isLoggedIn = !!(user && token);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Load saved posts
    if (isLoggedIn) {
      loadSavedIds();
    }

    fetchViewHistory(currentPage);
  }, [currentPage, navigate, isLoggedIn]);

  const fetchViewHistory = async (page) => {
    try {
      setLoading(true);
      const data = await viewHistoryService.getViewHistoryPaged(page, PAGE_SIZE);

      // Transform images from {url: ...} to array of strings
      const transformedItems = (data.items || []).map(item => ({
        ...item,
        images: item.images ? item.images.map(img => img.url || img) : []
      }));

      setViewHistory(transformedItems);
      setTotalCount(data.totalCount || 0);
      setError(null);
    } catch (err) {
      console.error("[ViewHistoryPage] Error fetching view history:", err);
      if (err.response?.status !== 401) {
        setError("Không thể tải lịch sử xem. Vui lòng thử lại sau.");
      }
      setViewHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedIds = async () => {
    try {
      const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedIds(res.data.map((p) => p.maTinDang));
    } catch (err) {
      console.error("Lỗi tải danh sách yêu thích:", err);
    }
  };

  const handleToggleSave = (postId, wasSaved) => {
    if (wasSaved) {
      setSavedIds((prev) => prev.filter((id) => id !== postId));
    } else {
      setSavedIds((prev) => [...prev, postId]);
    }
  };

  const handleClearHistory = async () => {
    const result = await Swal.fire({
      title: "Xóa lịch sử xem?",
      text: "Bạn sẽ xóa toàn bộ lịch sử xem của mình. Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#999",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await viewHistoryService.clearViewHistory();
      setViewHistory([]);
      setTotalCount(0);
      setCurrentPage(1);
      setError(null);
      Swal.fire({
        title: "Thành công!",
        text: "Lịch sử xem đã được xóa.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error clearing history:", err);
      setError("Không thể xóa lịch sử. Vui lòng thử lại sau.");
      Swal.fire({
        title: "Lỗi!",
        text: "Không thể xóa lịch sử. Vui lòng thử lại sau.",
        icon: "error",
      });
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className={styles.page}>
      <TopNavbar />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>
            <h1>
              Lịch sử xem tin
              <span className={styles.infoIcon} data-tooltip="Hiển thị 30 tin đã xem gần nhất từ trước đến nay.">!</span>
            </h1>
            <span className={styles.count}>({totalCount} tin)</span>
          </div>

          {viewHistory.length > 0 && (
            <button className={styles.btnClear} onClick={handleClearHistory}>
              Xóa lịch sử
            </button>
          )}
        </div>

        {/* Error State */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Loading State */}
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Đang tải lịch sử xem...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && viewHistory.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>Chưa có lịch sử xem</h3>
            <p>Các tin đăng bạn xem sẽ được lưu lại ở đây</p>
          </div>
        )}

        {/* List of Posts */}
        {!loading && viewHistory.length > 0 && (
          <>
            <div className={styles.listContainer}>
              {viewHistory.map((post) => (
                <ViewHistoryListItem
                  key={post.maTinDang}
                  post={post}
                  isSaved={savedIds.includes(post.maTinDang)}
                  onToggleSave={handleToggleSave}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className={styles.pageBtn}
                >
                  ← Trước
                </button>

                <div className={styles.pageInfo}>
                  Trang {currentPage} / {totalPages}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className={styles.pageBtn}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewHistoryPage;