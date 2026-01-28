import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./ManageCategories.module.css";
// Icons
import { 
    Layers, Plus, Edit3, Trash2, Save, X, 
    Filter, FolderOpen, Tag 
} from "lucide-react";

const ManageCategories = () => {
    // Data States
    const [categories, setCategories] = useState([]);
    const [parentCategories, setParentCategories] = useState([]);
    
    // Edit States
    const [editingCategory, setEditingCategory] = useState(null);
    const [newName, setNewName] = useState("");
    const [editParentId, setEditParentId] = useState(0);

    // Add New States (Bổ sung thêm chức năng này)
    const [addName, setAddName] = useState("");
    const [addParentId, setAddParentId] = useState(0);

    // Filter State
    const [filterParentId, setFilterParentId] = useState("all");

    useEffect(() => {
        fetchCategories();
        fetchParentCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-categories");
            setCategories(res.data);
        } catch (error) {
            toast.error("Lỗi tải danh sách danh mục con");
        }
    };

    const fetchParentCategories = async () => {
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-parent-categories");
            setParentCategories(res.data);
        } catch (error) {
            toast.error("Lỗi tải danh mục cha");
        }
    };

    // --- CHỨC NĂNG THÊM MỚI (Dựa trên Controller add-category) ---
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!addName.trim()) return toast.warning("Chưa nhập tên danh mục!");
        if (!addParentId || addParentId === 0) return toast.warning("Chưa chọn danh mục cha!");

        const formData = new FormData();
        formData.append("tenDanhMuc", addName);
        formData.append("maDanhMucCha", addParentId);

        try {
            await axios.post("http://localhost:5133/api/admin/add-category", formData);
            toast.success("Thêm mới thành công!");
            setAddName("");
            setAddParentId(0);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi thêm mới!");
        }
    };

    // --- CHỨC NĂNG SỬA ---
    const handleEdit = (category) => {
        setEditingCategory(category);
        setNewName(category.tenDanhMuc);
        setEditParentId(category.maDanhMucCha);
    };

    const handleUpdate = async () => {
        if (!newName.trim()) return toast.warning("Tên không được để trống!");

        try {
            await axios.put(
                `http://localhost:5133/api/admin/update-category/${editingCategory.maDanhMuc}`,
                {
                    tenDanhMuc: newName,
                    danhMucChaId: editParentId
                }
            );
            toast.success("Cập nhật thành công!");
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật!");
        }
    };

    // --- CHỨC NĂNG XÓA ---
    const handleDelete = async (id) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa danh mục này?")) return;
        try {
            await axios.delete(`http://localhost:5133/api/admin/delete-category/${id}`);
            toast.success("Đã xóa danh mục!");
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể xóa!");
        }
    };

    // --- HELPER: Lọc danh sách hiển thị ---
    const filteredCategories = filterParentId === "all" 
        ? categories 
        : categories.filter(c => c.maDanhMucCha === parseInt(filterParentId));

    return (
        <div className={styles.container}>
            <ToastContainer autoClose={2000} position="top-right" />
            
            <header className={styles.header}>
                <Layers size={28} color="#ffca00" />
                <h2 className={styles.title}>Quản Lý Danh Mục Con</h2>
            </header>

            <div className={styles.grid}>
                {/* CỘT TRÁI: FORM THÊM MỚI */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                        <Plus size={20} color="#ffca00" /> Thêm Danh Mục Mới
                    </h3>
                    <form onSubmit={handleAdd}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tên danh mục con</label>
                            <input 
                                className={styles.input}
                                type="text"
                                placeholder="Ví dụ: Laptop gaming..."
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Thuộc danh mục cha</label>
                            <select 
                                className={styles.select}
                                value={addParentId}
                                onChange={(e) => setAddParentId(parseInt(e.target.value))}
                            >
                                <option value={0}>-- Chọn danh mục cha --</option>
                                {parentCategories.map(p => (
                                    <option key={p.maDanhMucCha} value={p.maDanhMucCha}>{p.tenDanhMucCha}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className={styles.btnAdd}>Thêm Ngay</button>
                    </form>
                </div>

                {/* CỘT PHẢI: DANH SÁCH + BỘ LỌC */}
                <div className={styles.card}>
                    <div className={styles.cardTitle} style={{ justifyContent: 'space-between', border: 'none', width: '100%' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Tag size={20} color="#ffca00" /> Danh Sách Chi Tiết
                        </span>
                    </div>

                    {/* Bộ lọc */}
                    <div className={styles.filterSection}>
                        <Filter size={18} color="#666" />
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>Lọc theo:</span>
                        <select 
                            className={styles.select} 
                            style={{ width: 'auto', padding: '6px' }}
                            value={filterParentId}
                            onChange={(e) => setFilterParentId(e.target.value)}
                        >
                            <option value="all">Tất cả danh mục cha</option>
                            {parentCategories.map(p => (
                                <option key={p.maDanhMucCha} value={p.maDanhMucCha}>{p.tenDanhMucCha}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>STT</th>
                                    <th>Tên Danh Mục Con</th>
                                    <th>Thuộc Danh Mục Cha</th>
                                    <th style={{ textAlign: 'center', width: '120px' }}>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((cat, index) => (
                                        <tr key={cat.maDanhMuc}>
                                            <td style={{ textAlign: 'center', color: '#888' }}>{index + 1}</td>
                                            
                                            {/* Cột Tên */}
                                            <td>
                                                {editingCategory?.maDanhMuc === cat.maDanhMuc ? (
                                                    <input 
                                                        className={styles.input}
                                                        value={newName} 
                                                        onChange={(e) => setNewName(e.target.value)} 
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span style={{ fontWeight: '600', color: '#333' }}>{cat.tenDanhMuc}</span>
                                                )}
                                            </td>

                                            {/* Cột Danh mục cha */}
                                            <td>
                                                {editingCategory?.maDanhMuc === cat.maDanhMuc ? (
                                                    <select 
                                                        className={styles.select}
                                                        value={editParentId}
                                                        onChange={(e) => setEditParentId(parseInt(e.target.value))}
                                                    >
                                                        {parentCategories.map(p => (
                                                            <option key={p.maDanhMucCha} value={p.maDanhMucCha}>{p.tenDanhMucCha}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#555' }}>
                                                        <FolderOpen size={14} color="#ffca00" />
                                                        {cat.tenDanhMucCha || parentCategories.find(p => p.maDanhMucCha === cat.maDanhMucCha)?.tenDanhMucCha || "---"}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Cột Thao tác */}
                                            <td style={{ textAlign: 'center' }}>
                                                {editingCategory?.maDanhMuc === cat.maDanhMuc ? (
                                                    <>
                                                        <button className={`${styles.actionBtn} ${styles.btnSave}`} onClick={handleUpdate} title="Lưu">
                                                            <Save size={16} />
                                                        </button>
                                                        <button className={`${styles.actionBtn} ${styles.btnCancel}`} onClick={() => setEditingCategory(null)} title="Hủy">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => handleEdit(cat)} title="Sửa">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => handleDelete(cat.maDanhMuc)} title="Xóa">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: "center", padding: "30px", color: "#999" }}>
                                            Không có dữ liệu phù hợp
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageCategories;