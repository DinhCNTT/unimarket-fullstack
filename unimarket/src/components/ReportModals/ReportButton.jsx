import React, { useState, useContext, useEffect } from 'react';
import { FaFlag } from 'react-icons/fa';
import ReportModal from './ReportModal';
import styles from './Report.module.css';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../NotificationsModals/context/NotificationContext';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5133';

// Props: targetType: 'Post' | 'Video', targetId: number, authToken (optional), className (string)
export default function ReportButton({ targetType = 'Post', targetId, authToken, className }) {
  const [open, setOpen] = useState(false);
  const auth = useContext(AuthContext);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [checking, setChecking] = useState(true);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const token = authToken || auth?.token || localStorage.getItem('token');
  const { reportReceived } = useContext(NotificationContext);

  const currentUserId = auth?.user?.id || sessionStorage.getItem('userId');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      setChecking(true);
      try {
        const t = token;
        const url = `${API_BASE.replace(/\/$/, '')}/api/reports/exists?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`;
        const res = await fetch(url, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setAlreadyReported(!!data.exists);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setChecking(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [targetType, targetId, token]);

  // Listen for report events from SignalR (NotificationContext)
  useEffect(() => {
    try {
      if (!reportReceived) return;
      // If an incoming report matches this item and was created by current user, mark as reported
      const incoming = reportReceived;
      const sameTarget = (String(incoming.targetType || '') === String(targetType || '')) && (String(incoming.targetId || '') === String(targetId || ''));
      const isReporter = String(incoming.reporterId || '') === String(currentUserId || '');
      if (sameTarget && isReporter) setAlreadyReported(true);
    } catch (e) {
      // ignore
    }
  }, [reportReceived, targetType, targetId, currentUserId]);

  return (
    <>
      <button onClick={openModal} className={`${styles.reportBtn} ${alreadyReported ? styles.reported : ''} ${className || ''}`} aria-label="Báo cáo" disabled={checking || alreadyReported} title={alreadyReported ? 'Bạn đã báo cáo mục này' : ''}>
        <FaFlag style={{ width: 16, height: 16 }} />
        <span>{alreadyReported ? 'Đã báo cáo' : 'Báo cáo'}</span>
      </button>
      <ReportModal open={open} onClose={closeModal} targetType={targetType} targetId={targetId} authToken={token} onReported={() => { setAlreadyReported(true); closeModal(); }} />
    </>
  );
}
