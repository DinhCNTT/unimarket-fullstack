import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterForm.css";
import GoogleLoginButton from "./GoogleLoginButton";
import FacebookLoginButton from "./FacebookLoginButton";
import { toast } from "react-toastify";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

const RegisterForm = () => {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [agreed, setAgreed] = useState(false);
 
  const navigate = useNavigate();

  // Common toast style
  const sameStyle = {
    position: "top-right",
    autoClose: 3500,
    closeButton: false,
    style: {
      background: "#fff1f2",
      color: "#b91c1c",
      fontWeight: "600",
      borderRadius: "12px",
      padding: "14px 16px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
  };

  // Password criteria check
  const passwordCriteria = [
    {
      label: "Ít nhất 8 ký tự",
      test: (pw) => pw.length >= 8,
    },
    {
      label: "Có chữ hoa (A-Z)",
      test: (pw) => /[A-Z]/.test(pw),
    },
    {
      label: "Có chữ thường (a-z)",
      test: (pw) => /[a-z]/.test(pw),
    },
    {
      label: "Có số (0-9)",
      test: (pw) => /[0-9]/.test(pw),
    },
    {
      label: "Có ký tự đặc biệt (@$!%*?&)",
      test: (pw) => /[@$!%*?&]/.test(pw),
    },
  ];

  const passwordCriteriaStatus = passwordCriteria.map((c) => c.test(password));

const handlePasswordFocus = () => {
  setShowPasswordCriteria(true);
  setPasswordTouched(true); // đánh dấu user đã focus vào input
};

  const handlePasswordBlur = () => {
  setShowPasswordCriteria(false);

  if (password.trim() === "") {
    // Nếu chưa nhập gì thì coi như chưa "touched"
    setPasswordTouched(false);
  } else {
    setPasswordTouched(true);
  }
};

  const handleRegister = async (e) => {
    e.preventDefault();

    // Kiểm tra số điện thoại
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("❌ Số điện thoại không hợp lệ!", {
        position: "top-right",
        autoClose: 3500,
        closeButton: false,
        icon: "📱",
        style: {
          background: "#fff1f2",
          color: "#b91c1c",
          fontWeight: "600",
          borderRadius: "12px",
          padding: "14px 16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
      });
      return;
    }

    // Kiểm tra email là Gmail
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      toast.error("Email phải là địa chỉ Gmail", {
        icon: "📧",
        ...sameStyle
      });
      return;
    }

    // Kiểm tra mật khẩu mạnh
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error(" Mật khẩu phải đủ mạnh", {
        icon: "🔒",
        ...sameStyle
      });
      return;
    }

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      toast.error("❌ Mật khẩu xác nhận không khớp", {
        icon: "🔁",
        ...sameStyle
      });
      return;
    }

    // Tạo object user
    const userData = {
      fullName,
      phoneNumber,
      email,
      password,
      confirmPassword,
    };

    try {
      const response = await fetch("http://localhost:5133/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.errors) {
          // Hiển thị tất cả lỗi từ server (nếu có)
          const errorMessages = Object.values(data.errors).flat().join("\n");
          throw new Error(errorMessages);
        } else if (data && data.message) {
          throw new Error(data.message);
        } else {
          throw new Error("Đăng ký thất bại! Vui lòng thử lại.");
        }
      }

      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.", {
        position: "top-right",
        autoClose: 4000,
        closeButton: false,
        icon: "📬",
        style: {
          background: "#f0fff4",
          color: "#065f46",
          fontWeight: "600",
          borderRadius: "12px",
          padding: "14px 16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      });
      navigate("/login");
    } catch (error) {
      toast.error(`Lỗi: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        hideProgressBar: false,
        icon: "⚠️",
        style: {
          background: "#fff",
          color: "#d32f2f",
          fontWeight: "500",
          fontSize: "15px",
          borderLeft: "5px solid #d32f2f",
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
          borderRadius: "8px",
        },
      });
    }
  };

return (
  <div className="unimarketRegisterContainer unimarketRegisterBgGradient" style={{ display: 'flex', minHeight: '100vh' }}>
    <div className="unimarketRegisterLeftSide">
      <div className="unimarketRegisterBranding">
        <img src="/images/unimarket-logo-only.png" alt="UNIMARKET Logo" />
        <div className="unimarketRegisterSlogan">
          <span className="slogan-black">Nền tảng đăng tin </span>
          <span className="slogan-orange">rao vặt yêu thích</span>
        </div>
        <div className="unimarketRegisterWelcomeText">
          <p className="unimarketRegisterWelcomeTitle">Tham gia cùng chúng tôi!</p>
          <p className="unimarketRegisterWelcomeSubtitle">Tạo tài khoản để bắt đầu đăng tin</p>
        </div>
      </div>
    </div>

    <div className="unimarketRegisterRightSide" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="unimarketRegisterFormWrapper">
        <h2 className="unimarketRegisterTitle">Đăng ký tài khoản</h2>
        <form className="unimarketRegisterForm" onSubmit={handleRegister}>
          
          {/* Họ tên */}
          <input
            type="text"
            placeholder="Họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="unimarketRegisterInput"
          />

          {/* Số điện thoại */}
          <input
            type="tel"
            placeholder="Số điện thoại"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="unimarketRegisterInput"
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email (gmail)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="unimarketRegisterInput"
          />

          {/* Mật khẩu */}
          <div className="unimarketRegisterPasswordWrapper">
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
              required
              className="unimarketRegisterInput"
            />

            {showPasswordCriteria && (
              <div className="unimarketRegisterPasswordCriteria">
                <div className="unimarketRegisterPasswordCriteriaTitle">Mật khẩu cần có:</div>
                <ul className="unimarketRegisterPasswordCriteriaList">
                  {passwordCriteria.map((c, idx) => (
                    <li
                      key={c.label}
                      className={`unimarketRegisterPasswordCriteriaItem ${passwordCriteriaStatus[idx] ? 'unimarketRegisterValid' : 'unimarketRegisterInvalid'}`}
                    >
                      {passwordCriteriaStatus[idx] ? (
                        <FiCheckCircle className="unimarketIconSuccess" />
                      ) : (
                        <FiXCircle className="unimarketIconError" />
                      )}
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="unimarketRegisterPasswordWrapper">
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`unimarketRegisterInput ${confirmPassword && confirmPassword !== password ? "unimarketRegisterInputError" : ""}`}
            />
          </div>

          {/* Thông báo lỗi mật khẩu chưa đạt tiêu chí */}
          {passwordTouched && password.trim() !== "" && !passwordCriteriaStatus.every(Boolean) && !showPasswordCriteria && (
            <div className="unimarketRegisterPasswordError">
              Mật khẩu chưa đáp ứng đủ tiêu chí:
              <ul className="unimarketRegisterPasswordErrorList">
                {passwordCriteria.map((c, idx) =>
                  !passwordCriteriaStatus[idx] ? (
                    <li key={c.label} className="unimarketRegisterPasswordErrorItem">
                      <FiXCircle className="unimarketIconError" /> {c.label}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}

          {/* Checkbox điều khoản */}
          <div className="unimarketRegisterCheckboxContainer">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              required
              className="unimarketRegisterCheckbox"
            />
            <label htmlFor="agree-terms" className="unimarketRegisterCheckboxLabel">
              Khi đăng ký, bạn đồng ý với <a href="#" className="unimarketRegisterCheckboxLink">Điều khoản sử dụng</a> và <a href="#" className="unimarketRegisterCheckboxLink">Chính sách bảo mật</a>.
            </label>
          </div>

          <button 
            type="submit" 
            className="unimarketRegisterButton" 
            disabled={!agreed}
          >
            Đăng ký
          </button>
        </form>

        {/* Đăng ký bằng MXH */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>Hoặc đăng ký bằng</p>
          <div className="unimarketRegisterSocialButtons">
            <GoogleLoginButton />
            <FacebookLoginButton />
          </div>
        </div>

        {/* Link đăng nhập */}
        <div className="unimarketRegisterLoginLink">
          Đã có tài khoản? <a href="/login" className="unimarketRegisterLoginLinkText">Đăng nhập</a>
        </div>
      </div>
    </div>
  </div>
);


};

export default RegisterForm;