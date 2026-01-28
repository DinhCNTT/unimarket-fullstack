import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaHome, FaUserPlus, FaUsersCog, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { MdCategory, MdFolderOpen, MdPostAdd } from "react-icons/md";
import "./Sidebar.css";

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, setUser } = useContext(AuthContext); // lấy setUser để reset khi logout

    const handleLogout = () => {
        // ✅ Xóa token hoặc thông tin login
        localStorage.removeItem("token"); // nếu bạn lưu token local
        setUser(null); // reset context user
        navigate("/login"); // chuyển về trang login
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="avatar-container">
                    <FaUserCircle className="avatar-icon" />
                </div>
                <p className="welcome-text">Xin chào, {user?.fullName || "Admin"}!</p>
            </div>

            <ul className="sidebar-menu">
                <li onClick={() => navigate("/admin")}>
                    <FaHome className="menu-icon" /> <span className="menu-label">Quản Lý Người Dùng</span>
                </li>
                <li onClick={() => navigate("/admin/add-employee")}>
                    <FaUserPlus className="menu-icon" /> <span className="menu-label">Phân quyền user</span>
                </li>
                <li onClick={() => navigate("/admin/employees")}>
                    <FaUsersCog className="menu-icon" /> <span className="menu-label">Quản Lý Nhân Viên</span>
                </li>
                <li onClick={() => navigate("/admin/categories")}>
                    <MdCategory className="menu-icon" /> <span className="menu-label">Thêm Danh Mục</span>
                </li>
                <li onClick={() => navigate("/admin/add-parent-category")}>
                    <MdCategory className="menu-icon" /> <span className="menu-label">Thêm Danh Mục Cha</span>
                </li>
                <li onClick={() => navigate("/admin/manage-categories")}>
                    <MdFolderOpen className="menu-icon" /> <span className="menu-label">Quản Lý Danh Mục Cha</span>
                </li>
                <li onClick={() => navigate("/admin/manage-subcategories")}>
                    <MdFolderOpen className="menu-icon" /> <span className="menu-label">Quản Lý Danh Mục Con</span>
                </li>
                <li onClick={() => navigate("/admin/manage-posts")}>
                    <MdPostAdd className="menu-icon" /> <span className="menu-label">Quản Lý Tin Đăng</span>
                </li>
                <li onClick={() => navigate("/admin/reports")}>
                    <MdPostAdd className="menu-icon" /> <span className="menu-label">Quản Lý Báo Cáo</span>
                </li>
            </ul>

            {/* Nút Đăng Xuất */}
            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt className="menu-icon" /> <span>Đăng Xuất</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
