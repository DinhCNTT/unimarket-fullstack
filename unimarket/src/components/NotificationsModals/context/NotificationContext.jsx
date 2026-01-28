import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-hot-toast";
import { AuthContext } from "../../../context/AuthContext";

export const NotificationContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5133";

export const NotificationProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState(null);
  const [reportReceived, setReportReceived] = useState(null);

  const fetchNotifications = useCallback(async (page = 1, pageSize = 50) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/notifications?page=${page}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load notifications");
      const json = await res.json();
      // Deduplicate items by id (or fallback to url+title) and keep the newest per key
      const items = json.items || [];
      const map = new Map();
      for (const it of items) {
        const id = it.id ?? it.Id ?? null;
        const key = id != null ? String(id) : `${it.url || ''}::${(it.title || '').trim()}`;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, it);
        } else {
          // keep the newest by createdAt when duplicate key found
          try {
            const eDate = new Date(existing.createdAt || existing.CreatedAt || 0).getTime();
            const nDate = new Date(it.createdAt || it.CreatedAt || 0).getTime();
            if (nDate > eDate) map.set(key, it);
          } catch (e) {
            // fallback: overwrite
            map.set(key, it);
          }
        }
      }
      const unique = Array.from(map.values()).map((payload) => ({
        id: payload.id ?? payload.Id ?? payload.ID,
        title: payload.title ?? payload.Title,
        message: payload.message ?? payload.Message,
        url: payload.url ?? payload.Url,
        createdAt: payload.createdAt ?? payload.CreatedAt,
        isRead: payload.isRead ?? payload.IsRead ?? false,
        isFromAdmin: payload.isFromAdmin ?? false,
      }));
      // Keep all notifications in state, filtering will happen at UI level (NotificationsDropdown)
      setNotifications(unique);
      const unread = unique.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      // cleanup
      if (connection && connection.stop) connection.stop();
      setConnection(null);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // fetch initial notifications
    fetchNotifications();

    // start SignalR connection
    const hubUrl = `${API_BASE.replace(/\/$/, "")}/hub/notifications`;
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => {
          // always read the latest token from storage to avoid stale/token-in-closure issues
          // some apps store token in localStorage or sessionStorage — try both
          return localStorage.getItem("token") || sessionStorage.getItem("token") || token || "";
        } })
      .withAutomaticReconnect()
      .build();

    conn.on("ReceiveNotification", (payload) => {
      // normalize keys (camelCase)
      const incoming = {
        id: payload.id || payload.Id || payload.ID,
        title: payload.title || payload.Title,
        message: payload.message || payload.Message,
        url: payload.url || payload.Url,
        createdAt: payload.createdAt || payload.CreatedAt,
        isRead: payload.isRead || payload.IsRead || false,
        isFromAdmin: payload.isFromAdmin ?? false,
      };

      setNotifications((prev) => {
        // Merge incoming into existing list and dedupe by id or url+title, keeping newest
        const all = [incoming, ...prev];
        const map = new Map();
        for (const it of all) {
          const key = it.id != null ? String(it.id) : `${it.url || ''}::${(it.title || '').trim()}`;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, it);
          } else {
            try {
              const eDate = new Date(existing.createdAt || 0).getTime();
              const nDate = new Date(it.createdAt || 0).getTime();
              if (nDate > eDate) map.set(key, { ...it, isFromAdmin: it.isFromAdmin ?? existing.isFromAdmin });
            } catch (e) {
              map.set(key, it);
            }
          }
        }
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        try {
          // recalc unread count from merged list
          const newUnread = merged.filter((n) => !n.isRead).length;
          setUnreadCount(newUnread);
        } catch (e) {}
        try {
          // show a small toast notification for new incoming item
          // Only show toast if the incoming item was not present before (check prev)
          const existedBefore = prev.some((n) => (n.id != null && incoming.id != null && String(n.id) === String(incoming.id)) || ((n.url || '') === (incoming.url || '') && (n.title || '') === (incoming.title || '')));
          // Detect report-type notifications (suppress toast for these)
          const titleText = (incoming.title || "").toString();
          const msgText = (incoming.message || "").toString();
          const isReportNotification = titleText.includes("Cảnh báo về tin đăng") || msgText.includes("bị báo cáo") || msgText.includes("vừa bị báo cáo");
          // also treat legacy owner-warning titles as report-type for suppression
          const titleLc = titleText.toLowerCase();
          const isLegacyOwnerWarn = titleLc.includes('cảnh báo: tin đăng của bạn') || titleLc.includes('cảnh báo: tin đăng của bạn bị báo cáo');
          // Suppress toast for admin-sent notifications
          const isAdminSent = incoming.isFromAdmin === true;

          if (!existedBefore && !(isReportNotification || isLegacyOwnerWarn || isAdminSent)) {
            toast(`${incoming.title}: ${incoming.message}`, { duration: 4000 });
          }
        } catch (e) {
          console.warn('Toast error', e);
        }
        return merged;
      });
    });

    conn.on("ReceiveReport", (payload) => {
      try {
        // normalize minimal fields
        const incoming = {
          id: payload.id || payload.Id || null,
          reporterId: payload.reporterId || payload.ReporterId || null,
          targetType: payload.targetType || payload.TargetType || null,
          targetId: payload.targetId || payload.TargetId || null,
          reason: payload.reason || payload.Reason || null,
          details: payload.details || payload.Details || null,
          createdAt: payload.createdAt || payload.CreatedAt || new Date().toISOString()
        };
        setReportReceived(incoming);
        // If current user is an admin, show a small admin-only toast notification
        try {
          const role = (user && user.role) || (user && user.Role) || null;
          if (role && role.toString().toLowerCase() === 'admin') {
            toast(`Có báo cáo mới: Mã ${incoming.targetId}`, { duration: 5000 });
          }
        } catch (e) {
          // ignore toast errors
        }
      } catch (e) {
        console.warn('ReceiveReport parse error', e, payload);
      }
    });

    console.log("Notification hub connecting; tokenPresent=", Boolean(localStorage.getItem("token") || sessionStorage.getItem("token") || token));
    conn.start()
      .then(() => {
        console.log("Notification hub connected");
      })
      .catch((err) => {
        console.error("Notification hub failed to connect", err);
      });

    setConnection(conn);

    return () => {
      if (conn && conn.stop) {
        conn.stop().catch((e) => console.warn("Error stopping notification connection", e));
      }
    };
  }, [token, fetchNotifications]);

  const markAsRead = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/notifications/${id}/mark-read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to mark read");
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        // recalc unread accurately from updated list
        const stillUnread = updated.filter((n) => !n.isRead).length;
        setUnreadCount(stillUnread);
        return updated;
      });
    } catch (err) {
      console.error("MarkAsRead error", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, fetchNotifications, markAsRead, reportReceived, clearReport: () => setReportReceived(null) }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;