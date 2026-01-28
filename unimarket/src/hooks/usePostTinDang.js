import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const usePostTinDang = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Refs
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // States
  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [condition, setCondition] = useState("Moi");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [canNegotiate, setCanNegotiate] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [tinhThanhList, setTinhThanhList] = useState([]);
  const [quanHuyenList, setQuanHuyenList] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activePreviewMedia, setActivePreviewMedia] = useState(0);
  const [dynamicData, setDynamicData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Media States
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewVideos, setPreviewVideos] = useState([]);

  // Constants
  const TITLE_MAX_LENGTH = 80;
  const DESCRIPTION_MAX_LENGTH = 900;
  const MAX_IMAGES = 7;
  const MAX_VIDEOS = 1;

  const conditionMap = {
    Moi: "Mới",
    DaSuDung: "Đã sử dụng",
  };

  // Derived State
  const isMobileCategory = categoryName?.toLowerCase().includes("điện thoại");
  const isRoomRentalCategory = parentCategory?.toLowerCase().trim() === "nhà trọ";

  // Helpers
  const getProvinceName = (id) =>
    (tinhThanhList.find((p) => `${p.maTinhThanh}` === id) || {}).tenTinhThanh || id;

  const getDistrictName = (id) =>
    (quanHuyenList.find((d) => `${d.maQuanHuyen}` === id) || {}).tenQuanHuyen || id;

  const updateInputFiles = (inputRef, files) => {
    if (inputRef.current) {
      const dt = new DataTransfer();
      files.forEach((file) => dt.items.add(file));
      inputRef.current.files = dt.files;
    }
  };

  const formatPrice = (value) =>
    value.replace(/[^\d]/g, "").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

  // Effects
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setCategoryId(queryParams.get("categoryId"));
    setCategoryName(queryParams.get("categoryName"));
    setParentCategory(queryParams.get("parentCategory"));
  }, [location]);

  useEffect(() => {
    const fetchTinhThanh = async () => {
      try {
        const response = await fetch("http://localhost:5133/api/tindang/tinhthanh");
        if (!response.ok) throw new Error("Không thể tải danh sách tỉnh thành");
        const data = await response.json();
        setTinhThanhList(data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách tỉnh thành:", error);
      }
    };
    fetchTinhThanh();
  }, []);

  useEffect(() => {
    if (province) {
      const fetchQuanHuyen = async () => {
        try {
          const response = await fetch(`http://localhost:5133/api/tindang/tinhthanh/${province}/quanhuynh`);
          if (!response.ok) throw new Error("Không thể tải danh sách quận huyện");
          const data = await response.json();
          setQuanHuyenList(data);
        } catch (error) {
          console.error("Lỗi khi tải danh sách quận huyện:", error);
        }
      };
      fetchQuanHuyen();
    }
  }, [province]);

  useEffect(() => {
    updateInputFiles(imageInputRef, imageFiles);
  }, [imageFiles]);

  useEffect(() => {
    updateInputFiles(videoInputRef, videoFiles);
  }, [videoFiles]);

  // Handlers
  const handleDynamicDataChange = (key, value) => {
    setDynamicData((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = (e) => {
    if (e.target.value.length <= TITLE_MAX_LENGTH) setTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    if (e.target.value.length <= DESCRIPTION_MAX_LENGTH) setDescription(e.target.value);
  };

  const handlePriceChange = (e) => {
    setPrice(formatPrice(e.target.value));
  };

  const handleImageChange = (e) => {
    const newImages = Array.from(e.target.files);
    const totalImages = [...imageFiles, ...newImages].slice(0, MAX_IMAGES);
    setImageFiles(totalImages);

    const previews = totalImages.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setPreviewImages(previews);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 60) {
      alert(`❌ File quá nặng (${Math.round(sizeMB)}MB)! Vui lòng chọn video dưới 60MB.`);
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = videoUrl;

    video.onloadedmetadata = () => {
      if (video.duration > 60) {
        URL.revokeObjectURL(videoUrl);
        alert("❌ Video không được dài quá 60 giây!");
        return;
      }
      setVideoFiles([file]);
      setPreviewVideos([{ url: videoUrl, type: file.type }]);
    };
  };

  const removeImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setImageFiles(newImageFiles);
    setPreviewImages(newPreviews);
  };

  const removeVideo = (index) => {
    const urlToRevoke = previewVideos[index]?.url;
    if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    const newVideoFiles = videoFiles.filter((_, i) => i !== index);
    const newPreviews = previewVideos.filter((_, i) => i !== index);
    setVideoFiles(newVideoFiles);
    setPreviewVideos(newPreviews);
  };

  const handlePreview = () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    if (!title || !description || !price || !contactInfo || !province || !district) {
      alert("Vui lòng điền đầy đủ thông tin trước khi xem trước.");
      return;
    }

    // ✅ Kiểm tra field bắt buộc cho phòng trọ/bất động sản
    if (isRoomRentalCategory) {
      if (!dynamicData.loaiHinhPhong || !dynamicData.dienTichPhong || !dynamicData.sucChua || !dynamicData.thoiHanChoThue) {
        alert("Vui lòng điền đầy đủ thông tin phòng (Loại phòng, Diện tích, Sức chứa, Thời hạn cho thuê)!");
        return;
      }
    }

    let detailsDisplay = null;
    if (isMobileCategory) {
      detailsDisplay = {
        "Hãng": dynamicData.Hang,
        "Dòng máy": dynamicData.DongMay,
        "Màu sắc": dynamicData.MauSac,
        "Dung lượng": dynamicData.DungLuong,
        "Xuất xứ": dynamicData.XuatXu,
        "Bảo hành": dynamicData.BaoHanh
      };
    }

    // ✅ Thêm display details cho phòng trọ/bất động sản
    if (isRoomRentalCategory) {
      detailsDisplay = {
        "Loại phòng": dynamicData.loaiHinhPhong,
        "Diện tích": `${dynamicData.dienTichPhong} m²`,
        "Sức chứa": `${dynamicData.sucChua} người`,
        "Thời hạn": `${dynamicData.thoiHanChoThue} tháng`,
        "Tiện ích": (dynamicData.tienIch || []).join(", ") || "Không"
      };
    }

    const allMedia = [...previewImages, ...previewVideos];
    setPreviewData({
      title,
      description,
      price,
      contactInfo,
      condition: conditionMap[condition],
      province: getProvinceName(province),
      district: getDistrictName(district),
      canNegotiate,
      categoryName,
      details: detailsDisplay,
      images: allMedia,
    });

    setActivePreviewMedia(0);
    setShowPreview(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    if (imageFiles.length === 0) {
      alert("Vui lòng chọn ít nhất 1 hình ảnh!");
      return;
    }

    // ✅ Kiểm tra field bắt buộc cho điện thoại di động
    if (isMobileCategory) {
      if (!dynamicData.Hang || !dynamicData.DongMay || !dynamicData.MauSac || !dynamicData.DungLuong) {
        alert("Vui lòng điền đầy đủ Hãng, Dòng máy, Màu sắc và Dung lượng!");
        return;
      }
    }

    // ✅ Kiểm tra field bắt buộc cho phòng trọ/bất động sản
    if (isRoomRentalCategory) {
      if (!dynamicData.loaiHinhPhong || !dynamicData.dienTichPhong || !dynamicData.sucChua || !dynamicData.thoiHanChoThue) {
        alert("Vui lòng điền đầy đủ: Loại phòng, Diện tích, Sức chứa và Thời hạn cho thuê!");
        return;
      }
    }

    setIsLoading(true);
    const rawPrice = price.replace(/[^\d]/g, "");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", rawPrice);
    formData.append("contactInfo", contactInfo);
    formData.append("condition", condition);
    formData.append("province", province);
    formData.append("district", district);
    formData.append("userId", user.id);
    formData.append("categoryId", categoryId);
    formData.append("categoryName", categoryName);
    formData.append("canNegotiate", canNegotiate);

    if (isMobileCategory && Object.keys(dynamicData).length > 0) {
      formData.append("thongTinChiTiet", JSON.stringify(dynamicData));
    }

    // Thêm chiTiet cho phòng trọ/bất động sản
    if (isRoomRentalCategory && Object.keys(dynamicData).length > 0) {
      formData.append("thongTinChiTiet", JSON.stringify(dynamicData));
    }

    [...imageFiles, ...videoFiles].forEach((file) => formData.append("images", file));

    try {
      await axios.post("http://localhost:5133/api/tindang/add-post", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatusMessage("✅ Tin bạn đã được gửi đi, vui lòng đợi duyệt!");
      alert("Tin bạn đã được gửi đi, vui lòng đợi duyệt!");
      setTimeout(() => navigate("/quan-ly-tin"), 800);
    } catch (error) {
      console.error("Lỗi khi đăng tin:", error);
      setStatusMessage("❌ Đăng tin thất bại!");
      alert("Đăng tin thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  // Trả về tất cả những gì UI cần
  return {
    // Refs
    imageInputRef,
    videoInputRef,
    // States
    categoryName,
    parentCategory,
    title,
    description,
    price,
    contactInfo,
    condition,
    province,
    district,
    canNegotiate,
    statusMessage,
    tinhThanhList,
    quanHuyenList,
    previewData,
    showPreview,
    activePreviewMedia,
    dynamicData,
    isLoading,
    isMobileCategory,
    isRoomRentalCategory,
    // Media States
    imageFiles,
    videoFiles,
    previewImages,
    previewVideos,
    // Constants
    TITLE_MAX_LENGTH,
    DESCRIPTION_MAX_LENGTH,
    MAX_IMAGES,
    MAX_VIDEOS,
    conditionMap,
    // Handlers & Setters
    setContactInfo,
    setCondition,
    setProvince,
    setDistrict,
    setCanNegotiate,
    setActivePreviewMedia,
    handleDynamicDataChange,
    handleTitleChange,
    handleDescriptionChange,
    handlePriceChange,
    handleImageChange,
    handleVideoChange,
    removeImage,
    removeVideo,
    handlePreview,
    handleSubmit,
  };
};

export default usePostTinDang;