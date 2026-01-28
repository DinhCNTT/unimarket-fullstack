import React, { useContext, useEffect, useState } from "react";
import { NotificationContext } from "./context/NotificationContext";
import { useNavigate } from "react-router-dom";
import NotificationDetailModal from "./NotificationDetailModal";
import notificationsStyles from "../../styles/Notifications.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5133";

export default function NotificationsDropdown() {
  const { notifications, unreadCount, loading, markAsRead } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [titles, setTitles] = useState({}); // map postId -> title
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter to show ONLY admin-sent notifications in dropdown (report warnings and deletions)
  const displayedNotifications = notifications.filter(n => n.isFromAdmin === true);
  // Calculate unread count for only displayed notifications
  const displayedUnreadCount = displayedNotifications.filter(n => !n.isRead).length;

  // Pre-fetch titles for post notifications (so we can show post title instead of 'Mã')
  useEffect(() => {
    const toFetch = [];
    for (const n of notifications) {
      if (n.url && typeof n.url === 'string' && n.url.startsWith('/posts/')) {
        const id = n.url.split('/posts/')[1];
        if (id && !titles[id]) toFetch.push(id);
      }
    }
    if (toFetch.length === 0) return;
    let mounted = true;
    (async () => {
      const newTitles = {};
      for (const id of Array.from(new Set(toFetch))) {
        try {
          const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/TinDang/get-post/${id}`);
          if (!res.ok) continue;
          const data = await res.json();
          // controller returns full post object or wrapper depending on endpoint
          const post = data && (data.post || data.Post) ? (data.post || data.Post) : data;
          newTitles[id] = post?.TieuDe || post?.tieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || post?.TieuDe || 'Tin đăng';
        } catch (e) {
          // ignore
        }
      }
      if (mounted && Object.keys(newTitles).length) setTitles((s) => ({ ...s, ...newTitles }));
    })();
    return () => { mounted = false; };
  }, [notifications]);

  const openDetail = (n) => {
    if (!n.isRead) markAsRead(n.id);
    setSelected(n);
    setModalOpen(true);
  };

  const handleClick = (n) => {
    // If this is a post notification, show the detail modal first
    if (n.url && typeof n.url === 'string' && n.url.startsWith('/posts/')) {
      openDetail(n);
      return;
    }

    // otherwise, mark read and navigate as before
    if (!n.isRead) markAsRead(n.id);
    if (n.url) {
      let target = n.url;
      try {
        if (typeof target === 'string') {
          if (target.startsWith('/posts/')) {
            const id = target.split('/posts/')[1];
            target = `/tin-dang/${id}`;
          } else if (target.startsWith('/videos/')) {
            const id = target.split('/videos/')[1];
            target = `/video/${id}`;
          }
        }
      } catch (e) { /* fallback */ }
      navigate(target);
    }
  };

  const handleGoToPostFromModal = (n) => {
    if (!n || !n.url) return;
    const id = n.url.split('/posts/')[1];
    setModalOpen(false);
    navigate(`/tin-dang/${id}`);
  };

  return (
    <div className={notificationsStyles.umNotifDropdown}>
      <div className={notificationsStyles.umNotifHeader}>
        <strong>Thông báo</strong>
        <span className={notificationsStyles.umNotifCount}>{displayedUnreadCount || 0}</span>
      </div>

      {loading && <div className={notificationsStyles.umNotifLoading}>Đang tải...</div>}

      {!loading && displayedNotifications.length === 0 && (
        <div className={notificationsStyles.umNotifEmpty}>Chưa có thông báo</div>
      )}

      <ul className={notificationsStyles.umNotifList}>
        {displayedNotifications.map((n) => {

          let displayTitle = n.title;
          // prefer snapshot title from server if present
          if (n.postTitle) {
            displayTitle = n.postTitle;
          } else if (n.url && typeof n.url === 'string' && n.url.startsWith('/posts/')) {
            const id = n.url.split('/posts/')[1];
            if (titles[id]) displayTitle = titles[id];
            else displayTitle = 'Tin đăng';
          }
          // For the dropdown list we only show a short summary: strip any 'Lý do:' and 'Chi tiết:' portions
          const rawMessage = (n.message || '').toString();
          let summary = rawMessage.split(/Lý do:/i)[0].trim();
          summary = summary.split(/Chi tiết:/i)[0].trim();

          // detect notification 'type' by message/title content so we can style
          const lcTitle = (n.title || '').toString().toLowerCase();
          const lcMsg = rawMessage.toLowerCase();
          let typeClass = '';
          if (lcTitle.includes('cảnh báo') || lcMsg.includes('cảnh báo') || lcMsg.includes('báo cáo')) {
            typeClass = notificationsStyles.warning;
          } else if (lcMsg.includes('đã xóa') || lcMsg.includes('bị xóa') || lcMsg.includes('xoá') || lcMsg.includes('xóa')) {
            typeClass = notificationsStyles.deleted;
          }

          return (
              <li key={n.id} className={`${notificationsStyles.umNotifItem} ${n.isRead ? notificationsStyles.read : notificationsStyles.unread} ${typeClass}`} onClick={() => handleClick(n)}>
                {n.postImageUrl && <img src={n.postImageUrl} alt="" className={notificationsStyles.umNotifThumb} />}
                <div className={notificationsStyles.umNotifBody}>
                  <div className={notificationsStyles.umNotifMessage}>{summary}</div>
                  <div className={notificationsStyles.umNotifTime}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </li>
            );
        })}
      </ul>

      <NotificationDetailModal
        open={modalOpen}
        notification={selected}
        postTitle={selected ? (selected.postTitle || (selected.url && selected.url.startsWith('/posts/') ? titles[selected.url.split('/posts/')[1]] : null)) : null}
        postImageUrl={selected ? selected.postImageUrl : null}
        onClose={() => setModalOpen(false)}
        onGoToPost={() => handleGoToPostFromModal(selected)}
      />
    </div>
  );
}
