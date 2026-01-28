import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Import module styles
import styles from "./ManageParentCategories.module.css"; 

const ManageParentCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true); // Thêm loading state
    
    // State cho việc edit
    const [editingCategory, setEditingCategory] = useState(null);
    const [newName, setNewName] = useState("");
    const [newImage, setNewImage] = useState(null);
    const [newIcon, setNewIcon] = useState(null);
    const [previewImage, setPreviewImage] = useState("");
    const [previewIcon, setPreviewIcon] = useState("");

    const baseUrl = "http://localhost:5133/";

    useEffect(() => {
        fetchCategories();
    }, []);
    
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:5133/api/admin/get-parent-categories");
            setCategories(res.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh mục cha:", error);
            toast.error("Không thể tải dữ liệu danh mục.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setNewName(category.tenDanhMucCha);
        // Nếu là link online thì dùng luôn, nếu link local thì thêm baseUrl (logic hiển thị)
        setPreviewImage(category.anhDanhMucCha); 
        setPreviewIcon(category.icon);
        // Reset file input
        setNewImage(null);
        setNewIcon(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleIconChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewIcon(file);
            setPreviewIcon(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async () => {
        if (!newName.trim()) {
            toast.warning("Tên danh mục không được để trống!");
            return;
        }

        const formData = new FormData();
        formData.append("tenDanhMucCha", newName);
        
        // Key chuẩn Backend yêu cầu: "anhDanhMucCha"
        if (newImage) formData.append("anhDanhMucCha", newImage);
        if (newIcon) formData.append("icon", newIcon);

        try {
            await axios.put(
                `http://localhost:5133/api/admin/update-parent-category/${editingCategory.maDanhMucCha}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            toast.success("Đã cập nhật thành công!");
            fetchCategories();
            setEditingCategory(null); // Thoát chế độ edit
        } catch (error) {
            console.error(error);
            toast.error("Cập nhật thất bại. Vui lòng thử lại.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xác nhận xóa danh mục này?")) return;

        try {
            // Check logic con (Client side check - giữ nguyên logic của bạn)
            const childCategoriesResponse = await axios.get("http://localhost:5133/api/admin/get-categories");
            const childCategories = childCategoriesResponse.data;
            const relatedChildCategories = childCategories.filter(
                (child) => child.maDanhMucCha === id
            );

            if (relatedChildCategories.length > 0) {
                const names = relatedChildCategories.map((child) => child.tenDanhMuc).join(", ");
                toast.error(`Không thể xóa! Có danh mục con: ${names}`);
                return;
            }

            await axios.delete(`http://localhost:5133/api/admin/delete-parent-category/${id}`);
            toast.success("Đã xóa danh mục!");
            fetchCategories();
        } catch (error) {
            toast.error("Lỗi khi xóa danh mục!");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Quản Lý Danh Mục Cha</h2>
                {/* Có thể thêm nút "Thêm mới" ở đây nếu cần */}
            </div>
            
            <ToastContainer autoClose={2000} position="top-right" />

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{width: '80px'}}>ID</th>
                            <th>Tên Danh Mục</th>
                            <th style={{textAlign: 'center'}}>Hình Ảnh</th>
                            <th style={{textAlign: 'center'}}>Icon</th>
                            <th style={{textAlign: 'right'}}>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className={styles.loading}>Đang tải dữ liệu...</td>
                            </tr>
                        ) : (
                            categories.map((cat) => {
                                const isEditing = editingCategory?.maDanhMucCha === cat.maDanhMucCha;

                                return (
                                    <tr key={cat.maDanhMucCha}>
                                        <td>#{cat.maDanhMucCha}</td>
                                        
                                        {/* Cột Tên */}
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    className={styles.inputInfo}
                                                    autoFocus
                                                />
                                            ) : (
                                                <strong>{cat.tenDanhMucCha}</strong>
                                            )}
                                        </td>

                                        {/* Cột Ảnh */}
                                        <td align="center">
                                            {isEditing ? (
                                                <div className={styles.uploadGroup}>
                                                    {previewImage && <img src={previewImage} alt="Preview" className={styles.previewImg} />}
                                                    <label className={styles.uploadLabel}>
                                                        Chọn Ảnh
                                                        <input type="file" onChange={handleImageChange} className={styles.hiddenInput} accept="image/*"/>
                                                    </label>
                                                </div>
                                            ) : (
                                                <img src={cat.anhDanhMucCha} alt="Ảnh DM" className={styles.imgThumbnail} onError={(e) => e.target.src = "https://via.placeholder.com/60"} />
                                            )}
                                        </td>

                                        {/* Cột Icon */}
                                        <td align="center">
                                            {isEditing ? (
                                                <div className={styles.uploadGroup}>
                                                    {previewIcon && <img src={previewIcon} alt="Preview" className={styles.previewImg} style={{objectFit: 'contain'}} />}
                                                    <label className={styles.uploadLabel}>
                                                        Chọn Icon
                                                        <input type="file" onChange={handleIconChange} className={styles.hiddenInput} accept="image/*"/>
                                                    </label>
                                                </div>
                                            ) : (
                                                <img src={cat.icon} alt="Icon DM" className={styles.iconThumbnail} onError={(e) => e.target.src = "https://via.placeholder.com/40"} />
                                            )}
                                        </td>

                                        {/* Cột Action */}
                                        <td align="right">
                                            <div className={styles.actions} style={{justifyContent: 'flex-end'}}>
                                                {isEditing ? (
                                                    <>
                                                        <button className={`${styles.btn} ${styles.btnSave}`} onClick={handleUpdate}>
                                                            Lưu
                                                        </button>
                                                        <button className={`${styles.btn} ${styles.btnCancel}`} onClick={() => setEditingCategory(null)}>
                                                            Hủy
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className={`${styles.btn} ${styles.btnEdit}`} onClick={() => handleEdit(cat)}>
                                                            Sửa
                                                        </button>
                                                        <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => handleDelete(cat.maDanhMucCha)}>
                                                            Xóa
                                                        </button>
                                                    </>
                                                )}
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

export default ManageParentCategories;