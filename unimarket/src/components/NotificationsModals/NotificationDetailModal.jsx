import React from 'react';
import './NotificationDetailModal.css';

export default function NotificationDetailModal({ open, notification, postTitle, postImageUrl, onClose, onGoToPost }) {
  if (!open || !notification) return null;

  const msg = (notification.message || '').toString();

  // Try to extract reason and details from the server-generated message
  const reasonMatch = msg.match(/Lý do:\s*'([^']+)'/i);
  const detailsMatch = msg.match(/Chi tiết:\s*'([^']+)'/i);
  const reason = reasonMatch ? reasonMatch[1] : null;
  const details = detailsMatch ? detailsMatch[1] : null;

  const mapReason = (v) => {
    if (!v) return v;
    const key = (v||'').toString();
    const map = {
      'rac': 'Spam/Tin rác',
      'noidungkhongphuhop': 'Nội Dung Không Phù Hợp',
      'quayroi': 'Quấy Rối / Lăng Mạ',
      'khac': 'Khác'
    };
    return map[key] || key;
  };

  // If we extracted reason/details, avoid repeating the full message body which already contains them.
  const showFullMessage = !reason && !details;

  return (
    <div className="um-notif-modal-overlay" role="dialog" aria-modal="true">
      <div className="um-notif-modal">
        {postImageUrl && (
          <div style={{ marginBottom: 12 }}>
            <img src={postImageUrl} alt="" className="um-notif-modal-thumb" />
          </div>
        )}
        <h3 className="um-notif-modal-title">{postTitle ? `Tin đăng: ${postTitle}` : notification.title}</h3>
        <div className="um-notif-modal-body">
          {/* Always show a Reason + Detailed Description section for report notifications */}
          <div className="um-notif-reason"><strong>Lý do:</strong> {mapReason(reason || (notification.reason || ''))}</div>
          <div className="um-notif-details"><strong>Mô tả chi tiết lý do báo cáo:</strong> {details || notification.details || (notification.message || '').toString()}</div>
          <div className="um-notif-modal-time">{new Date(notification.createdAt).toLocaleString()}</div>
        </div>
        <div className="um-notif-modal-actions">
          <button className="um-btn um-btn-primary" onClick={() => onGoToPost && onGoToPost()}>
            Chuyển tới tin đăng
          </button>
          <button className="um-btn" onClick={() => onClose && onClose()}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
