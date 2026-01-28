import React, { useContext, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

  const GoogleLoginButton = () => {
  const { setUser, setToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

    const handleGoogleLoginSuccess = async (credentialResponse) => {
      if (!credentialResponse || !credentialResponse.credential) {
        alert("Google credential không hợp lệ");
        return;
      }

      const IdToken = credentialResponse.credential;
      const decoded = jwtDecode(IdToken);
      console.log("Google token info:", decoded);

      setLoading(true);
  try {
  const res = await axios.post(
    "http://localhost:5133/api/emailverification/google-login",
    { IdToken },
    { headers: { "Content-Type": "application/json" } }
  );

  const userData = res.data;

  const userObject = {
    id: userData.id,
    email: userData.email,
    fullName: userData.fullName,
    role: userData.role || "User",
    phoneNumber: userData.phoneNumber || "",
    avatarUrl: userData.avatarUrl || "",
    emailConfirmed: userData.emailConfirmed || true,
    loginProvider: "Google",
    token: userData.token
  };

  setUser(userObject);
  setToken(userData.token);
  toast.success(" Đăng nhập Google thành công!", {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
  closeButton: false,           // ❌ Không hiển thị nút "x"
  icon: "🚀",                   // ✅ Biểu tượng tuỳ chỉnh
  style: {
    borderRadius: "12px",
    background: "#f0fff4",
    color: "#1a202c",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    padding: "12px 16px",
  },
});
  navigate("/market");
} catch (error) {
  console.error("Lỗi đăng nhập Google:", error.response?.data || error.message);
  toast.error(error.response?.data?.message || " Đăng nhập Google thất bại", {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
});
  
}
};
    return (
      <div>
        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={() => alert("Đăng nhập Google thất bại")}
          disabled={loading}
          render={renderProps => (
            <button
              onClick={renderProps.onClick}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 8,
                width: 120,
                height: 44,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                padding: 0,
                gap: 8
              }}
            >
              <FcGoogle size={24} />
              <span style={{ color: '#222', fontWeight: 500, fontSize: 15 }}>Google</span>
            </button>
          )}
        />
        {loading && <p>Đang xử lý đăng nhập...</p>}
      </div>
    );
  };

  export default GoogleLoginButton;