import { useEffect, useRef } from 'react';

export const useChatStateMigration = (userId) => {
  const hasMigrated = useRef(false);

  useEffect(() => {
    if (!userId || hasMigrated.current) return;

    const migrateFromLocalStorage = async () => {
      try {
        // Lấy data từ localStorage
        const hiddenChats = localStorage.getItem('hiddenChats');
        const deletedChats = localStorage.getItem('deletedChats');
        
        const hiddenChatIds = hiddenChats ? JSON.parse(hiddenChats) : [];
        const deletedChatIds = deletedChats ? JSON.parse(deletedChats) : [];

        // Nếu không có data gì thì không cần migrate
        if (hiddenChatIds.length === 0 && deletedChatIds.length === 0) {
          hasMigrated.current = true;
          return;
        }

        console.log('Bắt đầu migration chat states:', {
          hidden: hiddenChatIds.length,
          deleted: deletedChatIds.length
        });

        // Gọi API migrate
        const response = await fetch('http://localhost:5133/api/chat/migrate-chat-states', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            hiddenChatIds: hiddenChatIds,
            deletedChatIds: deletedChatIds
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Migration thành công:', result.message);
          
          // Xóa localStorage sau khi migrate thành công
          localStorage.removeItem('hiddenChats');
          localStorage.removeItem('deletedChats');
          
          // Đánh dấu đã migrate để không chạy lại
          hasMigrated.current = true;
        } else {
          console.error('Migration failed:', response.status);
        }
      } catch (error) {
        console.error('Lỗi migration chat states:', error);
      }
    };

    // Delay một chút để đảm bảo component đã mount hoàn toàn
    const timeoutId = setTimeout(migrateFromLocalStorage, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [userId]);

  return hasMigrated.current;
};