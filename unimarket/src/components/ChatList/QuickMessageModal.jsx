import React from 'react';
import { createPortal } from 'react-dom';
import { FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import styles from './QuickMessage.module.css';

/**
 * QuickMessageModal - Modal để quản lý tin nhắn nhanh
 * @param {object} props
 * @param {boolean} props.show - Có hiển thị modal không
 * @param {object} props.quickMessages - Danh sách tin nhắn nhanh
 * @param {string} props.editingId - ID của tin nhắn đang chỉnh sửa
 * @param {string} props.editingContent - Nội dung tin nhắn đang chỉnh sửa
 * @param {function} props.onClose - Gọi khi đóng modal
 * @param {function} props.onContentChange - Gọi khi thay đổi nội dung
 * @param {function} props.onSave - Gọi khi lưu tin nhắn
 * @param {function} props.onDelete - Gọi khi xóa tin nhắn
 * @param {function} props.onEdit - Gọi khi bắt đầu chỉnh sửa
 * @param {function} props.onCancelEdit - Gọi khi hủy chỉnh sửa
 * @param {boolean} props.isLoading - Đang load dữ liệu
 * @param {boolean} props.isSaving - Đang lưu dữ liệu
 */
const QuickMessageModal = ({
  show,
  quickMessages,
  editingId,
  editingContent,
  onClose,
  onContentChange,
  onSave,
  onDelete,
  onEdit,
  onCancelEdit,
  isLoading,
  isSaving,
}) => {
  if (!show) return null;

  const handleSave = async () => {
    await onSave(editingContent);
  };

  // --- ĐÃ SỬA: Thêm xác nhận bằng trình duyệt mặc định ---
  const handleDelete = async (id) => {
    // Hiển thị hộp thoại xác nhận mặc định của trình duyệt
    const isConfirmed = window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này không?');
    
    // Nếu người dùng chọn OK thì mới thực hiện xóa
    if (isConfirmed) {
      await onDelete(id);
    }
  };
  // ------------------------------------------------------

  const content = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h3>
            <FiMessageSquare style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Tin nhắn nhanh
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>Đang tải tin nhắn nhanh...</div>
          ) : (
            <>
              {/* Danh sách tin nhắn hiện tại */}
              {quickMessages.length > 0 ? (
                <div className={styles.list}>
                  {quickMessages.map((msg) => (
                    <div key={msg.id} className={styles.item}>
                      <p className={styles.itemContent}>
                        {msg.content || msg.Content}
                      </p>
                      <div className={styles.itemActions}>
                        <button
                          className={styles.itemBtn}
                          onClick={() => onEdit(msg)}
                          title="Chỉnh sửa"
                        >
                          ✎
                        </button>
                        <button
                          className={styles.itemBtn}
                          onClick={() => handleDelete(msg.id)}
                          title="Xóa"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>Chưa có tin nhắn nhanh nào</p>
              )}

              {/* Form thêm/sửa tin nhắn */}
              <div className={styles.form}>
                <label className={styles.formLabel}>
                  {editingId ? 'Chỉnh sửa tin nhắn' : 'Thêm tin nhắn nhanh'}
                </label>
                <textarea
                  className={styles.formInput}
                  placeholder="Nhập nội dung tin nhắn (tối đa 500 ký tự)"
                  value={editingContent}
                  onChange={(e) => onContentChange(e.target.value)}
                  maxLength={500}
                  rows={3}
                  disabled={isSaving}
                />
                <div className={styles.formFooter}>
                  <span className={styles.charCount}>
                    {editingContent.length}/500
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {editingId ? (
            <div className={styles.editActions}>
              <button
                className={styles.btnCancel}
                onClick={onCancelEdit}
                disabled={isSaving}
              >
                Hủy
              </button>
              <button
                className={styles.btnUpdate}
                onClick={handleSave}
                disabled={isSaving || !editingContent.trim()}
              >
                {isSaving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          ) : (
            <button
              className={styles.btnAdd}
              onClick={handleSave}
              disabled={isSaving || !editingContent.trim()}
            >
              {isSaving ? 'Đang lưu...' : 'Thêm tin nhắn'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default QuickMessageModal;