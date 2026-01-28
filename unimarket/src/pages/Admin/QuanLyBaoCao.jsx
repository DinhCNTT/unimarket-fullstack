import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../components/NotificationsModals/context/NotificationContext';
// Import styles & Icons
import styles from './QuanLyBaoCao.module.css';
import { 
    Flag, Trash2, AlertTriangle, CheckCircle, XCircle, 
    Ban, ShieldAlert, Search, Filter, Loader2 
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5133';

export default function QuanLyBaoCao() {
  const { user, token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  
  // State bộ lọc
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, resolved

  const fetchReports = async () => {
    setLoading(true);
    try {
      const t = user?.token || localStorage.getItem('token') || token;
      // Gọi API lấy report, page size lớn để demo, thực tế nên phân trang UI
      const url = `${API_BASE.replace(/\/$/, '')}/api/reports?page=1&pageSize=200`;
      const res = await axios.get(url, {
        headers: t ? { Authorization: `Bearer ${t}` } : {}
      });
      setReports(res.data.items || []);
    } catch (err) {
      console.error('Lỗi khi lấy báo cáo', err);
      toast.error('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Listen for real-time incoming reports
  const { reportReceived, clearReport } = useContext(NotificationContext);
  useEffect(() => {
    if (!reportReceived) return;
    try {
      const r = {
        MaBaoCao: reportReceived.id,
        reporterId: reportReceived.reporterId,
        targetType: reportReceived.targetType,
        targetId: reportReceived.targetId,
        reason: reportReceived.reason,
        details: reportReceived.details,
        createdAt: reportReceived.createdAt,
        isResolved: false,
        reporter: { fullName: reportReceived.reporterName || reportReceived.reporterId }
      };
      setReports((prev) => [r, ...prev]);
      toast.info("Có báo cáo vi phạm mới!");
    } catch (e) {
      console.warn('Error handling live report', e);
    } finally {
      clearReport();
    }
  }, [reportReceived]);

  const handleAction = async (reportId, action) => {
    // Custom confirm messages
    let confirmMsg = 'Bạn có chắc chắn thực hiện hành động này?';
    if (action === 'warn') confirmMsg = 'Gửi thông báo cảnh báo tới người bán?';
    if (action === 'delete') confirmMsg = 'XÓA tin đăng này vĩnh viễn? Hành động này không thể hoàn tác!';
    if (action === 'ban') confirmMsg = 'KHÓA tài khoản người đăng bài này trong 30 ngày?';

    if (!window.confirm(confirmMsg)) return;

    setProcessing(`${reportId}:${action}`);
    try {
      const t = user?.token || localStorage.getItem('token') || token;
      let url = `${API_BASE.replace(/\/$/, '')}/api/reports/${reportId}`;
      
      if (action === 'dismiss') url = `${url}/dismiss`;
      if (action === 'delete') url = `${url}/delete-post`;
      if (action === 'ban') url = `${url}/ban-user?days=30`; // Default 30 days
      if (action === 'warn') url = `${url}/warn-seller`;

      const body = action === 'dismiss' ? null : {};
      const res = await axios.post(url, body, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
      
      toast.success(res.data?.message || 'Thao tác thành công');
      await fetchReports(); // Reload data
    } catch (err) {
      console.error('Action error', err);
      toast.error(err?.response?.data?.message || 'Lỗi khi thực hiện hành động');
    } finally {
      setProcessing(null);
    }
  };

  // Helper convert lý do sang tiếng Việt
  const getReasonText = (reason) => {
    const map = {
      'rac': 'Spam / Tin rác',
      'noidungkhongphuhop': 'Nội dung không phù hợp',
      'quayroi': 'Quấy rối / Lăng mạ',
      'khac': 'Lý do khác'
    };
    return map[reason] || reason || 'Không rõ';
  };

  // Logic lọc danh sách
  const filteredReports = reports.filter(r => {
    if (filterStatus === 'pending') return !r.isResolved;
    if (filterStatus === 'resolved') return r.isResolved;
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <ShieldAlert size={32} color="#ffca00" />
          <h2 className={styles.title}>Quản Lý Báo Cáo Vi Phạm</h2>
        </div>
        
        {/* Filter Toolbar */}
        <div className={styles.filters}>
            <div style={{ position: 'relative' }}>
                <Filter size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#888'}}/>
                <select 
                    className={styles.select} 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ paddingLeft: 32 }}
                >
                    <option value="all">Tất cả báo cáo</option>
                    <option value="pending">Chờ xử lý (Mới)</option>
                    <option value="resolved">Đã xử lý</option>
                </select>
            </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className={styles.card}>
        {loading ? (
          <div className={styles.loading}>
            <Loader2 className="animate-spin" size={40} color="#ffca00" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Đối tượng</th>
                  <th>Người báo cáo</th>
                  <th>Lý do</th>
                  <th>Chi tiết</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                        <div className={styles.empty}>
                            <CheckCircle size={40} color="#ddd" />
                            <p>Không có báo cáo nào phù hợp.</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map(r => {
                    const idVal = r.MaBaoCao ?? r.maBaoCao ?? r.id;
                    const isProcessing = (act) => processing === `${idVal}:${act}`;
                    const isDisabled = r.isResolved || processing !== null;

                    return (
                      <tr key={idVal}>
                        <td><strong>#{idVal}</strong></td>
                        <td>
                            <span style={{ fontWeight: 500 }}>
                                {r.targetType === 0 ? 'Tin đăng' : 'Video'} #{r.targetId}
                            </span>
                        </td>
                        <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 10 }}>
                                    👤
                                </div>
                                {r.reporter?.fullName || 'Ẩn danh'}
                            </div>
                        </td>
                        <td>{getReasonText(r.reason)}</td>
                        <td className={styles.detailsCell} title={r.details}>
                            {r.details || <span style={{color: '#999', fontStyle: 'italic'}}>Không có mô tả</span>}
                        </td>
                        <td>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                        <td>
                          {r.isResolved ? (
                            <span className={`${styles.badge} ${styles.badgeResolved}`}>
                              <CheckCircle size={12} /> Đã xử lý
                            </span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgePending}`}>
                              <AlertTriangle size={12} /> Chờ xử lý
                            </span>
                          )}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            {/* Nút Xóa bài */}
                            <button 
                                className={`${styles.actionBtn} ${styles.btnDelete}`}
                                onClick={() => handleAction(idVal, 'delete')}
                                disabled={isDisabled}
                                title="Xóa bài viết vi phạm"
                            >
                                {isProcessing('delete') ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={18} />}
                            </button>

                            {/* Nút Cảnh báo */}
                            <button 
                                className={`${styles.actionBtn} ${styles.btnWarn}`}
                                onClick={() => handleAction(idVal, 'warn')}
                                disabled={isDisabled}
                                title="Gửi cảnh báo cho người bán"
                            >
                                {isProcessing('warn') ? <Loader2 size={16} className="animate-spin"/> : <Flag size={18} />}
                            </button>

                            {/* Nút Ban User (Mới thêm) */}
                            <button 
                                className={`${styles.actionBtn} ${styles.btnBan}`}
                                onClick={() => handleAction(idVal, 'ban')}
                                disabled={isDisabled}
                                title="Khóa tài khoản người đăng (30 ngày)"
                            >
                                {isProcessing('ban') ? <Loader2 size={16} className="animate-spin"/> : <Ban size={18} />}
                            </button>

                            {/* Nút Bỏ qua */}
                            <button 
                                className={`${styles.actionBtn} ${styles.btnDismiss}`}
                                onClick={() => handleAction(idVal, 'dismiss')}
                                disabled={isDisabled}
                                title="Bỏ qua / Đánh dấu đã xử lý"
                            >
                                {isProcessing('dismiss') ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}