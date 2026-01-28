import { useState, useEffect } from "react"; 
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./AddParentCategory.module.css";
import { 
    FolderPlus, 
    Image as ImageIcon, 
    Layers, 
    PlusCircle, 
    LayoutGrid, 
    CheckCircle, 
    Info, 
    X 
} from "lucide-react";

const AddParentCategory = () => {
    const [tenDanhMucCha, setTenDanhMucCha] = useState("");
    const [anhDanhMucCha, setAnhDanhMucCha] = useState(null);
    const [icon, setIcon] = useState(null);
    const [categories, setCategories] = useState([]);
    
    // State cho Modal Preview
    const [previewData, setPreviewData] = useState({ isOpen: false, url: "", title: "" });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-parent-categories");
            setCategories(res.data);
        } catch (error) {
            console.error("Lỗi:", error);
            toast.error("Không thể tải danh sách danh mục");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("tenDanhMucCha", tenDanhMucCha);
        if (anhDanhMucCha) formData.append("anhDanhMucCha", anhDanhMucCha);
        if (icon) formData.append("icon", icon);

        try {
            await axios.post("http://localhost:5133/api/admin/add-parent-category", formData);
            toast.success("Thêm danh mục thành công!");
            
            // Reset form
            setTenDanhMucCha("");
            setAnhDanhMucCha(null);
            setIcon(null);
            
            // Reset input file bằng cách query selector (vì input file là uncontrolled component)
            document.querySelectorAll('input[type="file"]').forEach(input => input.value = "");

            fetchCategories();
        } catch (error) {
            toast.error("Lỗi khi thêm danh mục! Vui lòng kiểm tra lại.");
        }
    };

    // --- FIX 1: Hàm mở xem trước ---
    // Backend đã trả về URL đầy đủ, không cần nối chuỗi thủ công nữa
    const openPreview = (url, title) => {
        if (!url) {
            toast.info("Chưa có hình ảnh/icon cho danh mục này");
            return;
        }
        setPreviewData({ isOpen: true, url: url, title: title });
    };

    return (
        <div className={styles.page}>
            <ToastContainer autoClose={2000} />
            
            <h2 className={styles.title}>
                <FolderPlus className={styles.titleIcon} size={32} />
                Quản Lý Danh Mục Cha
            </h2>

            <div className={styles.content}>
                {/* CỘT TRÁI: FORM THÊM */}
                <div className={styles.card}>
                    <h3 className={styles.cardHeader}>
                        <PlusCircle size={20} color="#ffca00" /> Thêm mới
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label><Layers size={14} /> Tên danh mục</label>
                            <input 
                                className={styles.input} 
                                type="text" 
                                placeholder="Ví dụ: Đồ điện tử..." 
                                value={tenDanhMucCha} 
                                onChange={(e) => setTenDanhMucCha(e.target.value)} 
                                required 
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label><ImageIcon size={14} /> Ảnh danh mục</label>
                            <input 
                                className={styles.fileInput} 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setAnhDanhMucCha(e.target.files[0])} 
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label><LayoutGrid size={14} /> Icon danh mục</label>
                            <input 
                                className={styles.fileInput} 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setIcon(e.target.files[0])} 
                            />
                        </div>

                        <button className={styles.submitBtn} type="submit">
                            <CheckCircle size={18} /> Xác nhận thêm
                        </button>
                    </form>
                </div>

                {/* CỘT PHẢI: DANH SÁCH + PREVIEW */}
                <div className={styles.card}>
                    <h3 className={styles.cardHeader}>
                        <Info size={20} color="#ffca00" /> Danh sách danh mục
                    </h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Tên Danh Mục</th>
                                <th>Xem nhanh</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat, index) => (
                                <tr key={cat.maDanhMucCha}>
                                    <td style={{ color: '#999' }}>{index + 1}</td>
                                    <td><strong>{cat.tenDanhMucCha}</strong></td>
                                    <td>
                                        <div className={styles.previewActions}>
                                            <button 
                                                className={styles.btnPreview} 
                                                onClick={() => openPreview(cat.anhDanhMucCha, "Ảnh danh mục")}
                                            >
                                                <ImageIcon size={14} /> Ảnh
                                            </button>
                                            <button 
                                                className={styles.btnPreview} 
                                                onClick={() => openPreview(cat.icon, "Icon danh mục")}
                                            >
                                                <LayoutGrid size={14} /> Icon
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- FIX 2: MODAL PREVIEW & CHẶN VÒNG LẶP LỖI --- */}
            {previewData.isOpen && (
                <div 
                    className={styles.modalOverlay} 
                    onClick={() => setPreviewData({ ...previewData, isOpen: false })}
                >
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button 
                            className={styles.closeBtn} 
                            onClick={() => setPreviewData({ ...previewData, isOpen: false })}
                        >
                            <X size={20} color="#333" />
                        </button>
                        
                        <h4 style={{ marginBottom: '15px' }}>{previewData.title}</h4>
                        
                        <img 
                            src={previewData.url} 
                            alt="Preview" 
                            className={styles.previewImg} 
                            onError={(e) => { 
                                e.target.onerror = null; // Ngắt vòng lặp vô tận
                                e.target.src = "https://placehold.co/400x400?text=Loi+Anh"; // Ảnh thay thế ổn định
                            }} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddParentCategory;