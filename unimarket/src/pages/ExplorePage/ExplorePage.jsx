// src/pages/ExplorePage/ExplorePage.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import VideoGridItem from '../../components/Explore/VideoGridItem';
import CategoryBar from '../../components/Explore/CategoryBar'; 
import styles from './ExplorePage.module.css';

// 1. Import TopNavbar
import TopNavbarUniMarket from '../../components/TopNavbarUniMarket';
// 2. Import CSS của TopNavbar
import '../../components/TopNavbarUniMarket.css';

const ExplorePage = () => {
    const [categories, setCategories] = useState([]);
    const [videos, setVideos] = useState([]);

    // State quản lý phân trang
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [selectedParentId, setSelectedParentId] = useState(0);

    const navigate = useNavigate();
    const observer = useRef();

    // 1. Lấy danh mục
    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await axios.get('http://localhost:5133/api/Video/explore/categories');
                if (Array.isArray(res.data)) {
                    setCategories(res.data);
                }
            } catch (error) {
                console.error("Lỗi lấy danh mục:", error);
            }
        };
        fetchCats();
    }, []);


    // 2. Hàm gọi API lấy video
    const fetchVideos = async (pageNumber, categoryId) => {
        setLoading(true);
        try {
            const url = `http://localhost:5133/api/Video/explore/videos?parentCategoryId=${categoryId}&page=${pageNumber}&pageSize=40`;
            const res = await axios.get(url);

            setVideos(prev => {
                if (pageNumber === 1) return res.data;
                return [...prev, ...res.data];
            });

            setHasMore(res.data.length === 40);
        } catch (error) {
            console.error("Lỗi tải video:", error);
        } finally {
            setLoading(false);
        }
    };

    // 3. Reset khi đổi danh mục
    useEffect(() => {
        setVideos([]);      
        setPage(1);         
        setHasMore(true);   
        fetchVideos(1, selectedParentId); 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedParentId]);

    // 4. Cuộn vô tận
    useEffect(() => {
        if (page > 1) {
            fetchVideos(page, selectedParentId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // 5. Setup Intersection Observer
    const lastVideoElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // --- PHẦN CHỈNH SỬA: LOGIC CLICK VIDEO ---
    const handleVideoClick = (id) => {
        // Tìm vị trí (index) của video được click trong danh sách hiện tại
        const index = videos.findIndex(v => v.maTinDang === id);

        // Điều hướng qua LikedVideoDetailViewer kèm theo State
        navigate(`/liked-video-detail/${id}`, {
            state: {
                videoList: videos,       // Truyền toàn bộ list để có thể lướt Next/Prev
                initialIndex: index,     // Bắt đầu phát từ video được click
                returnPath: '/explore'   // Khi ấn nút Back sẽ quay về trang Explore
            }
        });
    };
    // ------------------------------------------

    return (
        <div className={styles.pageWrapper}> {/* Wrapper bao quanh toàn bộ trang */}

            {/* --- PHẦN 1: NAVBAR BÊN TRÁI --- */}
            <div className={styles.sidebarSection}>
                <TopNavbarUniMarket />
            </div>

            {/* --- PHẦN 2: NỘI DUNG CHÍNH BÊN PHẢI --- */}
            {/* Đây là nơi có thanh trượt tùy chỉnh */}
            <div className={styles.mainContentSection} id="scrollableDiv">
                <div className={styles.container}>
                    {/* Sticky Header Danh mục */}
                    <CategoryBar 
                        categories={categories}
                        selectedId={selectedParentId}
                        onSelect={setSelectedParentId} 
                    />

                    {/* Grid Video */}
                    <div className={styles.gridContent}>
                        {videos.length > 0 ? (
                            videos.map((vid, index) => {
                                if (videos.length === index + 1) {
                                    return (
                                        <div ref={lastVideoElementRef} key={vid.maTinDang}>
                                            <VideoGridItem video={vid} onClick={handleVideoClick} />
                                        </div>
                                    );
                                } else {
                                    return <VideoGridItem key={vid.maTinDang} video={vid} onClick={handleVideoClick} />;
                                }
                            })
                        ) : (
                            !loading && <div className={styles.emptyState}>Không có video nào trong danh mục này.</div>
                        )}
                    </div>

                    {/* Loading Indicator */}
                    {loading && (
                        <div className={styles.loadingSpinner}>
                            <div className={styles.spinner}></div>
                        </div>
                    )}

                    {!hasMore && videos.length > 0 && (
                        <div className={styles.endMessage}>Đã hiển thị hết video.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExplorePage;