import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Import Icons ---
import { FaLayerGroup, FaFolderOpen, FaPlusCircle, FaSpinner } from "react-icons/fa";

// --- Import CSS Module ---
import styles from "./CategoryForm.module.css";

const CategoryForm = () => {
    const [tenDanhMuc, setTenDanhMuc] = useState("");
    const [selectedParent, setSelectedParent] = useState(null); // State cho React-Select
    const [parentCategories, setParentCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Style Custom cho React-Select (Màu vàng #ffca00) ---
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

    // Fetch danh mục cha
    useEffect(() => {
        axios.get("http://localhost:5133/api/admin/get-parent-categories")
            .then((response) => {
                setParentCategories(response.data);
            })
            .catch((error) => {
                console.error("Lỗi:", error);
                toast.error("Không thể tải danh mục cha!");
            });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!tenDanhMuc.trim()) {
            toast.warning("Vui lòng nhập tên danh mục!");
            return;
        }

        if (!selectedParent) {
            toast.warning("Vui lòng chọn danh mục cha!");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("tenDanhMuc", tenDanhMuc.trim());
            // Lấy value từ React-Select
            formData.append("maDanhMucCha", selectedParent.value); 

            const response = await axios.post(
                "http://localhost:5133/api/admin/add-category",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" }
                }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                // Reset form
                setTenDanhMuc("");
                setSelectedParent(null);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error("Lỗi:", error.response?.data);
            const message = error.response?.data?.message || "Có lỗi xảy ra!";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Thêm Danh Mục Con</h2>
            </div>

            <div className={styles.card}>
                <form onSubmit={handleSubmit}>
                    
                    {/* --- Input Tên Danh Mục --- */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaLayerGroup color="#ffca00"/> Tên Danh Mục Con:</label>
                        <div className={styles.inputWrapper}>
                            <FaLayerGroup className={styles.inputIcon} />
                            <input 
                                className={styles.input}
                                type="text" 
                                value={tenDanhMuc} 
                                onChange={(e) => setTenDanhMuc(e.target.value)} 
                                placeholder="Ví dụ: Laptop Gaming..."
                                required 
                            />
                        </div>
                    </div>

                    {/* --- Select Danh Mục Cha (Dùng React-Select tìm kiếm được) --- */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaFolderOpen color="#ffca00"/> Thuộc Danh Mục Cha:</label>
                        <Select
                            options={parentCategories.map(cat => ({
                                value: cat.maDanhMucCha,
                                label: cat.tenDanhMucCha
                            }))}
                            value={selectedParent}
                            onChange={setSelectedParent}
                            placeholder="Gõ để tìm kiếm danh mục cha..."
                            isSearchable={true} 
                            styles={customSelectStyles}
                        />
                    </div>

                    {/* --- Nút Submit --- */}
                    <button 
                        type="submit" 
                        className={styles.btnSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <FaSpinner className={styles.spin} /> : <FaPlusCircle size={18} />}
                        {isSubmitting ? "Đang xử lý..." : "Thêm Danh Mục"}
                    </button>

                </form>
            </div>
            
            <ToastContainer autoClose={2000} position="top-right" />
        </div>
    );
};

export default CategoryForm;