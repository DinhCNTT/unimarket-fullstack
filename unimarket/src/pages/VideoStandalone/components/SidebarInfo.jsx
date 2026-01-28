import React, {
    useState,
    useContext,
    useRef,
    useEffect
} from 'react';
import { useNavigate } from 'react-router-dom'; // 🔥 IMPORT THÊM: Để chuyển trang Chat
import axios from 'axios';
import {
    IoCloseOutline,
    IoStorefrontOutline,
} from 'react-icons/io5';
import { FaChevronRight } from 'react-icons/fa';

import { AuthContext } from "../../../context/AuthContext";
import styles from './SidebarInfo.module.css';
import SidebarHeader from '../../../components/Common/SidebarHeader';
import SuggestedVideoList from './SuggestedVideoList';
import CommentList from './CommentList';
import VideoDetailsPanel from '../../../components/VideoDetailsPanel/VideoDetailsPanel';

const API_BASE = "http://localhost:5133";

const SidebarInfo = ({
    videoData,
    activeTab,
    setActiveTab,
    fullVideoList,
    currentVideoId,
    onLoadMore,
    hasMore,
    highlightCommentId
}) => {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate(); // 🔥 Hook điều hướng

    /* ======================================================
       STATE
    ====================================================== */
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [isPosting, setIsPosting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);

    // State Panel và Dữ liệu chi tiết đầy đủ
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [fullDetailData, setFullDetailData] = useState(null); // 🔥 STATE MỚI: Chứa data đầy đủ từ API

    const textareaRef = useRef(null);

    /* ======================================================
       EFFECT: AUTO RESIZE TEXTAREA
    ====================================================== */
    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height =
            commentText === ''
                ? '20px'
                : `${textareaRef.current.scrollHeight}px`;
    }, [commentText]);

    /* ======================================================
       🔥 LOGIC MỚI: Mở PANEL VÀ Lấy FULL DATA
       Lý do: Data từ feed (videoData) hay bị thiếu ảnh/sơ sài.
       Ta cần gọi API detail để lấy thông tin chính xác nhất.
    ====================================================== */
    const handleOpenDetails = async () => {
        // 1. Mở Panel ngay lập tức (hiển thị dữ liệu tạm trong lúc chờ tải)
        setShowDetailsPanel(true);

        // 2. Gọi API lấy chi tiết đầy đủ (giống VideoDetailViewer)
        try {
            const res = await axios.get(`${API_BASE}/api/video/detail/${videoData.maTinDang}`);
            // Cập nhật data đầy đủ (có danh sách ảnh, sơ sài)
            setFullDetailData(res.data);
        } catch (error) {
            console.error("Lỗi tải chi tiết tin đăng:", error);
        }
    };

    /* ======================================================
       POST COMMENT
    ====================================================== */
    const handlePostCommentGeneric = async (content, parentId = null) => {
        if (!content.trim()) return;

        if (!token) {
            alert("Vui lòng đăng nhập để bình luận!");
            return;
        }

        try {
            setIsPosting(true);

            await axios.post(
                `${API_BASE}/api/Video/${videoData.maTinDang}/comment`,
                {
                    Content: content,
                    ParentCommentId: parentId
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Reset sau khi post
            setCommentText('');
            setReplyingTo(null);
            setRefreshKey(prev => prev + 1);

        } catch (error) {
            console.error("Lỗi gửi comment:", error);
        } finally {
            setIsPosting(false);
        }
    };

    /* ======================================================
       DELETE COMMENT LOGIC (Sử dụng Modal từ Code 2)
    ====================================================== */
    
    // 1. Hàm được gọi khi nhấn nút "Xóa" ở CommentList -> Mở Modal
    const handleDeleteComment = (commentId) => {
        if (!token) return;
        setCommentToDelete(commentId);
        setShowDeleteModal(true);
    };

    // 2. Hàm thực thi xóa thật sự (Khi bấm nút "Xóa" trong Modal)
    const confirmDelete = async () => {
        if (!commentToDelete) return;
        
        try {
            await axios.delete(`${API_BASE}/api/Video/comment/${commentToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Xóa thành công
            setRefreshKey(prev => prev + 1); // Reload list
            setShowDeleteModal(false);       // Đóng modal
            setCommentToDelete(null);        // Reset ID
            
        } catch (error) {
            console.error("Lỗi xóa comment:", error);
            alert("Không thể xóa bình luận (Có thể do lỗi mạng hoặc quyền truy cập).");
            setShowDeleteModal(false);
        }
    };

    // 3. Hủy xóa -> Đóng Modal
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setCommentToDelete(null);
    };

    /* ======================================================
       HANDLERS GIAO DIỆN
    ====================================================== */
    const handleReplyClick = (comment) => {
        setReplyingTo(comment);
        setActiveTab('comments');
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setCommentText('');
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        if (val.length <= 150) {
            setCommentText(val);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePostCommentGeneric(
                commentText,
                replyingTo ? replyingTo.id : null
            );
        }
    };
    /* ======================================================
       🔥 CHUẨN HÓA DỮ LIỆU (FALLBACK)
       Dùng khi chưa tải xong data full từ API
    ====================================================== */
    const getNormalizedData = () => {
        if (!videoData) return null;

        // Nếu đã có data full từ API thì dùng nó luôn, khỏi cần chuẩn hóa data cũ
        if (fullDetailData) return fullDetailData;

        return {
            ...videoData,
            // Cố gắng tìm danh sách ảnh từ data rút gọn
            danhSachAnh: (videoData.danhSachAnh && videoData.danhSachAnh.length > 0) 
                ? videoData.danhSachAnh 
                : (videoData.hinhAnh ? [videoData.hinhAnh] : []), 

            nguoiDang: videoData.nguoiDang || {
                id: videoData.userId || videoData.maNguoiDung || videoData.nguoiDangId,
                fullName: videoData.userName || videoData.tenNguoiDang || videoData.fullName || "Người bán",
                avatarUrl: videoData.userAvatar || videoData.avatarNguoiDang || videoData.avatarUrl || "/default-avatar.png",
                // Cố gắng tìm SĐT ở mọi ngóc ngách
                phoneNumber: videoData.soDienThoai || videoData.phoneNumber || videoData.sdt || "" 
            }
        };
    };

    const displayData = getNormalizedData();

    if (!videoData) return null;

    return (
        <div className={styles.sidebarContainer}>

            {/* 🔥 BUTTON XEM CHI TIẾT: Gọi hàm handleOpenDetails mới */}
            <div 
                className={styles.productInfoBar} 
                onClick={handleOpenDetails}
            >
                <div className={styles.productIconWrapper}>
                    <IoStorefrontOutline size={20} color="#fe2c55" />
                </div>
                <div className={styles.productText}>
                    <span className={styles.productLabel}>Chi tiết sản phẩm</span>
                    <span className={styles.productNameTruncated}>{videoData.tieuDe}</span>
                </div>
                <FaChevronRight size={14} color="#888" />
            </div>

             {/* 2. 🔥 HIỂN THỊ HEADER (User Avatar, Icons...) NGAY DƯỚI THANH CHI TIẾT */}
            <SidebarHeader />

            {/* ===================== TABS ===================== */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tabItem} ${activeTab === 'comments' ? styles.active : ''}`}
                    onClick={() => setActiveTab('comments')}
                >
                    Bình luận ({videoData.soBinhLuan || 0})
                </button>

                <button
                    className={`${styles.tabItem} ${activeTab === 'suggested' ? styles.active : ''}`}
                    onClick={() => setActiveTab('suggested')}
                >
                    Đề xuất ({fullVideoList ? fullVideoList.length : 0})
                </button>
            </div>

            {/* ===================== BODY (SCROLL) ===================== */}
            <div className={`${styles.scrollContent} sidebar-content-scroll`}>
                <div style={{ display: activeTab === 'comments' ? 'block' : 'none' }}>
                    <CommentList
                        videoId={videoData.maTinDang}
                        refreshTrigger={refreshKey}
                        onReply={handleReplyClick}
                        onPostReply={handlePostCommentGeneric}
                        highlightCommentId={highlightCommentId}
                        currentUser={user} 
                        onDeleteComment={handleDeleteComment}
                    />
                </div>

                <div style={{ display: activeTab === 'suggested' ? 'block' : 'none' }}>
                    <SuggestedVideoList
                        videos={fullVideoList}
                        currentVideoId={currentVideoId}
                        onLoadMore={onLoadMore}
                        hasMore={hasMore}
                    />
                </div>
            </div>

            {/* ===================== FOOTER INPUT ===================== */}
            {activeTab === 'comments' && (
                <div className={styles.commentInputArea}>
                    <div className={styles.inputWrapper}>
                        {replyingTo && (
                            <div className={styles.replyingBar}>
                                <span>Đang trả lời <b>{replyingTo.userName}</b></span>
                                <IoCloseOutline className={styles.cancelReplyBtn} onClick={handleCancelReply} />
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            className={styles.inputBox}
                            placeholder={replyingTo ? `Trả lời ${replyingTo.userName}...` : "Thêm bình luận..."}
                            value={commentText}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={isPosting}
                            rows={1}
                        />
                        <span className={`${styles.charCounter} ${commentText.length >= 150 ? styles.limitReached : ''}`}>
                            {commentText.length}/150
                        </span>
                    </div>
                    <button
                        className={styles.postBtn}
                        onClick={() => handlePostCommentGeneric(commentText, replyingTo ? replyingTo.id : null)}
                        disabled={isPosting || !commentText.trim()}
                        style={{ opacity: commentText.trim() ? 1 : 0.5 }}
                    >
                        {isPosting ? '...' : 'Đăng'}
                    </button>
                </div>
            )}

            {/* ===================== MODALS ===================== */}
            {showDeleteModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3 className={styles.modalTitle}>Xóa bình luận?</h3>
                        <p className={styles.modalDesc}>Hành động này không thể hoàn tác.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.btnCancel} onClick={cancelDelete}>Hủy</button>
                            <button className={styles.btnDelete} onClick={confirmDelete}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 FIX PANEL: Truyền Data đã được tải về + Logic Chat đúng */}
            <VideoDetailsPanel 
                isOpen={showDetailsPanel}
                onClose={() => {
                    setShowDetailsPanel(false);
                    // Reset full data khi đóng để lần sau mở cái khác không bị hiện cái cũ
                    setFullDetailData(null); 
                }}

                // Ưu tiên dùng fullDetailData (từ API), nếu chưa có thì dùng normalizedData (từ prop)
                data={displayData} 

                user={user}
                loading={!displayData} // Hiển thị loading nếu chưa có data nào

                // 🔥 SỬA LOGIC CHAT: Chuyển hướng sang trang Chat
                onOpenChat={(chatId) => {
                    console.log("Navigating to chat:", chatId);
                    navigate(`/chat/${chatId}`);
                }}
            />
        </div>
    );
};

export default SidebarInfo;