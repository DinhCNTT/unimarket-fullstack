// File: src/pages/TrangChat.jsx

import React, { useState, useContext, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom"; // ✅ Đã có useLocation
import { AuthContext } from "../context/AuthContext";
import TopNavbarUniMarket from "../components/TopNavbarUniMarket";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBanHang/ChatBox";
import SocialChatViewer from "../components/SocialChatViewer/SocialChatViewer"; 
import "./TrangChat.css";
import chatBanner from "../assets/chat_banner_01.png";

const TrangChat = () => {
    const { maCuocTroChuyen } = useParams();
    const location = useLocation(); // ✅ Hook để lấy dữ liệu từ navigate
    const { user } = useContext(AuthContext);

    // State cho ChatBox (mua bán)
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [selectedChatUserId, setSelectedChatUserId] = useState(null);

    // State cho SocialChatViewer (chat bạn bè)
    const [viewingSocialChat, setViewingSocialChat] = useState(null);

    // ========================================================
    // ✨ [BƯỚC 4 - LOGIC MỚI] NHẬN DỮ LIỆU TỪ TRANG PROFILE
    // ========================================================
    useEffect(() => {
        // Kiểm tra xem có dữ liệu được truyền qua navigate không
        if (location.state?.selectedConversation && location.state?.autoSelect) {
            const convData = location.state.selectedConversation;
            
            console.log("📥 Nhận được yêu cầu mở chat Social:", convData);

            // 1. Cập nhật state để mở ngay SocialChatViewer
            setViewingSocialChat({
                maCuocTroChuyen: convData.maCuocTroChuyen,
                partner: convData.partner,
                isBlocked: convData.isBlocked,
                maNguoiChan: convData.maNguoiChan,
                // Các trường mặc định để tránh lỗi render
                unreadCount: 0,
                isMuted: false 
            });

            // 2. Đảm bảo tắt chat mua bán (nếu đang mở)
            setSelectedChatId(null);
            
            // 3. Xóa state trong history để khi F5 không bị kích hoạt lại (Tuỳ chọn)
            window.history.replaceState({}, document.title);
        }
    }, [location]); // Chạy mỗi khi location thay đổi


    // --- Logic cũ: xử lý vào chat mua bán từ URL ---
    useEffect(() => {
        // Chỉ chạy nếu KHÔNG có viewingSocialChat (ưu tiên Social Chat từ profile)
        if (maCuocTroChuyen && !viewingSocialChat) {
            setSelectedChatId(maCuocTroChuyen);
        }
    }, [maCuocTroChuyen, viewingSocialChat]);

    // Logic cũ: tìm partner ID cho ChatBox
    useEffect(() => {
        if (!selectedChatId || !user || !selectedChatId.includes("-")) {
            setSelectedChatUserId(null);
            return;
        }
        const parts = selectedChatId.split("-");
        const otherUserId = parts.find((id) => id !== user.id);
        setSelectedChatUserId(otherUserId);
    }, [selectedChatId, user]);


    // Hàm xử lý chọn chat từ Sidebar
    const handleSelectChat = (chat, chatType) => {
        if (chatType === 'social') {
            setViewingSocialChat(chat);    // 1. Mở social chat
            setSelectedChatId(null);       // 2. Đóng chat mua bán
        } else {
            setViewingSocialChat(null);    // 1. Đóng social chat
            const chatId = (chat && typeof chat === 'object') ? chat.maCuocTroChuyen : chat;
            setSelectedChatId(chatId);     // 2. Mở chat mua bán
            
            if (user && chatId && chatId.includes("-")) {
                const parts = chatId.split("-");
                const otherUserId = parts.find((id) => id !== user.id);
                setSelectedChatUserId(otherUserId);
            } else {
                setSelectedChatUserId(null);
            }
        }
    };

    const isChatRoute = location.pathname.startsWith("/chat");

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
            <TopNavbarUniMarket />
            <div className={`trang-chat-container ${isChatRoute ? "with-mini-nav" : ""}`}>
                <div className="chat-list-container">
                    {user?.id && (
                        <ChatList
                            // Logic highlight: Nếu đang xem social chat thì highlight ID đó
                            selectedChatId={selectedChatId || viewingSocialChat?.maCuocTroChuyen}
                            onSelectChat={handleSelectChat}
                            userId={user.id}
                            // ✨ Truyền thêm prop này để ChatList biết đang ở chế độ Social (Mẹo ở bước 2)
                            initialMode={viewingSocialChat ? 'friend' : 'market'} 
                        />
                    )}
                </div>

                <div className="chat-box-container">
                    {viewingSocialChat ? (
                        <SocialChatViewer
                            chat={viewingSocialChat}
                            userId={user?.id}
                        />
                    ) : selectedChatId ? (
                        <ChatBox
                            maCuocTroChuyen={selectedChatId}
                            nguoiNhanId={selectedChatUserId}
                            nguoiGuiId={user.id}
                        />
                    ) : (
                        <div className="empty-chat-placeholder">
                            <img
                                src={chatBanner}
                                alt="Chat Banner"
                                className="IconChat-TrangChat"
                            />
                            <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrangChat;