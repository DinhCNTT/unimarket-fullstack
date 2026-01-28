// Small helper utilities for AI-driven chat actions
import api from '../../services/api';

export function injectChatPreview(detail) {
  // detail: { maCuocTroChuyen, tieuDeTinDang, giaTinDang, anhDaiDienTinDang, noiDung, maNguoiGui, loaiTinNhan, thoiGian }
  window.dispatchEvent(new CustomEvent('InjectSampleMessageToChatList', { detail }));
}

export function injectChatMessage(detail) {
  // detail: { maTinNhan, maCuocTroChuyen, noiDung, maNguoiGui, loaiTinNhan, thoiGianGui, daXem }
  console.log("[injectChatMessage] Dispatching event with detail:", detail);
  window.dispatchEvent(new CustomEvent('InjectSampleMessage', { detail }));
}

export async function createAndOpenAiChat({ user, navigate, initialPrompt }) {
  if (!user || !user.id) {
    console.warn('createAndOpenAiChat: user.id missing');
  }

  // Use user-based chat id so backend and frontend match
  const chatId = `ai-assistant-${user?.id || Date.now()}`;
  const now = new Date().toISOString();

  // Ensure server-side chat exists (best-effort)
  try {
    const response = await api.post(`/Chat/ai/create/${user?.id}`);
    // Backend returns { MaCuocTroChuyen: "ai-assistant-..." } whether created or existing
    if (response.data && response.data.MaCuocTroChuyen) {
      console.log('✅ AI chat already exists or was created:', response.data.MaCuocTroChuyen);
      // Navigate directly to the existing chat
      navigate(`/chat/${response.data.MaCuocTroChuyen}`);
      return response.data.MaCuocTroChuyen;
    }
  } catch (err) {
    // If server call fails, we still continue with local UI so user can interact
    console.warn('Could not create AI chat on server (continuing locally):', err?.message || err);
  }

  // Create a preview in the chat list where the last message is from the AI
  injectChatPreview({
    maCuocTroChuyen: chatId,
    tieuDeTinDang: 'Trợ lý AI UniMarket',
    giaTinDang: 0,
    anhDaiDienTinDang: '/images/uni-ai-avatar.svg',
    // Use a neutral preview text to avoid duplicating the user's initial prompt
    noiDung: 'Nhấn để trò chuyện với Uni.AI',
    maNguoiGui: 'uni.ai', // last message belongs to AI
    loaiTinNhan: 'text',
    thoiGian: now,
    thoiGianCapNhat: now,
    isHidden: false,
    isDeleted: false,
  });

  navigate(`/chat/${chatId}`);

  return chatId;
}

export async function callAiApi(message, userId = null, history = []) {
  try {
    const payload = { message, userId: userId, history: history };
    // Call the backend AI chat endpoint. `api.baseURL` already includes '/api',
    // so call the controller route relative to that base.
    const resp = await api.post('/ai/chat', payload);
    return resp.data;
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
}

export default { injectChatPreview, injectChatMessage, callAiApi, createAndOpenAiChat };
