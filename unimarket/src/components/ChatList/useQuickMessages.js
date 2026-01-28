import { useState, useEffect, useCallback } from 'react';
import { quickMessageService } from '../../services/quickMessageService';
import Swal from "sweetalert2";

// Tên sự kiện để các component giao tiếp với nhau
const REFRESH_EVENT = 'REFRESH_QUICK_MESSAGES_EVENT';

export const useQuickMessages = (userId) => {
  const [quickMessages, setQuickMessages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [isLoadingQuickMessages, setIsLoadingQuickMessages] = useState(false);
  const [isSavingQuickMessages, setIsSavingQuickMessages] = useState(false);

  // --- 1. HÀM LOAD (Có chuẩn hóa) ---
  const loadQuickMessages = useCallback(async () => {
    if (!userId) return;
    
    try {
      const rawMessages = await quickMessageService.getMyQuickMessages();
      
      const normalizedMessages = (Array.isArray(rawMessages) ? rawMessages : []).map(m => ({
        id: m.id || m.Id,
        content: m.content || m.Content,
        order: m.order || m.Order || 0
      }));

      normalizedMessages.sort((a, b) => a.order - b.order);
      setQuickMessages(normalizedMessages);
    } catch (error) {
      console.error('Lỗi load tin nhắn:', error);
    }
  }, [userId]);

  // --- 2. LẮNG NGHE SỰ KIỆN TỪ CÁC TAB/COMPONENT KHÁC ---
  useEffect(() => {
    loadQuickMessages(); // Load lần đầu

    const handleRefreshSignal = () => {
        console.log('♻️ [EVENT] Nhận tín hiệu có thay đổi, đang reload...');
        loadQuickMessages();
    };

    window.addEventListener(REFRESH_EVENT, handleRefreshSignal);

    return () => {
        window.removeEventListener(REFRESH_EVENT, handleRefreshSignal);
    };
  }, [loadQuickMessages]);


  // --- 3. HÀM LƯU ---
  const saveQuickMessages = async (contentParam) => {
    const contentToSave = contentParam !== undefined ? contentParam : editingContent;
    
    if (!contentToSave.trim()) {
      Swal.fire('Lỗi', 'Vui lòng nhập nội dung', 'warning');
      return false;
    }

    setIsSavingQuickMessages(true);
    try {
      if (editingId) {
        const currentMsg = quickMessages.find(m => String(m.id) === String(editingId));
        const order = currentMsg ? currentMsg.order : 1;
        await quickMessageService.updateQuickMessage(editingId, contentToSave, order);
      } else {
        const usedOrders = new Set(quickMessages.map(m => m.order));
        let availableOrder = 1;
        for (let i = 1; i <= 5; i++) {
            if (!usedOrders.has(i)) { availableOrder = i; break; }
        }
        if (usedOrders.size >= 5) {
            Swal.fire('Lỗi', 'Đã đạt giới hạn 5 tin nhắn', 'error');
            setIsSavingQuickMessages(false);
            return false;
        }
        await quickMessageService.createQuickMessage(contentToSave, availableOrder);
      }

      window.dispatchEvent(new Event(REFRESH_EVENT));

      setEditingContent('');
      setEditingId(null);
      return true;

    } catch (error) {
      console.error('Lỗi lưu:', error);
      Swal.fire('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra', 'error');
      return false;
    } finally {
      setIsSavingQuickMessages(false);
    }
  };

  // --- 4. HÀM XÓA (ĐÃ SỬA: Bỏ confirm, chỉ thực hiện xóa) ---
  const deleteQuickMessage = async (id) => {
    // Đã xóa phần Swal.fire confirm ở đây
    // Vì bên UI (QuickMessageModal) đã hỏi rồi.

    try {
      await quickMessageService.deleteQuickMessage(id);
      
      // === BẮN TÍN HIỆU ===
      console.log('📢 [EVENT] Đã xóa xong, bắn tín hiệu reload toàn app');
      window.dispatchEvent(new Event(REFRESH_EVENT));

      return true;
    } catch (error) {
      console.error('Lỗi xóa:', error);
      Swal.fire('Lỗi', 'Không thể xóa', 'error');
      return false;
    }
  };

  const startEditMessage = (message) => {
    setEditingId(message.id);
    setEditingContent(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  return {
    quickMessages,
    setQuickMessages,
    editingId,
    editingContent,
    setEditingContent,
    isLoadingQuickMessages,
    isSavingQuickMessages,
    loadQuickMessages,
    saveQuickMessages,
    deleteQuickMessage,
    startEditMessage,
    cancelEdit,
  };
};