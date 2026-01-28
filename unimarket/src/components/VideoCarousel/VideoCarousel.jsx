import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaHeart } from 'react-icons/fa';
import { MdOutlineInsertPhoto } from "react-icons/md";
import styles from './VideoCarousel.module.css';

// 🔥 1. Nhận thêm props: savedIds, onToggleSave, isLoggedIn
const VideoCarousel = ({ categoryGroup, subCategory, savedIds = [], onToggleSave, isLoggedIn }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const videoRefs = useRef([]);
  const navigate = useNavigate();

  // --- HÀM TÍNH THỜI GIAN ---
  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    const intervals = [
      { label: "năm", seconds: 31536000 },
      { label: "tháng", seconds: 2592000 },
      { label: "ngày", seconds: 86400 },
      { label: "giờ", seconds: 3600 },
      { label: "phút", seconds: 60 },
      { label: "giây", seconds: 1 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count > 0) return `${count} ${interval.label} trước`;
    }
    return "Vừa xong";
  };

  // --- FETCH VIDEOS ---
  useEffect(() => {
    const fetchVideos = async () => {
      if (!categoryGroup && !subCategory) return;

      try {
        const params = new URLSearchParams({
          page: 1,
          pageSize: 10,
          HasVideo: true, 
        });

        if (subCategory) {
            params.append("SubCategory", subCategory);
            if (categoryGroup) params.append("CategoryGroup", categoryGroup);
        } else if (categoryGroup) {
            params.append("CategoryGroup", categoryGroup);
        }

        const url = `http://localhost:5133/api/tindang/get-posts?${params.toString()}`;
        const res = await axios.get(url);

        let rawData = [];
        if (Array.isArray(res.data)) {
            rawData = res.data;
        } else if (res.data && (res.data.Data || res.data.data)) {
            rawData = res.data.Data || res.data.data;
        }

        const mappedVideos = rawData.map(item => ({
            maTinDang: item.maTinDang || item.MaTinDang,
            videoUrl: item.videoUrl || item.VideoUrl,
            tieuDe: item.tieuDe || item.TieuDe,
            gia: item.gia || item.Gia,
            tinhThanh: item.tinhThanh || item.TinhThanh || item.quanHuyen || item.QuanHuyen,
            tinhTrang: item.tinhTrang || item.TinhTrang,
            anhCount: (item.images?.length || item.Images?.length) || 1,
            ngayDang: item.ngayDang || item.NgayDang
        }));

        if (mappedVideos.length > 0) {
           setVideos(mappedVideos);
        } else {
           setVideos([]); 
        }
      } catch (err) {
        console.error("Lỗi tải video carousel:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [categoryGroup, subCategory]);

  // --- SCROLL & MOUSE HANDLERS ---
  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = 240 * 4; 
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseEnter = (index) => {
    const video = videoRefs.current[index];
    if (video) { video.style.opacity = 1; video.currentTime = 0; video.play().catch(() => {}); }
  };

  const handleMouseLeave = (index) => {
    const video = videoRefs.current[index];
    if (video) { video.pause(); video.style.opacity = 0; }
  };

  const handleVideoClick = (video) => {
    navigate(`/video/${video.maTinDang}`, { state: { seedVideo: video } }); 
  };

  const getCloudinaryThumbnail = (videoUrl) => {
    if (!videoUrl || !videoUrl.includes('/upload/')) return '';
    return videoUrl.replace('/upload/', '/upload/so_2,q_auto/').replace('.mp4', '.jpg'); 
  };

  // 🔥 2. HÀM XỬ LÝ CLICK TIM (Giống ProductItem)
  const handleSaveClick = (e, videoId, isSaved) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn không cho click vào video
    if (onToggleSave) {
      onToggleSave(videoId, isSaved);
    }
  };

  if (!loading && videos.length === 0) return null;
  if (loading && videos.length === 0) return null; 

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.header}>
        <h3>Video nổi bật: {subCategory || categoryGroup}</h3>
        <p>Xem video thực tế trước khi mua</p>
        <button className={styles.viewMoreBtn} onClick={() => navigate('/video')}>Xem tất cả</button>
      </div>

      <div className={styles.carouselWrapper}>
        <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={() => scroll('left')}>
          <FaChevronLeft />
        </button>

        <div className={styles.videoList} ref={scrollRef}>
          {videos.map((video, index) => {
            // 🔥 3. Kiểm tra trạng thái lưu
            const isSaved = savedIds?.includes(video.maTinDang);

            return (
              <div 
                key={video.maTinDang} 
                className={styles.card} 
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={() => handleMouseLeave(index)}
                onClick={() => handleVideoClick(video)}
              >
                <div className={styles.thumbnail}>
                  <img 
                    src={getCloudinaryThumbnail(video.videoUrl)} 
                    alt={video.tieuDe} 
                    className={styles.thumbnailImg} 
                  />
                  <video 
                    ref={(el) => (videoRefs.current[index] = el)} 
                    src={video.videoUrl} 
                    muted 
                    className={styles.hoverVideo} 
                  />

                  <div className={styles.playOverlay}>▶</div>

                  {video.ngayDang && (
                      <div className={styles.postTime}>
                          {timeAgo(video.ngayDang)}
                      </div>
                  )}

                  <div className={styles.photoCount}>
                    <MdOutlineInsertPhoto size={14} /> {video.anhCount}
                  </div>

                  {/* 🔥 4. Render Nút Tim (Có điều kiện đăng nhập) */}
                  {isLoggedIn && (
                    <div 
                        className={`${styles.saveHeartBtn} ${isSaved ? styles.saved : ''}`}
                        onClick={(e) => handleSaveClick(e, video.maTinDang, isSaved)}
                        title={isSaved ? "Bỏ lưu" : "Lưu tin"}
                    >
                        <FaHeart />
                    </div>
                  )}
                </div>

                <div className={styles.info}>
                  <h4 className={styles.videoTitle}>{video.tieuDe}</h4>
                  <div className={styles.subInfo}>
                    {video.tinhTrang === 'Moi' ? 'Mới' : 'Đã sử dụng'}
                  </div>
                  <div className={styles.price}>
                    {video.gia?.toLocaleString('vi-VN')} đ
                  </div>
                  <div className={styles.location}>
                    {video.tinhThanh}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={() => scroll('right')}>
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default VideoCarousel;