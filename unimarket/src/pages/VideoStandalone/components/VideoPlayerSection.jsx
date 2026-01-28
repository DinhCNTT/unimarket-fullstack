import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IoPlay, IoHeart, IoChatbubbleEllipses, IoBookmark, IoShareSocial, IoMusicalNotes } from 'react-icons/io5';
import { FaPlus, FaCheck } from 'react-icons/fa';
import styles from './VideoPlayerSection.module.css';
import VideoOverlayControls from './VideoOverlayControls';
import { useVolume } from '../../../context/VolumeContext';
import SharePanel from "../../../components/SharePanel";
import VideoContextMenu from "../../../components/VideoContextMenu";
import defaultAvatar from '../../../assets/default-avatar.png';


const API_BASE = "http://localhost:5133";


const VideoPlayerSection = forwardRef(({
    videoData,
    token,
    currentUser,
    onUpdateVideo,
    onOpenComments,
    isActive,
    onRatioChange
}, ref) => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
 
    // 🔥 QUAN TRỌNG: Đẩy thẻ video ra ngoài cho component cha dùng
    useImperativeHandle(ref, () => videoRef.current);
 
    // --- STATE UI & LOGIC ---
    const [isPlaying, setIsPlaying] = useState(false);
    const [showHeart, setShowHeart] = useState(false);


    const [isLandscape, setIsLandscape] = useState(false);
    const [isHovering, setIsHovering] = useState(false);


    // --- STATE AUDIO / VIDEO CONTROLS ---
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);


    // --- GLOBAL STATE VOLUME ---
    const { volume, setVolume, isMuted, setIsMuted } = useVolume();


    // --- STATE SOCIAL (Like, Save, Follow...) ---
    const [isLiked, setIsLiked] = useState(videoData?.isLiked || false);
    const [likeCount, setLikeCount] = useState(videoData?.soTym || 0);
    const [isSaved, setIsSaved] = useState(videoData?.isSaved || false);
    const [saveCount, setSaveCount] = useState(videoData?.soNguoiLuu || 0);
    const [isFollowing, setIsFollowing] = useState(false);
   
    // 🔥 STATE CHO SHARE PANEL
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [shareCount, setShareCount] = useState(videoData?.soLuotChiaSe || 0);


    // 🔥 STATE CHO CONTEXT MENU
    const [contextMenu, setContextMenu] = useState(null);


    // Refs Click
    const clickCountRef = useRef(0);
    const clickTimeoutRef = useRef(null);
 
    // 1. SYNC DATA TỪ SERVER
    useEffect(() => {
        if (!videoData) return;
        setIsLiked(videoData.isLiked);
        setLikeCount(videoData.soTym);
        setIsSaved(videoData.isSaved);
        setSaveCount(videoData.soNguoiLuu);
       
        // 🔥 Sync số lượng chia sẻ khi videoData thay đổi
        setShareCount(videoData.soLuotChiaSe || 0);


        setIsLandscape(false);
        setCurrentTime(0);
        setDuration(0);


        if (videoData.nguoiDang?.id && token) {
            axios.get(`${API_BASE}/api/follow/is-following/${videoData.nguoiDang.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setIsFollowing(res.data.isFollowing))
            .catch(() => setIsFollowing(false));
        }
    }, [videoData, token]);


    // 2. VOLUME SYNC
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);


    // 3. LOGIC AUTOPLAY
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;


        videoEl.volume = volume;
        videoEl.muted = isMuted;


        if (isActive) {
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
                playPromise
                .then(() => setIsPlaying(true))
                .catch((err) => {
                    console.log("Autoplay prevented, trying mute:", err);
                    setIsMuted(true);
                    videoEl.muted = true;
                    videoEl.play()
                        .then(() => setIsPlaying(true))
                        .catch(e => console.error("Still failed:", e));
                });
            }
        } else {
            videoEl.pause();
            videoEl.currentTime = 0;
            setIsPlaying(false);
            setIsShareOpen(false);
            setContextMenu(null); // Đóng menu nếu chuyển video
        }
    }, [isActive, videoData]);


    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;


        // Hàm check tỷ lệ
        const checkRatio = () => {
            if (videoEl.videoWidth && videoEl.videoHeight) {
                if (videoEl.videoWidth >= videoEl.videoHeight) {
                    setIsLandscape(true);
                } else {
                    setIsLandscape(false);
                }
            }
        };


        if (videoEl.readyState >= 1) {
            checkRatio();
        }


        videoEl.addEventListener('loadedmetadata', checkRatio);
       
        return () => {
            videoEl.removeEventListener('loadedmetadata', checkRatio);
        };
    }, [videoData]);


    // 4. LISTENERS
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;


        const handleMeta = () => {
            setDuration(videoEl.duration);
            const isLand = videoEl.videoWidth >= videoEl.videoHeight;
            setIsLandscape(isLand);
            if (onRatioChange) onRatioChange(isLand);
        };


        const handleTime = () => setCurrentTime(videoEl.currentTime);
        const handleEnded = () => setIsPlaying(false);


        if (videoEl.readyState >= 1) handleMeta();


        videoEl.addEventListener('loadedmetadata', handleMeta);
        videoEl.addEventListener('timeupdate', handleTime);
        videoEl.addEventListener('ended', handleEnded);


        return () => {
            videoEl.removeEventListener('loadedmetadata', handleMeta);
            videoEl.removeEventListener('timeupdate', handleTime);
            videoEl.removeEventListener('ended', handleEnded);
        };
    }, [videoData, onRatioChange]);




    // --- HANDLERS CONTROLS ---
    const handleSeek = (e) => {
        e.stopPropagation();
        const time = Number(e.target.value);
        if(videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };


    const handleVolumeChange = (e) => {
        e.stopPropagation();
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        setIsMuted(vol === 0);
        if(videoRef.current) {
            videoRef.current.volume = vol;
            videoRef.current.muted = (vol === 0);
        }
    };


    const toggleMute = (e) => {
        if(e) e.stopPropagation();
        const newMute = !isMuted;
        setIsMuted(newMute);
        if(videoRef.current) videoRef.current.muted = newMute;
        if (!newMute && volume === 0) {
            setVolume(0.5);
            if(videoRef.current) videoRef.current.volume = 0.5;
        }
    };


    const handleTogglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };
 
    const handleVideoClick = (e) => {
        e.stopPropagation();
        if (isShareOpen) {
            setIsShareOpen(false);
            return;
        }
        // 🔥 Click trái thì đóng Context Menu
        if (contextMenu) {
            setContextMenu(null);
            return;
        }


        clickCountRef.current += 1;
        if (clickCountRef.current === 1) {
            clickTimeoutRef.current = setTimeout(() => {
                handleTogglePlay();
                clickCountRef.current = 0;
            }, 250);
        } else if (clickCountRef.current === 2) {
            clearTimeout(clickTimeoutRef.current);
            if (!isLiked) handleLike();
            setShowHeart(true);
            setTimeout(() => setShowHeart(false), 800);
            clickCountRef.current = 0;
        }
    };


    // 🔥 XỬ LÝ CONTEXT MENU (CHUỘT PHẢI)
    const handleContextMenu = (e) => {
        e.preventDefault(); // Chặn menu mặc định
        setContextMenu({ x: e.clientX, y: e.clientY });
    };


    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };


    const handleDownloadVideo = async () => {
        handleCloseContextMenu();
        const videoUrl = videoData.videoUrl;
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `video_${videoData.maTinDang}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Lỗi tải video:", error);
            window.open(videoUrl, '_blank');
        }
    };


    const handleShareContext = () => {
        handleCloseContextMenu();
        setIsShareOpen(true);
    };


    const handleCopyLinkContext = () => {
        const link = `${window.location.origin}/video/${videoData.maTinDang}`;
        navigator.clipboard.writeText(link);
        alert("Đã sao chép liên kết!");
        handleCloseContextMenu();
    };


    // --- SOCIAL ACTIONS ---
    const handleLike = async () => {
        if (!token) return alert("Bạn cần đăng nhập để thả tim!");
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
        try {
            const res = await axios.post(`${API_BASE}/api/video/${videoData.maTinDang}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsLiked(res.data.isLiked);
            setLikeCount(res.data.soTym);
            if (onUpdateVideo) onUpdateVideo({ isLiked: res.data.isLiked, soTym: res.data.soTym });
        } catch (error) {
            console.error("Lỗi like:", error);
            setIsLiked(!newLikedState);
            setLikeCount(prev => !newLikedState ? prev + 1 : prev - 1);
        }
    };


    const handleSave = async () => {
        if (!token) return alert("Bạn cần đăng nhập để lưu video!");
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        setSaveCount(prev => newSavedState ? prev + 1 : Math.max(0, prev - 1));
        try {
            const res = await axios.post(`${API_BASE}/api/video/ToggleSave`,
                { maTinDang: videoData.maTinDang },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            setIsSaved(res.data.saved);
            setSaveCount(res.data.totalSaves);
            if (onUpdateVideo) onUpdateVideo({ isSaved: res.data.saved, soNguoiLuu: res.data.totalSaves });
        } catch (error) {
            console.error("Lỗi save:", error);
        }
    };


    const handleFollow = async () => {
        if (!token) return alert("Bạn cần đăng nhập để follow!");
        try {
            const url = `${API_BASE}/api/follow/${isFollowing ? "unfollow" : "follow"}?followingId=${videoData.nguoiDang.id}`;
            await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
            setIsFollowing(!isFollowing);
        } catch (err) {
            console.error(err);
        }
    };


    // 🔥 HANDLE SHARE LOGIC
    const handleOpenShare = (e) => {
        e.stopPropagation();
        setIsShareOpen(true);
    };


    const handleCloseShare = () => {
        setIsShareOpen(false);
    };


    const handleShareSuccess = () => {
        setShareCount(prev => prev + 1);
    };


    if (!videoData) return null;


    const avatarUrl = videoData.nguoiDang?.avatarUrl || defaultAvatar;


    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div
                    className={`${styles.videoWrapper} ${isLandscape ? styles.landscapeWrapper : ''}`}
                    onClick={handleVideoClick}
                    onContextMenu={handleContextMenu} // 🔥 Kích hoạt Menu chuột phải
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <video
                        ref={videoRef}
                        className={styles.videoPlayer}
                        src={videoData.videoUrl}
                        poster={videoData.hinhAnh}
                        loop
                        playsInline
                        controls={false}
                    />
                   
                    {!isPlaying && (
                        <div className={styles.playIconOverlay}>
                            <IoPlay size={70} color="rgba(255,255,255,0.8)" />
                        </div>
                    )}


                    {showHeart && (
                        <div className={styles.heartAnimation}>
                            <IoHeart size={100} color="#fe2c55" />
                        </div>
                    )}


                    <VideoOverlayControls
                        videoRef={videoRef}
                        duration={duration}
                        currentTime={currentTime}
                        volume={volume}
                        isMuted={isMuted}
                        isHovering={isHovering}
                        onSeek={handleSeek}
                        onVolumeChange={handleVolumeChange}
                        onToggleMute={toggleMute}
                    />
                    <div className={styles.infoOverlay}>
                        <div className={styles.authorRow} onClick={(e) => {e.stopPropagation(); navigate(`/nguoi-dung/${videoData.nguoiDang?.id}`)}}>
                            <span className={styles.authorName}>@{videoData.nguoiDang?.fullName}</span>
                        </div>
                        <div className={styles.description}>{videoData.moTa}</div>
                        <div className={styles.musicRow}>
                            <IoMusicalNotes className={styles.musicIcon} />
                            <div className={styles.musicText}>Nhạc nền - {videoData.nguoiDang?.fullName}</div>
                        </div>
                    </div>
                </div>


                {/* SIDE ACTIONS */}
                <div className={styles.sideActions}>
                    <div className={styles.actionItemAvatar} onClick={() => navigate(`/nguoi-dung/${videoData.nguoiDang?.id}`)}>
                        <div className={styles.avatarContainer}>
                            <img src={avatarUrl} className={styles.avatarImg} alt="avatar" />
                        </div>
                       
                        {currentUser?.id !== videoData.nguoiDang?.id && (
                            <>
                                {!isFollowing && (
                                    <div className={styles.plusIcon} onClick={(e) => { e.stopPropagation(); handleFollow(); }}>
                                        <FaPlus size={10} color="#fff" />
                                    </div>
                                )}


                                {isFollowing && (
                                    <div
                                        className={styles.plusIcon}
                                        style={{ background: '#fff', border: '1px solid #fe2c55', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFollow();
                                        }}
                                    >
                                        <FaCheck size={10} color="#fe2c55" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>


                    <div className={styles.actionItem} onClick={handleLike}>
                        <div className={styles.iconCircle}>
                            <IoHeart size={32} color={isLiked ? "#fe2c55" : "currentColor"} />
                        </div>
                        <span className={styles.actionText}>{likeCount}</span>
                    </div>


                    <div className={styles.actionItem} onClick={onOpenComments}>
                        <div className={styles.iconCircle}>
                            <IoChatbubbleEllipses size={32} color="currentColor" />
                        </div>
                        <span className={styles.actionText}>{videoData.soBinhLuan}</span>
                    </div>


                    <div className={styles.actionItem} onClick={handleSave}>
                        <div className={styles.iconCircle}>
                            <IoBookmark size={32} color={isSaved ? "#face15" : "currentColor"} />
                        </div>
                        <span className={styles.actionText}>{saveCount}</span>
                    </div>


                    <div className={styles.actionItem} onClick={handleOpenShare}>
                        <div className={styles.iconCircle}>
                            <IoShareSocial size={32} color="currentColor" />
                        </div>
                        <span className={styles.actionText}>{shareCount}</span>
                    </div>


                    <div className={styles.discAnimation}>
                            <img src={avatarUrl} alt="music-disc" />
                    </div>
                </div>


                {/* Render Context Menu */}
                {/* 🔥 LƯU Ý: Không truyền onViewDetail để nó ẩn đi */}
                {contextMenu && (
                    <VideoContextMenu
                        position={contextMenu}
                        onClose={handleCloseContextMenu}
                        onDownload={handleDownloadVideo}
                        onShareToFriend={handleShareContext}
                        onCopyLink={handleCopyLinkContext}
                    />
                )}


                {/* Render Share Panel */}
                <SharePanel
                    isOpen={isShareOpen}
                    onClose={handleCloseShare}
                    tinDangId={videoData.maTinDang}
                    displayMode="Video"
                    previewTitle={videoData.moTa || "Video thú vị từ UniMarket"}
                    previewImage={videoData.hinhAnh}
                    previewVideo={videoData.videoUrl}
                    onShareSuccess={handleShareSuccess}
                />
            </div>
        </div>
    );
});


export default VideoPlayerSection;

