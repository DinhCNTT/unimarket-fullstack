import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { VideoHubContext } from "../context/VideoHubContext";

export const useVideoInteractions = (video, currentIndex) => {
  const { user, token } = useContext(AuthContext);
  const { videoConnection } = useContext(VideoHubContext);

  // State
  const [fullVideo, setFullVideo] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [soNguoiLuu, setSoNguoiLuu] = useState(0);

  const iconCircleRef = useRef(null);
  const maTinDang = video?.maTinDang;

  // 1️⃣ Lấy dữ liệu ban đầu
  useEffect(() => {
    if (!maTinDang) return;
    
    // Set dữ liệu ban đầu từ props để hiển thị ngay
    setFullVideo(video);
    // Nếu props có sẵn thông tin save, set luôn (nếu có logic truyền save từ cha)
    // setIsSaved(video.isSaved); 

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch chi tiết video (để lấy số tym, isLiked mới nhất từ DB)
    axios.get(`http://localhost:5133/api/video/${maTinDang}`, { headers })
      .then((res) => setFullVideo(res.data))
      .catch((err) => console.error("Lỗi fetch video:", err));

    // Fetch thông tin save
    axios.get(`http://localhost:5133/api/video/${maTinDang}/savedinfo`, { headers })
      .then((res) => {
        setIsSaved(res.data.isSaved);
        setSoNguoiLuu(res.data.soNguoiLuu);
      })
      .catch((err) => console.error("Lỗi fetch saved:", err));
  }, [maTinDang, token]); // Bỏ currentIndex để tránh fetch lại ko cần thiết

  // 2️⃣ SignalR Realtime (Đã sửa logic Dependency)
  useEffect(() => {
    if (!videoConnection || !maTinDang || videoConnection.state !== "Connected") return;

    // --- Xử lý Like ---
    const handleUpdateLike = (tinDangId, count, likedByCurrentUser) => {
      if (tinDangId === maTinDang) {
        setFullVideo((prev) => {
            // Nếu backend không trả về likedByCurrentUser (undefined), giữ nguyên state cũ
            const newIsLiked = likedByCurrentUser !== undefined ? likedByCurrentUser : prev?.isLiked;
            return {
                ...prev,
                soTym: count,
                isLiked: newIsLiked 
            };
        });
      }
    };

    // --- Xử lý Save ---
    const handleUpdateSave = (tinDangId, count, savedByCurrentUser) => {
      if (tinDangId === maTinDang) {
        setSoNguoiLuu(count);
        // Nếu backend không trả về savedByCurrentUser, giữ nguyên state cũ
        if (savedByCurrentUser !== undefined) {
            setIsSaved(savedByCurrentUser);
        }
      }
    };

    videoConnection.on("UpdateLikeCount", handleUpdateLike);
    videoConnection.on("UpdateSaveCount", handleUpdateSave);

    return () => {
      videoConnection.off("UpdateLikeCount", handleUpdateLike);
      videoConnection.off("UpdateSaveCount", handleUpdateSave);
    };
  }, [videoConnection, maTinDang]); // ⚠️ QUAN TRỌNG: KHÔNG ĐƯỢC ĐỂ fullVideo VÀO ĐÂY

  // 3️⃣ Xử lý Like (Có Optimistic Update)
  const handleLike = async (showHeartCallback) => {
    if (!user || !token) {
      toast.error("Bạn cần đăng nhập để tym video!");
      return;
    }

    // 🔥 OPTIMISTIC UPDATE: Cập nhật UI ngay lập tức
    const previousLikedState = fullVideo?.isLiked;
    const previousCount = fullVideo?.soTym || 0;

    // Hiệu ứng tim bay
    if (!previousLikedState) {
        showHeartCallback?.();
        if (iconCircleRef.current) {
          const circle = document.createElement("div");
          circle.className = "heart-pulse-circle";
          iconCircleRef.current.appendChild(circle);
          setTimeout(() => circle.remove(), 600);
        }
    }

    // Set state giả lập ngay lập tức
    setFullVideo(prev => ({
        ...prev,
        isLiked: !previousLikedState,
        soTym: previousLikedState ? previousCount - 1 : previousCount + 1
    }));

    try {
      await axios.post(
        `http://localhost:5133/api/video/${maTinDang}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Không cần làm gì thêm, SignalR sẽ chốt hạ dữ liệu cuối cùng sau
    } catch (err) {
      console.error("Lỗi like:", err);
      toast.error("Lỗi khi tym video.");
      // Rollback nếu lỗi
      setFullVideo(prev => ({
          ...prev,
          isLiked: previousLikedState,
          soTym: previousCount
      }));
    }
  };

  // 4️⃣ Xử lý Save (Có Optimistic Update)
  const handleToggleSave = async () => {
    if (!user || !token) {
      toast.error("Bạn cần đăng nhập để lưu video!");
      return;
    }

    // 🔥 OPTIMISTIC UPDATE
    const previousSavedState = isSaved;
    const previousCount = soNguoiLuu;

    setIsSaved(!previousSavedState);
    setSoNguoiLuu(previousSavedState ? previousCount - 1 : previousCount + 1);

    try {
      const { data } = await axios.post(
        `http://localhost:5133/api/video/ToggleSave`,
        { maTinDang },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Hiển thị toast dựa trên kết quả thật từ server
      toast.success(data.saved ? "Đã lưu video!" : "Đã bỏ lưu.");
    } catch (err) {
      console.error("Lỗi save:", err);
      toast.error("Không thể lưu video.");
      // Rollback
      setIsSaved(previousSavedState);
      setSoNguoiLuu(previousCount);
    }
  };

  return {
    fullVideo,
    isLiked: fullVideo?.isLiked || false,
    soTym: fullVideo?.soTym || 0,
    isSaved,
    soNguoiLuu,
    iconCircleRef,
    handleLike,
    handleToggleSave,
  };
};