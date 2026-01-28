import React, { useState, useEffect, useRef, useCallback } from "react";
import "./SocialChatViewer.css";
import VideoMessage from "./VideoMessage";
import TextMessage from "./TextMessage";
import ChatInput from "./ChatInput";
import DeleteMessageModal from "./DeleteMessageModal";
import LikedVideoDetailViewer from "../../pages/LikedVideoDetailViewer/LikedVideoDetailViewer";
import {
    joinGroup,
    registerChatEventHandler,
    unregisterChatEventHandler,
    recallMessage,
    deleteMessageForMe,
    acceptMessageRequest, // ✨ Import API mới
} from "../../services/chatSocialService";

// ==========================================
// HELPER: useRelativeTime
// ==========================================
const useRelativeTime = (isoDateString, isOnline) => {
    const [relativeTime, setRelativeTime] = useState("");

    const format = (date) => {
        if (!date) return "Ngoại tuyến";
        const now = new Date();
        const past = new Date(date);
        const seconds = Math.floor((now - past) / 1000);
        if (seconds < 0) return "Hoạt động vừa xong";
        if (seconds < 60) return "Hoạt động vừa xong";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `Hoạt động ${minutes} phút trước`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hoạt động ${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        return `Hoạt động ${days} ngày trước`;
    };

    useEffect(() => {
        if (isOnline) {
            setRelativeTime("Đang hoạt động");
            return;
        }
        if (!isoDateString) {
            setRelativeTime("Ngoại tuyến");
            return;
        }
        setRelativeTime(format(isoDateString));
        const interval = setInterval(() => setRelativeTime(format(isoDateString)), 30000);
        return () => clearInterval(interval);
    }, [isoDateString, isOnline]);

    return relativeTime;
};

// ==========================================
// MAIN COMPONENT: SocialChatViewer
// ==========================================
const SocialChatViewer = ({ chat, userId }) => {
    // --- State Chat Cơ Bản ---
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const messageListTopRef = useRef(null);
    const [partnerActivity, setPartnerActivity] = useState(null);
    const activityString = useRelativeTime(partnerActivity?.lastActive, partnerActivity?.isOnline);

    // --- State cho Trả lời & Xóa ---
    const [replyingTo, setReplyingTo] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);

    // --- State: Quản lý xóa cuộc trò chuyện ---
    const [isDeletingConversation, setIsDeletingConversation] = useState(false);

    // --- State quản lý trạng thái chặn (Block) ---
    const [blockStatus, setBlockStatus] = useState(null);

    // --- State quản lý logic Anti-spam & Follow ---
    const [canChat, setCanChat] = useState(true);
    const [restrictionReason, setRestrictionReason] = useState("");
    const [isFollowingPartner, setIsFollowingPartner] = useState(false); // Mình có fl họ k?
    const [isFollowedByPartner, setIsFollowedByPartner] = useState(false); // Họ có fl mình k?

    // --- State quản lý video đang xem (Overlay) ---
    const [viewingVideo, setViewingVideo] = useState(null);

    // --- Ref để lưu các DOM node của tin nhắn ---
    const messageRefs = useRef(new Map());

    // ===================================
    // HANDLERS VIDEO
    // ===================================
    const handleOpenVideo = useCallback((videoData) => {
        setViewingVideo(videoData);
    }, []);

    const handleCloseVideo = useCallback(() => {
        setViewingVideo(null);
    }, []);

    // ===================================
    // HANDLERS CHẤP NHẬN / TỪ CHỐI CHAT
    // ===================================
    
    // ✨ [MỚI] Xử lý chấp nhận tin nhắn chờ (Gọi API)
    const handleAcceptChat = async () => {
        try {
            // Gọi API báo server là đã chấp nhận
            await acceptMessageRequest(chat.maCuocTroChuyen);
            
            // Cập nhật UI Client ngay lập tức: Coi như mình đã follow họ
            setIsFollowingPartner(true);
        } catch (error) {
            console.error("Lỗi chấp nhận chat:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        }
    };

    // Xử lý khi bấm nút "Xóa" (Từ chối) -> Mở Modal xác nhận
    const handleDeclineChat = () => {
        setIsDeletingConversation(true);
    };

    // Gọi API Xóa cuộc trò chuyện (Khi confirm ở Modal)
    const handleConfirmDeleteConversation = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:5133/api/SocialShare/conversation/${chat.maCuocTroChuyen}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                // Xóa thành công -> Đóng modal & Reload lại trang (hoặc redirect)
                setIsDeletingConversation(false);
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Lỗi khi xóa cuộc trò chuyện");
            }
        } catch (error) {
            console.error("Lỗi xóa chat:", error);
            alert("Đã xảy ra lỗi kết nối khi xóa cuộc trò chuyện.");
        }
    };

    // Hàm đóng Modal chung (cho cả xóa tin nhắn & xóa cuộc trò chuyện)
    const handleCloseAnyModal = () => {
        setMessageToDelete(null);         // Reset state xóa tin nhắn
        setIsDeletingConversation(false); // Reset state xóa cuộc trò chuyện
    };

    // ===================================
    // LOGIC SCROLL & FETCH DATA
    // ===================================

    // Scroll xuống dưới cùng khi có tin nhắn mới (nếu không đang load cũ)
    useEffect(() => {
        if (!loadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loadingMore]);

    // Lấy trạng thái hoạt động partner
    useEffect(() => {
        const fetchPartnerActivity = async () => {
            if (!chat?.partner?.id) {
                setPartnerActivity(null);
                return;
            }
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `http://localhost:5133/api/SocialShare/activity/${chat.partner.id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.ok) {
                    const data = await response.json();
                    setPartnerActivity(data);
                } else {
                    setPartnerActivity({ isOnline: false, lastActive: null });
                }
            } catch (error) {
                console.error("Lỗi khi lấy activity:", error);
                setPartnerActivity({ isOnline: false, lastActive: null });
            }
        };
        fetchPartnerActivity();
    }, [chat?.partner?.id]);

    // ===================================
    // REALTIME HANDLERS (LOGIC QUAN TRỌNG)
    // ===================================
    const handleReceiveMessage = useCallback(
        (newMessage) => {
            if (newMessage.maCuocTroChuyen === chat?.maCuocTroChuyen) {

                // Cập nhật danh sách tin nhắn và kiểm tra logic khóa ngay lập tức
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages, newMessage];

                    // --- TRƯỜNG HỢP 1: TIN NHẮN DO MÌNH GỬI ---
                    if (newMessage.maNguoiGui === userId) {
                        // Nếu họ chưa follow mình (chưa chấp nhận) -> Kiểm tra Spam 3 tin
                        if (!isFollowedByPartner) {
                            const last3 = updatedMessages.slice(-3);
                            // Nếu có đủ 3 tin VÀ tất cả đều là của mình
                            const isAllMine = last3.length >= 3 && last3.every(m => m.maNguoiGui === userId);

                            if (isAllMine) {
                                setCanChat(false);
                                setRestrictionReason("Đã đạt giới hạn tin nhắn chờ.");
                            }
                        }
                    }
                    // --- TRƯỜNG HỢP 2: TIN NHẮN TỪ PARTNER ---
                    else {
                        // Mở khóa chat ngay lập tức nếu partner nhắn lại
                        setCanChat(true);
                        setRestrictionReason("");
                        // Cập nhật trạng thái ngầm định là họ đã tương tác
                        setIsFollowedByPartner(true);
                    }

                    return updatedMessages;
                });
            }
        },
        [chat?.maCuocTroChuyen, userId, isFollowedByPartner]
    );

    // ✨ [MỚI] Xử lý sự kiện Realtime: Partner đã chấp nhận tin nhắn
    const handleConversationAccepted = useCallback((data) => {
        if (data.maCuocTroChuyen === chat?.maCuocTroChuyen) {
            // Mở khóa cho người gửi
            setCanChat(true);
            setRestrictionReason("");
            // Cập nhật trạng thái: Họ đã follow lại mình
            setIsFollowedByPartner(true);
        }
    }, [chat?.maCuocTroChuyen]);

    const handlePresenceUpdate = useCallback(
        (presence) => {
            if (presence.userId === chat?.partner?.id) {
                setPartnerActivity({
                    isOnline: presence.isOnline,
                    lastActive: presence.lastActive,
                });
            }
        },
        [chat?.partner?.id]
    );

    const handleMessageRecalled = useCallback(
        ({ maTinNhan, maCuocTroChuyen: convoId }) => {
            if (convoId !== chat?.maCuocTroChuyen) return;
            setMessages((prev) =>
                prev.map((m) =>
                    m.maTinNhan === maTinNhan
                        ? {
                            ...m,
                            isRecalled: true,
                            noiDung: "[Tin nhắn đã thu hồi]",
                            mediaUrl: null,
                            share: null,
                            parentMessage: m.parentMessage
                        }
                        : m
                )
            );
        },
        [chat?.maCuocTroChuyen]
    );

    const handleMessageRemovedForMe = useCallback(
        ({ maTinNhan, maCuocTroChuyen: convoId }) => {
            if (convoId !== chat?.maCuocTroChuyen) return;
            setMessages((prev) => prev.filter((m) => m.maTinNhan !== maTinNhan));
        },
        [chat?.maCuocTroChuyen]
    );

    const handleBlockStatusChanged = useCallback(
        (data) => {
            if (data.maCuocTroChuyen === chat?.maCuocTroChuyen) {
                setBlockStatus({
                    isBlocked: data.isBlocked,
                    maNguoiChan: data.maNguoiChan,
                });
            }
        },
        [chat?.maCuocTroChuyen]
    );

    const handleReceiveError = useCallback((errorMessage) => {
        alert(errorMessage);
    }, []);

    // ===================================
    // API FETCH MESSAGES
    // ===================================
    const fetchMessages = useCallback(async (page, isInitialLoad = false) => {
        if (!chat?.maCuocTroChuyen) return;

        if (isInitialLoad) setLoading(true);
        else setLoadingMore(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:5133/api/SocialShare/social/history/${chat.maCuocTroChuyen}?pageNumber=${page}&pageSize=30`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error("Failed to fetch history");
            const data = await response.json();

            // ✨ CẬP NHẬT TRẠNG THÁI TỪ API
            if (isInitialLoad) {
                setCanChat(data.canChat ?? true);
                setRestrictionReason(data.restrictionReason || "");
                setIsFollowingPartner(data.isFollowingPartner);
                setIsFollowedByPartner(data.isFollowedByPartner);
            }

            setMessages((prev) =>
                isInitialLoad ? data.messages : [...data.messages, ...prev]
            );
            setHasMore(data.pageNumber < data.totalPages);
            setPageNumber(data.pageNumber);

        } catch (err) {
            console.error("Lỗi fetch history:", err);
            setHasMore(false);
        } finally {
            if (isInitialLoad) setLoading(false);
            else setLoadingMore(false);
        }
    }, [chat?.maCuocTroChuyen]);

    // ===================================
    // USE EFFECT (REGISTER EVENTS)
    // ===================================
    useEffect(() => {
        if (!chat?.maCuocTroChuyen) return;

        setBlockStatus({
            isBlocked: chat.isBlocked,
            maNguoiChan: chat.maNguoiChan,
        });

        // Đăng ký sự kiện
        registerChatEventHandler("ReceiveMessage", handleReceiveMessage);
        registerChatEventHandler("PresenceUpdated", handlePresenceUpdate);
        registerChatEventHandler("MessageRecalled", handleMessageRecalled);
        registerChatEventHandler("MessageRemovedForMe", handleMessageRemovedForMe);
        registerChatEventHandler("BlockStatusChanged", handleBlockStatusChanged);
        registerChatEventHandler("ReceiveError", handleReceiveError);
        // ✨ Đăng ký sự kiện chấp nhận chat
        registerChatEventHandler("ConversationAccepted", handleConversationAccepted);

        // Reset & Load dữ liệu
        setMessages([]);
        setHasMore(true);
        fetchMessages(1, true);
        if (chat?.maCuocTroChuyen) joinGroup(chat.maCuocTroChuyen);

        return () => {
            unregisterChatEventHandler("ReceiveMessage", handleReceiveMessage);
            unregisterChatEventHandler("PresenceUpdated", handlePresenceUpdate);
            unregisterChatEventHandler("MessageRecalled", handleMessageRecalled);
            unregisterChatEventHandler("MessageRemovedForMe", handleMessageRemovedForMe);
            unregisterChatEventHandler("BlockStatusChanged", handleBlockStatusChanged);
            unregisterChatEventHandler("ReceiveError", handleReceiveError);
            // ✨ Hủy đăng ký
            unregisterChatEventHandler("ConversationAccepted", handleConversationAccepted);
        };
    }, [
        chat?.maCuocTroChuyen,
        chat?.partner?.id,
        chat?.isBlocked,
        chat?.maNguoiChan,
        handleReceiveMessage,
        handlePresenceUpdate,
        fetchMessages,
        handleMessageRecalled,
        handleMessageRemovedForMe,
        handleBlockStatusChanged,
        handleReceiveError,
        handleConversationAccepted // Thêm vào dependencies
    ]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchMessages(pageNumber + 1);
                }
            },
            { threshold: 1.0 }
        );

        const currentTopRef = messageListTopRef.current;
        if (currentTopRef) {
            observer.observe(currentTopRef);
        }
        return () => {
            if (currentTopRef) {
                observer.unobserve(currentTopRef);
            }
        };
    }, [hasMore, loadingMore, loading, pageNumber, fetchMessages]);

    // ===================================
    // ACTION HANDLERS
    // ===================================
    const handleStartReply = (message) => setReplyingTo(message);
    const handleOpenDeleteModal = (message) => setMessageToDelete(message);
    
    // Hàm xóa tin nhắn (riêng lẻ)
    const handleConfirmDeleteMessage = async () => {
        if (!messageToDelete) return;
        const { maTinNhan, maNguoiGui } = messageToDelete;
        const conversationId = chat.maCuocTroChuyen;

        if (!conversationId) {
            alert("Đã xảy ra lỗi: Không tìm thấy ID cuộc trò chuyện.");
            return;
        }

        const isMyMessage = maNguoiGui === userId;

        try {
            if (isMyMessage) {
                await recallMessage(conversationId, maTinNhan);
            } else {
                await deleteMessageForMe(conversationId, maTinNhan);
            }
            handleCloseAnyModal();
        } catch (error) {
            console.error("Lỗi khi xóa tin nhắn:", error);
            alert(error.message || "Đã xảy ra lỗi khi xóa tin nhắn.");
        }
    };

    const handleJumpToMessage = (messageId) => {
        const node = messageRefs.current.get(messageId);
        if (node) {
            node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            node.classList.add('highlighted');
            setTimeout(() => {
                node.classList.remove('highlighted');
            }, 2500);
        } else {
            console.warn(`Không tìm thấy tin nhắn ${messageId} trong DOM.`);
            alert("Không thể tìm thấy tin nhắn gốc (có thể đã bị trôi quá xa).");
        }
    };

    // ===================================
    // RENDER INPUT LOGIC (QUAN TRỌNG)
    // ===================================
    const renderChatInput = () => {
        // --- ƯU TIÊN 1: Bị Block hoàn toàn ---
        if (blockStatus && blockStatus.isBlocked) {
            const isBlocker = blockStatus.maNguoiChan === userId;
            const message = isBlocker
                ? "Bỏ chặn người dùng này để gửi tin nhắn."
                : "Bạn đã bị người dùng này chặn.";

            return (
                <div className="chat-input-blocked-wrapper">
                    <p className="chat-input-blocked-text">{message}</p>
                </div>
            );
        }

        // --- ƯU TIÊN 2: Giao diện "Yêu cầu tin nhắn" (Message Request) ---
        // (Khi: Mình chưa follow họ + Họ chưa follow mình + Có tin nhắn từ người lạ)
        if (!isFollowingPartner && !isFollowedByPartner && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.maNguoiGui !== userId) {
                return (
                    <div className="message-request-actions">
                        <div className="message-request-content">
                            <p>Tin nhắn từ người lạ</p>
                            <div className="request-buttons">
                                <button className="btn-decline" onClick={handleDeclineChat}>Xóa</button>
                                <button className="btn-accept" onClick={handleAcceptChat}>Chấp nhận</button>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        // --- ƯU TIÊN 3: Giao diện Bị giới hạn tin nhắn (Spam Limit) ---
        // (Khi: Mình gửi quá 3 tin mà họ chưa rep/chấp nhận)
        if (!canChat) {
            return (
                <div className="chat-input-blocked-wrapper spam-limit">
                    <div className="spam-limit-content">
                        <p className="chat-input-blocked-text">
                            {restrictionReason || "Đã đạt giới hạn tin nhắn."}
                        </p>
                        <span className="spam-limit-subtext">
                            (Hãy chờ người dùng này trả lời để tiếp tục trò chuyện)
                        </span>
                    </div>
                </div>
            );
        }

        // --- ƯU TIÊN 4: Ô nhập tin nhắn bình thường ---
        return (
            <ChatInput
                chatId={chat.maCuocTroChuyen}
                replyingTo={replyingTo}
                onClearReply={() => setReplyingTo(null)}
            />
        );
    };

    if (!chat) return null;

    // ===================================
    // RENDER MAIN
    // ===================================
    return (
        <div className="social-chat-panel" style={{ position: 'relative' }}>
            {/* --- Header --- */}
            <header className="chat-viewer-header">
                <img
                    src={chat.partner?.avatarUrl || "/default-avatar.png"}
                    alt="Avatar"
                    className="chat-viewer-avatar"
                />
                <div className="chat-viewer-info">
                    <h3>{chat.partner?.fullName || "Cuộc trò chuyện"}</h3>
                    {partnerActivity && (
                        <span
                            className={`chat-viewer-status ${partnerActivity.isOnline ? "online" : "offline"
                                }`}
                        >
                            {activityString}
                        </span>
                    )}
                </div>
            </header>

            {/* --- Message List --- */}
            <main className="chat-messages-list">
                <div ref={messageListTopRef} style={{ height: "1px" }} />
                {loadingMore && <p style={{ textAlign: "center" }}>Đang tải tin cũ...</p>}
                {loading ? (
                    <p style={{ textAlign: "center" }}>Đang tải...</p>
                ) : (
                    messages.map((msg) => {
                        const messageRefCallback = (node) => {
                            if (node) {
                                messageRefs.current.set(msg.maTinNhan, node);
                            } else {
                                messageRefs.current.delete(msg.maTinNhan);
                            }
                        };

                        return (msg.share && msg.share.previewVideo) && !msg.isRecalled ? (
                            <VideoMessage
                                ref={messageRefCallback}
                                key={msg.maTinNhan}
                                message={msg}
                                currentUserId={userId}
                                onStartReply={handleStartReply}
                                onOpenDeleteModal={handleOpenDeleteModal}
                                onJumpToMessage={handleJumpToMessage}
                                onPreviewVideo={handleOpenVideo}
                            />
                        ) : (
                            <TextMessage
                                ref={messageRefCallback}
                                key={msg.maTinNhan}
                                message={msg}
                                currentUserId={userId}
                                onStartReply={handleStartReply}
                                onOpenDeleteModal={handleOpenDeleteModal}
                                onJumpToMessage={handleJumpToMessage}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* --- Input / Block Message / Spam Limit / Request Actions --- */}
            {renderChatInput()}

            {/* --- ✨ MODAL DÙNG CHUNG (XÓA TIN NHẮN / XÓA CHAT) --- */}
            {(messageToDelete || isDeletingConversation) && (
                <DeleteMessageModal
                    // Nếu đang xóa chat -> type="conversation", mặc định là "message"
                    type={isDeletingConversation ? 'conversation' : 'message'}

                    // Truyền message nếu xóa tin nhắn
                    message={messageToDelete}

                    currentUserId={userId}

                    // Logic xác nhận: Nếu đang xóa chat -> gọi hàm xóa chat, ngược lại gọi hàm xóa tin nhắn
                    onConfirm={isDeletingConversation ? handleConfirmDeleteConversation : handleConfirmDeleteMessage}

                    onClose={handleCloseAnyModal}
                />
            )}

            {/* --- Video Overlay --- */}
            {viewingVideo && (
                <LikedVideoDetailViewer
                    isOverlay={true}
                    passedVideoData={viewingVideo}
                    onClose={handleCloseVideo}
                />
            )}
        </div>
    );
};

export default SocialChatViewer;