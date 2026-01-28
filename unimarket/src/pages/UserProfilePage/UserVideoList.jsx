import React, { useEffect, useState } from "react";
import axios from "axios";
import VideoGrid from "./VideoGrid";
import LoadingSpinner from "../../components/Common/LoadingSpinner/LoadingSpinner";
import EmptyState from "../../components/Common/EmptyState/EmptyState";
import { CiLock, CiHeart } from "react-icons/ci";

// Nhận thêm prop userId
const UserVideoList = ({ type, userId }) => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        // Base URL
        let url = type === "liked"
            ? "http://localhost:5133/api/Video/liked"
            : "http://localhost:5133/api/Video/saved";

        // QUAN TRỌNG: Nếu có userId, nối chuỗi query params
        if (userId) {
          url += `?userId=${userId}`;
        }

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        let data = res.data;

        // Xử lý ảnh bìa (giữ nguyên logic của bạn)
        data = data.map((v) => {
          const generatedThumb = v.videoUrl
            ? v.videoUrl.replace("/upload/", "/upload/so_1/").replace(".mp4", ".jpg")
            : null;
          return {
            ...v,
            anhBia: v.anhBia || v.thumbnailUrl || generatedThumb
          };
        });

        setVideos(data);
      } catch (err) {
        console.error(`Lỗi tải video ${type}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [type, userId]); // Thêm userId vào dependency để reload khi đổi profile

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center" }}><LoadingSpinner /></div>;

  if (videos.length === 0) {
    return (
      <div style={{ padding: "40px 0" }}>
        <EmptyState
          icon={type === "liked" ? <CiHeart /> : <CiLock />}
          title={type === "liked" ? "Chưa có video yêu thích" : "Chưa có video đã lưu"}
          subtitle="Danh sách này đang trống."
        />
      </div>
    );
  }

  return <VideoGrid videos={videos} />;
};

export default UserVideoList;