// src/components/ChatBanHang/ChatBox.jsx
import React, { useEffect, useContext, useMemo, Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";
import "animate.css";
import styles from "./ModuleChatCss/MessageList.module.css";

// Context & Services
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "./context/ChatContext";

// Hooks
import { useSignalR } from "./hooks/useSignalR";
import { useAiChat } from "./hooks/useAiChat";
import { useQuickMessages } from "../ChatList/useQuickMessages";

// ✅ HOOKS ĐÃ TÁCH & SỬA
import { useChatInfo } from "./hooks/useChatInfo";
import { useChatSignalREvents } from "./hooks/useChatSignalREvents";
import { useChatUIActions } from "./hooks/useChatUIActions";

// Components
import ChatHeader from "./ChatHeader";
import ChatProductBanner from "./ChatProductBanner";
import MessageList from "./MessageList/MessageList";
import ChatInput from "./ChatInput";
import ChatInfoSidebar from "./ChatInfoSidebar";
import QuickReplies from "./QuickReplies";

// Lazy Components
const ImageModal = lazy(() => import("./ImageModal"));
const VideoModal = lazy(() => import("./VideoModal"));
const QuickMessageModal = lazy(() => import("../ChatList/QuickMessageModal.jsx"));

const ModalLoadingFallback = () => (
  <div className={styles.modalLoadingOverlay}>
    <div className={styles.modalLoadingSpinner}></div>
  </div>
);

const ChatBox = ({ maCuocTroChuyen }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // ============================================================================
  // 1. Logic Kết nối & Chat (AI / SignalR)
  // ============================================================================
  const isAiConversation = maCuocTroChuyen?.startsWith("ai-assistant-");
  const aiChatLogic = useAiChat(maCuocTroChuyen, user);
  const signalRChatLogic = useSignalR(maCuocTroChuyen, user);
  
  const chatLogic = isAiConversation ? aiChatLogic : signalRChatLogic;

  const {
    danhSachTin, setDanhSachTin, 
    isConnected, // 🔥 (QUAN TRỌNG) Lấy biến này để truyền xuống dưới
    recallMessage, recallMedia,
    markAsRead, sendMessageService, deleteLocalMessage, 
    loadMoreMessages, isLoadingMore, hasMore,
  } = chatLogic;

  const connection = !isAiConversation ? signalRChatLogic.connection : null;

  // ============================================================================
  // 2. Logic Thông tin Chat & User
  // ============================================================================
  
  // 🔥 (QUAN TRỌNG) Phải truyền isConnected vào đây thì bên Hook mới chặn được lỗi
  const chatInfo = useChatInfo(maCuocTroChuyen, user, isConnected);
  
  const { 
      infoTinDang, setInfoTinDang, infoNguoiConLai, setInfoNguoiConLai, 
      maNguoiConLai, isBlockedByMe, isBlockedByOther, 
      setIsBlockedByMe, setIsBlockedByOther 
  } = chatInfo;

  // ============================================================================
  // 3. Logic UI Actions
  // ============================================================================
  const uiActions = useChatUIActions(user, maCuocTroChuyen, maNguoiConLai);
  const { 
      isSidebarOpen, isUploading, tinNhan, setTinNhan, 
      modalImage, videoModalUrl, showQuickMsgModal, setShowQuickMsgModal, 
      inputRef, handleBlockUser, handleUnblockUser 
  } = uiActions;

  // ============================================================================
  // 4. Logic SignalR Events
  // ============================================================================
  useChatSignalREvents({
    connection, maCuocTroChuyen, user, maNguoiConLai,
    setInfoNguoiConLai, setInfoTinDang, setIsBlockedByMe, setIsBlockedByOther, setDanhSachTin
  });

  // ============================================================================
  // 5. Logic Quick Messages
  // ============================================================================
  const quickMsgLogic = useQuickMessages(user?.id);
  const { 
      quickMessages, saveQuickMessages, deleteQuickMessage, editingId, 
      editingContent, setEditingContent, startEditMessage, cancelEdit, 
      isLoadingQuickMessages, isSavingQuickMessages 
  } = quickMsgLogic;

  // --- Effects: Auto Send ---
  useEffect(() => {
    if (isConnected && location.state?.autoSend) {
      console.log("🚀 Auto sending message:", location.state.autoSend);
      sendMessageService(location.state.autoSend, "text");
      window.history.replaceState({}, document.title);
    }
  }, [isConnected, location.state, sendMessageService]);

  // Computed Values
  const isDisabled = useMemo(() => isBlockedByMe || isBlockedByOther || isUploading, [isBlockedByMe, isBlockedByOther, isUploading]);

  const handleQuickReplySent = (sentText) => {
    setTinNhan((prev) => (prev.trim() === sentText.trim() ? "" : prev));
    inputRef.current?.focus();
  };

  const handleOpenAddModal = () => {
    cancelEdit();
    setShowQuickMsgModal(true);
  };

  // --- Context Value ---
  const contextValue = useMemo(() => ({
    danhSachTin, isConnected, user, maCuocTroChuyen,
    ...chatInfo, 
    ...uiActions,
    recallMessage, recallMedia, markAsRead, sendMessageService, 
    deleteLocalMessage, loadMoreMessages, isLoadingMore, hasMore,
    handleBlockUser, handleUnblockUser
  }), [
    danhSachTin, isConnected, user, maCuocTroChuyen, chatInfo, uiActions,
    recallMessage, recallMedia, markAsRead, sendMessageService,
    deleteLocalMessage, loadMoreMessages, isLoadingMore, hasMore
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      <div className={styles.chatPageWrapper}>
        <div className={styles.chatboxContainer}>
          <ChatHeader />
          {!isAiConversation && <ChatProductBanner />}
          <MessageList />

          <QuickReplies
            isDisabled={isDisabled} isConnected={isConnected} sendMessageService={sendMessageService}
            onQuickReplySent={handleQuickReplySent} customQuickMessages={quickMessages}
            onOpenSettings={handleOpenAddModal}
          />

          <ChatInput
            tinNhan={tinNhan} setTinNhan={setTinNhan}
            isUploading={isUploading} setIsUploading={uiActions.setIsUploading}
            isDisabled={isDisabled} inputRef={inputRef}
          />
        </div>

        <ChatInfoSidebar />

        <Suspense fallback={<ModalLoadingFallback />}>
          {modalImage && <ImageModal />}
          {videoModalUrl && <VideoModal url={videoModalUrl} onClose={uiActions.closeVideoModal} />}
          {showQuickMsgModal && (
            <QuickMessageModal
              show={showQuickMsgModal} onClose={() => setShowQuickMsgModal(false)}
              quickMessages={quickMessages} editingId={editingId} editingContent={editingContent}
              isLoading={isLoadingQuickMessages} isSaving={isSavingQuickMessages}
              onContentChange={setEditingContent}
              onSave={async () => { if (await saveQuickMessages()) setShowQuickMsgModal(false); }}
              onDelete={deleteQuickMessage} onEdit={startEditMessage} onCancelEdit={cancelEdit}
            />
          )}
        </Suspense>
      </div>
    </ChatContext.Provider>
  );
};

export default ChatBox;