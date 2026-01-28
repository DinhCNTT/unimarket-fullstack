import { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Import React Icons ---
import { FaLock, FaUnlock, FaTrash, FaSpinner } from "react-icons/fa";

// Import CSS Module
import styles from "./AdminDashboard.module.css";

const API_URL = "http://localhost:5133/api/admin";

const AdminDashboard = () => {
    // --- State Management ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null); // Lưu ID user đang được xử lý để hiện loading riêng cho dòng đó

    // --- Fetch Data ---
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/users`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                withCredentials: true,
            });
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Fetch error:", error);
            setError("Không thể tải danh sách người dùng. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    // --- Handle Delete ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Cảnh báo: Hành động này không thể hoàn tác!\nBạn có chắc chắn muốn xóa người dùng này?")) return;
        
        setProcessingId(userId);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/delete-user/${userId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                withCredentials: true,
            });
            
            // Cập nhật UI ngay lập tức
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            toast.success("Đã xóa người dùng thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Lỗi: Không thể xóa người dùng.");
        } finally {
            setProcessingId(null);
        }
    };

    // --- Handle Toggle Lock ---
    const handleToggleLock = async (userId, isLocked) => {
        const actionName = isLocked ? "mở khóa" : "khóa";
        if (!window.confirm(`Xác nhận ${actionName} tài khoản này?`)) return;

        setProcessingId(userId);
        try {
            const token = localStorage.getItem("token");
            // Gọi API toggle-lock (POST)
            await axios.post(`${API_URL}/toggle-lock/${userId}`, {}, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                withCredentials: true,
            });

            // Cập nhật state cục bộ để UI phản hồi ngay
            setUsers((prev) => 
                prev.map((u) => u.id === userId ? { ...u, isLocked: !isLocked } : u)
            );
            toast.success(`Đã ${actionName} tài khoản thành công!`);
        } catch (error) {
            console.error(error);
            toast.error(`Lỗi: Không thể ${actionName} tài khoản.`);
        } finally {
            setProcessingId(null);
        }
    };

    // --- Render Loading / Error ---
    if (loading) return <div className={styles.loading}>Đang tải dữ liệu...</div>;
    
    // --- Render Main Content ---
    return (
        <div className={styles.container}>
            <ToastContainer autoClose={2000} position="top-right" />
            
            <div className={styles.header}>
                <h2 className={styles.title}>Quản Lý Người Dùng</h2>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th} style={{width: '60px', textAlign: 'center'}}>STT</th>
                            <th className={styles.th}>Email</th>
                            <th className={styles.th}>Họ Tên</th>
                            <th className={styles.th}>Số Điện Thoại</th>
                            <th className={styles.th} style={{width: '120px', textAlign: 'center'}}>Vai Trò</th>
                            <th className={styles.th} style={{width: '220px', textAlign: 'right'}}>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="6" className={styles.empty}>Chưa có người dùng nào.</td>
                            </tr>
                        ) : (
                            users.map((user, index) => {
                                const isProcessing = processingId === user.id;

                                return (
                                    <tr key={user.id} className={styles.tr}>
                                        <td className={styles.td} align="center">{index + 1}</td>
                                        <td className={styles.td}>
                                            <strong>{user.email}</strong>
                                        </td>
                                        <td className={styles.td}>{user.fullName || "---"}</td>
                                        <td className={styles.td}>{user.phoneNumber || "---"}</td>
                                        
                                        <td className={styles.td} align="center">
                                            <span className={`${styles.badge} ${user.role === 'Admin' ? styles.badgeAdmin : styles.badgeUser}`}>
                                                {user.role}
                                            </span>
                                        </td>

                                        <td className={styles.td}>
                                            <div className={styles.actions}>
                                                {/* Nút Khóa / Mở Khóa */}
                                                <button
                                                    className={`${styles.btn} ${user.isLocked ? styles.btnUnlock : styles.btnLock}`}
                                                    onClick={() => handleToggleLock(user.id, user.isLocked)}
                                                    disabled={isProcessing}
                                                    title={user.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản này"}
                                                >
                                                    {/* Icon logic: Nếu đang xử lý thì xoay, không thì hiện icon khóa/mở */}
                                                    {isProcessing ? <FaSpinner className={styles.spin} /> : (user.isLocked ? <FaUnlock /> : <FaLock />)}
                                                    
                                                    {/* Text logic */}
                                                    {user.isLocked ? "Mở Khóa" : "Khóa"}
                                                </button>
                                                
                                                {/* Nút Xóa */}
                                                <button
                                                    className={`${styles.btn} ${styles.btnDelete}`}
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={isProcessing}
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    {isProcessing ? <FaSpinner className={styles.spin} /> : <FaTrash />}
                                                    {isProcessing ? "Xử lý..." : "Xóa"}
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
        </div>
    );
};

export default AdminDashboard;