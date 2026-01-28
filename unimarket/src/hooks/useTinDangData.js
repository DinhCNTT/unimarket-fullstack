// src/hooks/useTinDangData.js
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

// ✅ 1. Nhận đủ 2 tham số: activeTab và categoryGroup
export const useTinDangData = (activeTab, categoryGroup) => {
  // ✅ 2. State khởi tạo mảng rỗng (Logic an toàn từ Code Tui)
  const [posts, setPosts] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const { user, token } = useContext(AuthContext);

  const getAuthToken = () => user?.token || token;
  const isLoggedIn = !!(user && getAuthToken());

  // --- 1. Fetch Posts ---
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Mặc định gọi API lấy tin thường
        let url = "http://localhost:5133/api/tindang/get-posts";
        
        // ✅ 3. Khởi tạo Params (Kết hợp logic cả 2)
        const params = {};

        // (Logic từ Code Bạn): Nếu có categoryGroup, thêm vào params
        if (categoryGroup) {
          params.categoryGroup = categoryGroup;
        }

        // (Logic từ Code Tui + Code Bạn): Xử lý tab "Dành cho bạn"
        if (activeTab === "danhchoban") {
          // Chuyển sang API đề xuất
          url = "http://localhost:5133/api/tindang/get-recommended-posts";
          
          // 🔥 LƯU Ý: Nếu backend của bạn hỗ trợ lọc category cho cả tin đề xuất (như code C# trước đó)
          // thì logic này sẽ hoạt động hoàn hảo: Vừa đề xuất + Vừa đúng danh mục.
        }

        // (Logic từ Code Tui): Luôn gửi Limit để đảm bảo backend kiểu mới trả dữ liệu phân trang đúng
        params.limit = 20;

        // Tạo chuỗi query (VD: ?limit=20&categoryGroup=iphone)
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = `${url}?${queryString}`;

        const authToken = getAuthToken();
        const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};

        console.log("🚀 Fetching URL:", fullUrl);

        const response = await axios.get(fullUrl, config);
        
        // ========================================================
        // 🔥 4. XỬ LÝ DỮ LIỆU ĐA NĂNG (Logic "Bất tử" từ Code Tui)
        // ========================================================
        const dataTraVe = response.data;
        console.log("📦 Dữ liệu Server trả về:", dataTraVe);

        // Bước 1: Thử lấy mảng từ thuộc tính .Data (backend kiểu mới) hoặc .data (thường)
        let listPosts = dataTraVe.Data || dataTraVe.data;

        // Bước 2: Nếu không có .Data/.data, kiểm tra xem chính dataTraVe có phải là mảng không (backend kiểu cũ)
        if (!listPosts && Array.isArray(dataTraVe)) {
            listPosts = dataTraVe;
        }

        // Bước 3: Set State an toàn tuyệt đối
        if (Array.isArray(listPosts)) {
            setPosts(listPosts);
        } else {
            console.warn("⚠️ API không trả về danh sách hợp lệ, set mảng rỗng để tránh crash.");
            setPosts([]); 
        }

      } catch (error) {
        console.error("❌ Error fetching posts:", error);
        setPosts([]); // Lỗi thì set rỗng
      }
    };

    fetchPosts();
    
    // ✅ 5. Dependency Array: Thêm categoryGroup để reload khi chọn danh mục (Logic từ Code Bạn)
  }, [activeTab, user, categoryGroup]); 

  // --- 2. Fetch Saved IDs (Giữ nguyên) ---
  useEffect(() => {
    const fetchSaved = async () => {
      const authToken = getAuthToken();
      if (isLoggedIn && authToken) {
        try {
          const res = await axios.get("http://localhost:5133/api/yeuthich/danh-sach", {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          // Check kỹ xem có phải mảng không trước khi map
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

  // --- 3. Toggle Save Logic (Giữ nguyên) ---
  const handleToggleSave = async (postId, isSaved) => {
    const authToken = getAuthToken();
    if (!isLoggedIn || !authToken) {
      alert("Bạn cần đăng nhập để lưu tin.");
      return;
    }

    try {
      if (isSaved) {
        await axios.delete(`http://localhost:5133/api/yeuthich/xoa/${postId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setSavedIds((prev) => prev.filter((id) => id !== postId));
        alert("Đã gỡ lưu tin đăng.");
      } else {
        await axios.post(`http://localhost:5133/api/yeuthich/luu/${postId}`, {}, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setSavedIds((prev) => [...prev, postId]);
        alert("Đã lưu tin đăng.");
      }
    } catch (err) {
      let msg = "Có lỗi xảy ra, vui lòng thử lại.";
      if (err.response?.data?.message) {
         msg = err.response.data.message;
      }
      alert(msg);
    }
  };

  return { posts, savedIds, isLoggedIn, handleToggleSave };
};