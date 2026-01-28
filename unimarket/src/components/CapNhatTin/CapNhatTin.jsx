import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import TopNavbar from "../TopNavbar/TopNavbar";
import styles from "./CapNhatTin.module.css";

// Import components con
import MediaManager from "./MediaManager";
import CategorySpecRenderer from "./CategorySpecs/CategorySpecRenderer";

const CapNhatTin = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  // --- UX States ---
  const [isLoading, setIsLoading] = useState(true); // Load trang
  const [isSubmitting, setIsSubmitting] = useState(false); // Submit form
  const [toast, setToast] = useState({ show: false, message: "", type: "" }); // Thay alert
  const [errors, setErrors] = useState({}); // Lưu lỗi validation

  // --- Data States ---
  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [displayPrice, setDisplayPrice] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [condition, setCondition] = useState("Moi");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  
  const [tinhThanhList, setTinhThanhList] = useState([]);
  const [quanHuyenList, setQuanHuyenList] = useState([]);

  // --- Media States ---
  const [imagePreviewList, setImagePreviewList] = useState([]);
  const [videoPreviewList, setVideoPreviewList] = useState([]);
  const [oldImagesToDelete, setOldImagesToDelete] = useState([]);
  const [oldVideosToDelete, setOldVideosToDelete] = useState([]);

  // --- Dynamic Data ---
  const [dynamicData, setDynamicData] = useState({});

  // --- Helper: Toast Notification ---
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // --- Handlers ---
  const handleDynamicChange = (key, value) => {
    setDynamicData(prev => ({ ...prev, [key]: value }));
    // Xóa lỗi khi người dùng chọn lại
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const formatPrice = (value) => {
    if (!value) return "";
    const numericValue = value.toString().replace(/[^\d]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    setPrice(rawValue);
    setDisplayPrice(formatPrice(rawValue));
    if (errors.price) setErrors(prev => ({ ...prev, price: null }));
  };

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [postRes, tinhRes] = await Promise.all([
          axios.get(`http://localhost:5133/api/TinDang/get-post/${id}`),
          fetch("http://localhost:5133/api/tindang/tinhthanh").then(res => res.json())
        ]);

        setTinhThanhList(tinhRes);

        const tinDang = postRes.data;
        console.log("Toàn bộ dữ liệu Post từ API:", tinDang); // Thêm dòng này
        setTitle(tinDang.tieuDe);
        setDescription(tinDang.moTa);
        setPrice(tinDang.gia);
        setDisplayPrice(formatPrice(tinDang.gia));
        setContactInfo(tinDang.diaChi);
        setCondition(tinDang.tinhTrang);
        setProvince(tinDang.maTinhThanh);
        setDistrict(tinDang.maQuanHuyen);
        setCategoryId(tinDang.maDanhMuc);
        setCategoryName(tinDang.danhMuc?.tenDanhMuc);

        // Kiểm tra mọi khả năng tên trường có thể trả về từ Backend (C hoặc c)
const rawDetails = tinDang.chiTietObj || tinDang.ChiTietObj || tinDang.thongTinChiTiet;

if (rawDetails) {
  // Nếu là chuỗi JSON (string) thì mới parse, nếu là Object rồi thì dùng luôn
  const dataObject = typeof rawDetails === 'string' ? JSON.parse(rawDetails) : rawDetails;
  
  console.log("Dữ liệu chi tiết đã nhận:", dataObject); // Để bạn kiểm tra trong F12
  
  // Quan trọng: Đảm bảo set vào dynamicData
  setDynamicData(dataObject || {});
} else {
  console.error("API không trả về thông tin chi tiết (ChiTietObj)!");
}
        
        if (tinDang.anhTinDangs?.length > 0) {
          const images = [];
          const videos = [];
          const sortedMedia = tinDang.anhTinDangs.sort((a, b) => (a.order || 0) - (b.order || 0));
          
          sortedMedia.forEach(media => {
            const url = media.duongDan.startsWith('http') ? media.duongDan : `http://localhost:5133${media.duongDan}`;
            const mediaItem = {
              type: 'old',
              url: url,
              id: media.maAnh,
              originalOrder: media.order || 0,
              fileName: media.duongDan.split('/').pop()
            };
            const isVideo = media.loaiMedia === 1 || /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(media.duongDan);
            if (isVideo) videos.push(mediaItem);
            else images.push(mediaItem);
          });
          setImagePreviewList(images);
          setVideoPreviewList(videos);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        showToast("Không thể tải thông tin tin đăng", "error");
      } finally {
        setTimeout(() => setIsLoading(false), 500); // Giả lập delay nhỏ cho mượt
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (province) {
      fetch(`http://localhost:5133/api/tindang/tinhthanh/${province}/quanhuynh`).then(res => res.json()).then(setQuanHuyenList);
    }
  }, [province]);

  // --- Media Handlers (Giữ nguyên logic cũ, chỉ rút gọn) ---
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 7 - imagePreviewList.length);
    setImagePreviewList(prev => [...prev, ...files.map(file => ({ type: 'new', file, url: URL.createObjectURL(file), fileName: file.name }))]);
  };
  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 1 - videoPreviewList.length);
    setVideoPreviewList(prev => [...prev, ...files.map(file => ({ type: 'new', file, url: URL.createObjectURL(file), fileName: file.name }))]);
  };
  const handleRemoveImage = (idx) => {
    setImagePreviewList(prev => {
      const removed = prev[idx];
      if (removed.type === 'old') setOldImagesToDelete(ids => [...ids, removed.id]);
      return prev.filter((_, i) => i !== idx);
    });
  };
  const handleRemoveVideo = (idx) => {
    setVideoPreviewList(prev => {
      const removed = prev[idx];
      if (removed.type === 'old') setOldVideosToDelete(ids => [...ids, removed.id]);
      return prev.filter((_, i) => i !== idx);
    });
  };
  const moveImage = (from, to) => {
    setImagePreviewList(prev => {
      if (to < 0 || to >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Vui lòng nhập tiêu đề";
    if (!price) newErrors.price = "Vui lòng nhập giá";
    
    // ✅ SỬA: Check key chữ thường cho đồng bộ với dynamicData
    if (categoryName?.toLowerCase().includes("điện thoại")) {
      if (!dynamicData.hang) newErrors.hang = true;
      if (!dynamicData.dongMay) newErrors.dongMay = true; 
      if (!dynamicData.mauSac) newErrors.mauSac = true;
      if (!dynamicData.dungLuong) newErrors.dungLuong = true;
      if (!dynamicData.baoHanh) newErrors.baoHanh = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return showToast("Vui lòng đăng nhập!", "error");
    
    if (!validateForm()) {
        showToast("Vui lòng kiểm tra lại thông tin còn thiếu!", "error");
        return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("contactInfo", contactInfo);
    formData.append("condition", condition);
    formData.append("canNegotiate", true);
    formData.append("province", province);
    formData.append("district", district);
    formData.append("categoryId", categoryId);
    formData.append("userId", user.id);
    if (Object.keys(dynamicData).length > 0) formData.append("thongTinChiTiet", JSON.stringify(dynamicData));

    // Logic Map Order (Giữ nguyên logic cũ)
    const imageOrderMap = [];
    const videoOrderMap = [];
    imagePreviewList.forEach((img, index) => {
      if (img.type === 'old') imageOrderMap.push({ type: 'old', id: img.id, position: index });
      else imageOrderMap.push({ type: 'new', id: -1, fileIndex: imagePreviewList.filter((item, idx) => item.type === 'new' && idx <= index).length - 1, position: index });
    });
    videoPreviewList.forEach((vid, index) => {
       if (vid.type === 'old') videoOrderMap.push({ type: 'old', id: vid.id, position: index });
       else videoOrderMap.push({ type: 'new', id: -1, fileIndex: videoPreviewList.filter((item, idx) => item.type === 'new' && idx <= index).length - 1, position: index });
    });

    formData.append('imageOrderMap', JSON.stringify(imageOrderMap));
    formData.append('videoOrderMap', JSON.stringify(videoOrderMap));

    imagePreviewList.filter(i => i.type === 'new').forEach(img => formData.append('newImages', img.file));
    videoPreviewList.filter(i => i.type === 'new').forEach(vid => formData.append('newVideos', vid.file));
    if (oldImagesToDelete.length > 0) formData.append('oldImagesToDelete', JSON.stringify(oldImagesToDelete));
    if (oldVideosToDelete.length > 0) formData.append('oldVideosToDelete', JSON.stringify(oldVideosToDelete));

    try {
      await axios.put(`http://localhost:5133/api/TinDang/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Cập nhật tin thành công!", "success");
      setTimeout(() => navigate("/quan-ly-tin"), 1500);
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      showToast(`Lỗi: ${error.response?.data?.message || error.message}`, "error");
      setIsSubmitting(false);
    }
  };

  // --- Render Skeleton Loading ---
  if (isLoading) {
      return (
          <div className={styles.container}>
              <TopNavbar />
              <div className={styles.form}>
                  <div className={styles.layoutWrapper}>
                      <div className={styles.leftColumn}>
                          <div className={`${styles.skeleton} ${styles.skeletonBox}`}></div>
                          <div className={`${styles.skeleton} ${styles.skeletonBox}`}></div>
                      </div>
                      <div className={styles.rightColumn}>
                          <div className={`${styles.skeleton} ${styles.skeletonInput}`}></div>
                          <div className={`${styles.skeleton} ${styles.skeletonInput}`}></div>
                          <div className={`${styles.skeleton} ${styles.skeletonInput}`} style={{height: '150px'}}></div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className={styles.container}>
      <TopNavbar />
      
      {/* Toast Notification */}
      {toast.show && (
          <div className={`${styles.floatingToast} ${toast.type === 'error' ? styles.errorToast : styles.successToast}`}>
              {toast.message}
          </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.layoutWrapper}>
          {/* Media Manager */}
          <MediaManager 
            imagePreviewList={imagePreviewList}
            videoPreviewList={videoPreviewList}
            handleImageChange={handleImageChange}
            handleVideoChange={handleVideoChange}
            handleRemoveImage={handleRemoveImage}
            handleRemoveVideo={handleRemoveVideo}
            moveImage={moveImage}
          />

          {/* Inputs Column */}
          <div className={styles.rightColumn}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tiêu đề <span style={{color:'red'}}>*</span></label>
              <input 
                type="text" 
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                value={title} 
                onChange={e => {setTitle(e.target.value); if(errors.title) setErrors({...errors, title: null})}} 
                placeholder="VD: iPhone 14 Pro Max 256GB VNA..."
              />
              {errors.title && <span className={styles.errorText}>{errors.title}</span>}
            </div>

            {/* Renderer Spec - Truyền thêm errors */}
            <CategorySpecRenderer 
              categoryName={categoryName}
              dynamicData={dynamicData}
              onDynamicChange={handleDynamicChange}
              errors={errors} 
            />

            <div className={styles.formGroup}>
              <label className={styles.label}>Mô tả chi tiết <span style={{color:'red'}}>*</span></label>
              <textarea 
                className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                value={description} 
                onChange={e => {setDescription(e.target.value); if(errors.description) setErrors({...errors, description: null})}}
                placeholder="Mô tả chi tiết về sản phẩm, tình trạng, lý do bán..."
              />
              {errors.description && <span className={styles.errorText}>{errors.description}</span>}
            </div>

            <div className={styles.formGroup} style={{position: 'relative'}}>
              <label className={styles.label}>Giá **** muốn <span style={{color:'red'}}>*</span></label>
              <input 
                type="text" 
                className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
                value={displayPrice} 
                onChange={handlePriceChange} 
                placeholder="0" 
                style={{paddingRight: '50px', fontWeight: 'bold', color: '#d0021b'}}
              />
              <span className={styles.suffix}>VNĐ</span>
              {errors.price && <span className={styles.errorText}>{errors.price}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Địa chỉ cụ thể</label>
              <input type="text" className={styles.input} value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tình trạng</label>
              <select className={styles.select} value={condition} onChange={e => setCondition(e.target.value)}>
                <option value="Moi">Mới 100%</option>
                <option value="DaSuDung">Đã qua sử dụng</option>
              </select>
            </div>

            <div className={styles.gridRow}>
                <div className={styles.formGroup}>
                <label className={styles.label}>Tỉnh/Thành phố <span style={{color:'red'}}>*</span></label>
                <select 
                    className={`${styles.select} ${errors.province ? styles.inputError : ''}`}
                    value={province} 
                    onChange={e => {setProvince(e.target.value); if(errors.province) setErrors({...errors, province: null})}}
                >
                    <option value="">Chọn tỉnh/thành</option>
                    {tinhThanhList.map(t => <option key={t.maTinhThanh} value={t.maTinhThanh}>{t.tenTinhThanh}</option>)}
                </select>
                </div>

                <div className={styles.formGroup}>
                <label className={styles.label}>Quận/Huyện <span style={{color:'red'}}>*</span></label>
                <select 
                    className={`${styles.select} ${errors.district ? styles.inputError : ''}`}
                    value={district} 
                    onChange={e => {setDistrict(e.target.value); if(errors.district) setErrors({...errors, district: null})}}
                >
                    <option value="">Chọn quận/huyện</option>
                    {quanHuyenList.map(q => <option key={q.maQuanHuyen} value={q.maQuanHuyen}>{q.tenQuanHuyen}</option>)}
                </select>
                </div>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
             {isSubmitting && <span className={styles.spinner}></span>}
             {isSubmitting ? "Đang cập nhật..." : "Cập nhật Tin"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CapNhatTin;