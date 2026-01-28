import React, { useState, useEffect, useContext } from "react";  
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import defaultAvatar from "../assets/default-avatar.png";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./EditProfileModal.css";
import { MdEdit } from "react-icons/md";

  const EditProfileModal = ({ onClose, onUpdateSuccess }) => {
  const { token, user, updateUser } = useContext(AuthContext);
  const API_BASE = "http://localhost:5133/api/userprofile";

  const [info, setInfo] = useState({
    fullName: "",
    phoneNumber: "",
  });

  const [originalInfo, setOriginalInfo] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(defaultAvatar);
  const [isChanged, setIsChanged] = useState(false);
  
  useEffect(() => {
    axios
      .get(`${API_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const { fullName, phoneNumber } = res.data;
        setInfo({ fullName, phoneNumber });
        setOriginalInfo({ fullName, phoneNumber });
      })
      .catch(() =>
        toast.error("❌ Không thể tải thông tin hồ sơ", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        })
      );
  }, [token]);

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarPreview(user.avatarUrl);
    }
  }, [user]);

  useEffect(() => {
    if (!originalInfo) return;
    const hasChanged =
      info.fullName !== originalInfo.fullName ||
      info.phoneNumber !== originalInfo.phoneNumber;
    setIsChanged(hasChanged);
  }, [info, originalInfo]);

  const handleInfoUpdate = () => {
    if (!isChanged) return;
    axios
      .put(
        `${API_BASE}/update`,
        {
          fullName: info.fullName,
          phoneNumber: info.phoneNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        toast.success(
  <div className="flex items-center">
    <svg className="animate-check" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="white" fillOpacity="0.2" />
      <path d="M17 9L10.4375 16L7 12.4545" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="ml-3">Cập nhật thành công!</span>
  </div>,
  {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored",
    closeButton: false,
    style: {
      background: "linear-gradient(135deg, #2ecc71, #1abc9c)",
      color: "#fff",
      fontSize: "16px",
      fontWeight: "600",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      borderRadius: "12px",
      boxShadow: "0 6px 20px rgba(46, 204, 113, 0.4)",
      padding: "16px 22px",
      letterSpacing: "0.2px",
      border: "1px solid rgba(255,255,255,0.15)",
    },
    className: "animate-enter",
    bodyClassName: "py-0",
  }
);
        setOriginalInfo({ ...info });
        setIsChanged(false);
      })
      .catch(() =>
        toast.error("❌ Lỗi khi cập nhật thông tin!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
          closeButton: false,
          icon: "⚠️",
          style: {
            background: "#e74c3c",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "500",
            fontFamily: "'Segoe UI', sans-serif",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            padding: "12px 16px",
          },
        })
      );
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!avatarFile) {
      toast.warning("⚠️ Vui lòng chọn ảnh!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const res = await axios.post(`${API_BASE}/upload-avatar`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { avatarUrl } = res.data;
      updateUser({ avatarUrl });
      toast.success(
  <div className="flex items-center">
    <svg
      className="mr-3 text-white"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="12" fill="white" fillOpacity="0.15" />
      <path
        d="M17 9L10.4375 16L7 12.4545"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span className="font-semibold">Ảnh đại diện đã cập nhật!</span>
  </div>,
  {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
    closeButton: false,
    style: {
      background: "linear-gradient(135deg, #4cd964, #34c759)", // Apple-style green
      color: "#fff",
      fontSize: "15px",
      fontWeight: "600",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(76, 217, 100, 0.25)",
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
    },
  }
);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch {
      toast.error("❌ Lỗi khi cập nhật ảnh đại diện!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    }
  };
  
return (
  <div className="epm-overlay">
    <div className="epm-content">
      <h2>Chỉnh sửa hồ sơ</h2>

      {/* Ảnh đại diện */}
      <div className="epm-group">
        <label>Ảnh đại diện</label>
        <div className="epm-avatar-wrap">
          <img src={avatarPreview} className="epm-avatar" alt="avatar" />
          <div
            className="epm-edit-icon"
            onClick={() => document.getElementById("avatarInput").click()}
          >
            <MdEdit size={18} />
          </div>
          <input
            type="file"
            id="avatarInput"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>
        <button className="epm-upload-btn" onClick={uploadAvatar}>
          Tải ảnh lên
        </button>
      </div>

      {/* Họ tên */}
      <div className="epm-group">
        <label>Họ tên</label>
        <input
          type="text"
          className="epm-input"
          value={info.fullName}
          maxLength={24}
          onChange={(e) => setInfo({ ...info, fullName: e.target.value })}
        />
      </div>

      {/* Số điện thoại */}
      <div className="epm-group">
        <label>Số điện thoại</label>
        <input
          type="text"
          className="epm-input"
          value={info.phoneNumber}
          maxLength={11}
          onChange={(e) => {
            const onlyNums = e.target.value.replace(/\D/g, "");
            setInfo({ ...info, phoneNumber: onlyNums });
          }}
        />
      </div>

      {/* Nút lưu + đóng */}
      <div className="epm-actions">
        <button
          className={`epm-save-btn ${isChanged ? "epm-active" : "epm-disabled"}`}
          onClick={handleInfoUpdate}
          disabled={!isChanged}
        >
          Lưu thông tin
        </button>
        <button className="epm-cancel-btn" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  </div>
);};
export default EditProfileModal;