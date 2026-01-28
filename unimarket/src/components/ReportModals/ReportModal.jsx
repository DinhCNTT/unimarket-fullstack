import React, { useState } from 'react';
import useReport from './hooks/useReport';
import styles from './Report.module.css';

const defaultReasons = [
  { value: 'Spam/Tin rác', label: 'Spam/Tin rác' },
  { value: 'Nội Dung Không Phù Hợp', label: 'Nội Dung Không Phù Hợp' },
  { value: 'Quấy Rối / Lăng Mạ', label: 'Quấy Rối / Lăng Mạ' },
  { value: 'Khác', label: 'Khác' }
];

export default function ReportModal({ open, onClose, targetType, targetId, authToken, onReported }) {
  const { report } = useReport();

  const showReportSuccessBanner = () => {
    try {
      const el = document.createElement('div');
      el.className = 'um-report-success-banner';
      el.innerHTML = `<div style="display:flex;align-items:center;gap:10px"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 6L9 17l-5-5\"></path></svg><div style=\"font-weight:600;color:#fff\">Bạn đã báo cáo thành công, vui lòng chờ Quản lý viên xử lý báo cáo của bạn.</div></div>`;
      // Position just below the top navbar (if present) with a small gap
      const nav = document.querySelector('.top-navbar');
      const defaultTop = 80;
      const computedTop = nav ? Math.round((nav.getBoundingClientRect().bottom + window.scrollY) + 8) : defaultTop;
      Object.assign(el.style, {
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        top: `${computedTop}px`,
        zIndex: 2000,
        background: 'linear-gradient(180deg, #FF7A00 0%, #FF8C42 100%)',
        padding: '12px 18px',
        borderRadius: '8px',
        boxShadow: '0 8px 20px rgba(255,122,0,0.14)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#fff',
      });
      document.body.appendChild(el);
      setTimeout(() => {
        el.style.transition = 'opacity 300ms ease';
        el.style.opacity = '0';
        setTimeout(() => { try { document.body.removeChild(el); } catch (e) {} }, 300);
      }, 4500);
    } catch (e) {
      // ignore
    }
  };
  const [reason, setReason] = useState(defaultReasons[0].value);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await report({ targetType, targetId, reason, details, token: authToken });
      setLoading(false);
      onClose && onClose();
      if (typeof onReported === 'function') onReported();
      // Show a transient green success banner under the top navbar (do not add to bell icon)
      showReportSuccessBanner();
      // Optionally: show a toast in parent
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Lỗi khi gửi báo cáo');
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h3 className={styles.title}>Báo cáo nội dung</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Lý do
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={styles.select}>
              {defaultReasons.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Chi tiết (không bắt buộc)
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className={styles.textarea}
              maxLength={2000}
              placeholder="Mô tả thêm (ví dụ: đường link, thời gian, mô tả...)"
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
