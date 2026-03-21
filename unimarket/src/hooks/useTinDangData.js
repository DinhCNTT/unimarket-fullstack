// src/hooks/useTinDangData.js
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

/**
 * Hook tổng quát để fetch tin đăng nhà trọ / chợ chung.
 *
 * @param {string} activeTab       - "danhchoban" | "moinhat"
 * @param {string} categoryGroup   - VD: "nhà trọ", "điện thoại"
 * @param {object} filters         - Bộ lọc nâng cao (tùy chọn):
 *   {
 *     priceMin:   number,
 *     priceMax:   number,
 *     areaMin:    number,
 *     areaMax:    number,
 *     roomTypes:  string[],   // VD: ["phòng trọ", "chung cư mini"]
 *     amenities:  string[],   // VD: ["WiFi", "Máy lạnh"]
 *     sortBy:     string,     // "newest" | "price_asc" | "price_desc"
 *   }
 */
export const useTinDangData = (activeTab, categoryGroup, filters = {}) => {
  const [posts, setPosts] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, token } = useContext(AuthContext);

  const getAuthToken = () => user?.token || token;
  const isLoggedIn = !!(user && getAuthToken());

  // --- 1. Fetch Posts ---
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let url = "http://localhost:5133/api/tindang/get-posts";
        const params = {};

        if (categoryGroup) {
          params.categoryGroup = categoryGroup;
        }

        if (activeTab === "danhchoban") {
          url = "http://localhost:5133/api/tindang/get-recommended-posts";
        }

        params.limit = 20;

        // ── Bộ lọc nâng cao (Phase 2) ──────────────────────────────────
        if (filters.priceMin != null) params.priceMin = filters.priceMin;
        if (filters.priceMax != null) params.priceMax = filters.priceMax;
        if (filters.areaMin != null) params.areaMin = filters.areaMin;
        if (filters.areaMax != null) params.areaMax = filters.areaMax;
        if (filters.sortBy) params.sortBy = filters.sortBy;

        // Mảng roomTypes / amenities -> gửi multi-value params
        const queryParams = new URLSearchParams(params);
        if (Array.isArray(filters.roomTypes) && filters.roomTypes.length > 0) {
          filters.roomTypes.forEach(t => queryParams.append("roomType", t));
        }
        if (Array.isArray(filters.amenities) && filters.amenities.length > 0) {
          filters.amenities.forEach(a => queryParams.append("amenity", a));
        }

        const fullUrl = `${url}?${queryParams.toString()}`;

        const authToken = getAuthToken();
        const config = authToken
          ? { headers: { Authorization: `Bearer ${authToken}` } }
          : {};

        const response = await axios.get(fullUrl, config);
        const dataTraVe = response.data;

        let listPosts = dataTraVe.Data || dataTraVe.data;
        if (!listPosts && Array.isArray(dataTraVe)) {
          listPosts = dataTraVe;
        }

        setPosts(Array.isArray(listPosts) ? listPosts : []);
      } catch (error) {
        console.error("❌ Error fetching posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab, user, categoryGroup, JSON.stringify(filters)]);

  // --- 2. Fetch Saved IDs ---
  useEffect(() => {
    const fetchSaved = async () => {
      const authToken = getAuthToken();
      if (isLoggedIn && authToken) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (Array.isArray(res.data)) {
            setSavedIds(res.data.map((post) => post.maTinDang));
          }
        } catch (error) {
          console.error("Error fetching saved posts:", error);
        }
      }
    };
    fetchSaved();
  }, [user, token]);

  // --- 3. Toggle Save ---
  const handleToggleSave = async (postId, isSaved) => {
    const authToken = getAuthToken();
    if (!isLoggedIn || !authToken) {
      toast.error("Bạn cần đăng nhập để lưu tin.");
      return;
    }

    try {
      if (isSaved) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${postId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setSavedIds((prev) => prev.filter((id) => id !== postId));
        toast.success("Đã bỏ lưu tin đăng.");
      } else {
        await axios.post(
          `http://localhost:5133/api/yeuthich/luu/${postId}`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setSavedIds((prev) => [...prev, postId]);
        toast.success("Đã lưu tin đăng! ❤️");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
      toast.error(msg);
    }
  };

  return { posts, savedIds, isLoggedIn, handleToggleSave, loading };
};