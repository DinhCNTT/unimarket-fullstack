import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./EmployeeList.module.css";
// Import Icons
import { 
  Users, 
  Lock, 
  Unlock, 
  Mail, 
  Phone, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle 
} from "lucide-react";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("http://localhost:5133/api/admin/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error("❌ Lỗi khi lấy danh sách nhân viên:", error);
      toast.error("Không thể tải danh sách nhân viên");
    }
  };

  const toggleLock = async (userId, isLocked) => {
    try {
      await axios.post(`http://localhost:5133/api/admin/toggle-lock/${userId}`);
      if (!isLocked) {
        toast.warn("🔒 Đã khóa tài khoản nhân viên");
      } else {
        toast.success("✅ Đã mở khóa tài khoản");
      }
      fetchEmployees();
    } catch (error) {
      toast.error("❌ Lỗi hệ thống, vui lòng thử lại!");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />

      <header className={styles.header}>
        <h2 className={styles.title}>
          <Users className={styles.titleIcon} size={28} />
          Quản Lý Nhân Viên
        </h2>
        {/* Nghĩa có thể thêm nút "Thêm nhân viên" ở đây sau này */}
      </header>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ Tên</th>
                <th>Liên Hệ</th>
                <th>Chức Vụ</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.userId}>
                    <td><strong>{emp.employeeCode || "---"}</strong></td>
                    <td>{emp.fullName || "N/A"}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={14} color="#888" /> {emp.email}
                        </span>
                        <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={14} color="#888" /> {emp.phoneNumber}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheck size={16} color="#ffca00" />
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      {emp.isLocked ? (
                        <span className={`${styles.badge} ${styles.locked}`}>
                          <Lock size={12} /> Bị khóa
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.active}`}>
                          <UserCheck size={12} /> Hoạt động
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleLock(emp.userId, emp.isLocked)}
                        className={`${styles.btn} ${emp.isLocked ? styles.btnUnlock : styles.btnLock}`}
                      >
                        {emp.isLocked ? (
                          <><Unlock size={16} /> Mở khóa</>
                        ) : (
                          <><Lock size={16} /> Khóa</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className={styles.noData}>
                      <AlertCircle size={48} color="#ccc" style={{ marginBottom: '10px' }} />
                      <p>Chưa có dữ liệu nhân viên nào để hiển thị.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;