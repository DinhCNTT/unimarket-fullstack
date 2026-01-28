import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Import Icons ---
import { FaUser, FaPhone, FaLock, FaEye, FaEyeSlash, FaBriefcase, FaUserPlus, FaSearch } from "react-icons/fa";

// --- Import CSS Module ---
import styles from "./AddEmployee.module.css";

const AddEmployee = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [fullName, setFullName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Employee");
    const [showPassword, setShowPassword] = useState(false);

    // --- Style Custom ---
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: "8px",
            borderColor: state.isFocused ? "#ffca00" : "#e0e0e0",
            boxShadow: state.isFocused ? "0 0 0 3px rgba(255, 202, 0, 0.2)" : "none",
            padding: "4px",
            "&:hover": { borderColor: "#ffca00" }
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? "#ffca00" : state.isFocused ? "#fff8cc" : "#fff",
            color: state.isSelected ? "#000" : "#333",
            cursor: "pointer",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#999",
            fontSize: "14px"
        })
    };

    // --- Hàm fetch data ---
    const fetchUsers = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/users");
            setEmployees(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Lỗi lấy danh sách user:", err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --- XỬ LÝ KHI CHỌN EMAIL ---
    const handleSelectEmail = (selectedOption) => {
        console.log("👉 Đã chọn User:", selectedOption.value);
        setSelectedEmail(selectedOption);
        
        const selectedEmployee = employees.find(emp => emp.email === selectedOption.value);
        
        if (selectedEmployee) {
            setFullName(selectedEmployee.fullName || "");
            setPhoneNumber(selectedEmployee.phoneNumber || "");
            setPassword(""); // Luôn reset pass

            // 🔥 FIX LOGIC NHẬN DIỆN ROLE (Chuẩn hóa)
            const rawRole = selectedEmployee.role || selectedEmployee.Role || "Employee";
            let normalizedRole = "Employee"; // Mặc định

            // Kiểm tra chuỗi chứa từ khóa (không phân biệt hoa thường)
            const roleLower = rawRole.toString().toLowerCase();
            if (roleLower.includes("admin")) normalizedRole = "Admin";
            else if (roleLower.includes("employee") || roleLower.includes("nhanvien")) normalizedRole = "Employee";
            else if (roleLower.includes("user")) normalizedRole = "User";

            console.log(`🔍 Role gốc: '${rawRole}' -> Set form thành: '${normalizedRole}'`);
            setRole(normalizedRole);
        }
    };

    // --- XỬ LÝ SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 🛠 LOG DEBUG: Xem chính xác Frontend đang gửi cái gì
        console.log("🚀 Bắt đầu gửi dữ liệu...");
        console.log("- Email:", selectedEmail?.value);
        console.log("- Role đang chọn:", role); // <--- KIỂM TRA DÒNG NÀY TRONG CONSOLE F12

        if (!fullName || !selectedEmail || !phoneNumber) {
            toast.warning("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        const newEmployee = {
            fullName,
            email: selectedEmail.value,
            phoneNumber,
            password, // Backend sẽ check nếu rỗng thì bỏ qua
            role,     // Phải chắc chắn biến này là Role mới
        };

        console.log("📦 Payload gửi đi:", newEmployee);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://localhost:5133/api/admin/add-or-update-employee",
                newEmployee,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("✅ Kết quả từ Server:", res.data);
            toast.success(res.data.message || "Thao tác thành công!");
            
            // Reload lại danh sách user để cập nhật role mới nhất từ DB
            await fetchUsers(); 

            // Reset form
            setSelectedEmail(null);
            setFullName("");
            setPhoneNumber("");
            setPassword("");
            setRole("Employee");
        } catch (err) {
            console.error("❌ Lỗi API:", err);
            const msg = err.response?.data?.message || "Có lỗi xảy ra!";
            toast.error(msg);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Thêm / Cập Nhật Nhân Viên</h2>
            </div>

            <div className={styles.card}>
                <form className={styles.formGrid} onSubmit={handleSubmit}>
                    
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label className={styles.label}><FaSearch color="#ffca00"/> Chọn Email Tài Khoản:</label>
                        <Select
                            options={employees.map((emp) => ({
                                value: emp.email,
                                label: emp.email,
                            }))}
                            value={selectedEmail}
                            onChange={handleSelectEmail}
                            placeholder="Nhập email để tìm kiếm..."
                            isSearchable
                            styles={customSelectStyles}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaUser color="#ffca00"/> Họ và Tên:</label>
                        <div className={styles.inputWrapper}>
                            <FaUser className={styles.inputIcon} />
                            <input 
                                className={styles.input}
                                type="text" 
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} 
                                placeholder="Nhập họ tên..."
                                required 
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaPhone color="#ffca00"/> Số Điện Thoại:</label>
                        <div className={styles.inputWrapper}>
                            <FaPhone className={styles.inputIcon} />
                            <input 
                                className={styles.input}
                                type="text" 
                                value={phoneNumber} 
                                onChange={(e) => setPhoneNumber(e.target.value)} 
                                placeholder="Nhập số điện thoại..."
                                required 
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaLock color="#ffca00"/> Mật Khẩu:</label>
                        <div className={styles.inputWrapper}>
                            <FaLock className={styles.inputIcon} />
                            <input 
                                className={styles.input}
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="Nhập pass mới (để trống nếu giữ nguyên)" 
                            />
                            <span 
                                className={styles.togglePass}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEye /> : <FaEyeSlash />}
                            </span>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaBriefcase color="#ffca00"/> Chức Vụ:</label>
                        <div className={styles.inputWrapper}>
                            <FaBriefcase className={styles.inputIcon} />
                            <select 
                                className={styles.input} 
                                value={role} 
                                onChange={(e) => {
                                    console.log("🔄 Đổi role thành:", e.target.value);
                                    setRole(e.target.value);
                                }} 
                                required
                            >
                                <option value="Admin">Admin (Quản trị viên)</option>
                                <option value="Employee">Employee (Nhân viên)</option>
                                <option value="User">User (Người dùng)</option>
                            </select>
                        </div>
                    </div>

                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <button type="submit" className={styles.btnSubmit}>
                            <FaUserPlus size={20} />
                            Lưu Thông Tin
                        </button>
                    </div>

                </form>
            </div>
            
            <ToastContainer autoClose={2000} position="top-right"/>
        </div>
    );
};

export default AddEmployee;