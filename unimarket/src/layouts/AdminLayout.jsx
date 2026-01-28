// src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar"; 
import styles from "./AdminLayout.module.css"; // Import module

const AdminLayout = () => {
  return (
    <div className={styles.container}>
      {/* Sidebar cố định bên trái */}
      <div className={styles.sidebarWrapper}>
        <Sidebar />
      </div>

      {/* Nội dung thay đổi (Outlet) bên phải - Tự động lấp đầy */}
      <div className={styles.contentWrapper}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;