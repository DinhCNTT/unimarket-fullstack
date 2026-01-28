import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import authService from "../services/authService";
import "./Login.css";
import { GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { jwtDecode } from "jwt-decode";
import { FaFacebookF } from 'react-icons/fa';
import axios from "axios";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const { setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  // Initialize Facebook SDK
  useEffect(() => {
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: '1838308526739877',
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
      setSdkReady(true);
    };

    const scriptId = 'facebook-jssdk';
    if (!document.getElementById(scriptId)) {
      const js = document.createElement('script');
      js.id = scriptId;
      js.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      document.body.appendChild(js);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = await authService.login(email, password);
      if (!userData || !userData.token || !userData.role) {
        toast.error("❌ Không thể xác thực tài khoản!", {
          style: {
            background: "#fff5f5",
            color: "#c53030",
            fontWeight: "400",
            padding: "12px 16px",
            border: "1px solid #fed7d7",
            borderRadius: "4px",
            fontSize: "13px",
          },
        });
        setIsLoading(false);
        return;
      }
      const userObject = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName || "",
        role: userData.role,
        phoneNumber: userData.phoneNumber || "",
        avatarUrl: userData.avatarUrl || "",
        emailConfirmed: userData.emailConfirmed || false,
        loginProvider: userData.loginProvider || "Email",
        token: userData.token,
      };
      setUser(userObject);
      setToken(userData.token);
      if (
        userData.loginProvider === "Facebook" &&
        userData.emailConfirmed === false
      ) {
        toast("📧 Vui lòng xác minh email trong cài đặt tài khoản trước khi đăng tin.", {
          icon: "⚠️",
          style: {
            background: "#fffaf0",
            color: "#c05621",
            border: "1px solid #fbd38d",
            padding: "12px 16px",
            fontWeight: "400",
            borderRadius: "4px",
            fontSize: "13px",
          },
        });
      } else {
        toast.success("🎉 Đăng nhập thành công!", {
          style: {
            background: "#f0fff4",
            color: "#276749",
            fontSize: "13px",
            fontWeight: "400",
            padding: "12px 16px",
            border: "1px solid #9ae6b4",
            borderRadius: "4px",
          },
        });
      }
      setTimeout(() => {
        navigate(userData.role === "Admin" ? "/admin" : "/market");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      const errMsg =
        error.response?.data?.message || "Đăng nhập thất bại!";
      toast.error(`❌ ${errMsg}`, {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse || !credentialResponse.credential) {
      toast.error("Google credential không hợp lệ", {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
          fontSize: "13px",
        },
      });
      return;
    }

    const IdToken = credentialResponse.credential;
    const decoded = jwtDecode(IdToken);
    console.log("Google token info:", decoded);

    setGoogleLoading(true);
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

      toast.success("🎉 Đăng nhập Google thành công!", {
        style: {
          background: "#f0fff4",
          color: "#276749",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #9ae6b4",
          borderRadius: "4px",
        },
      });

      setTimeout(() => {
        navigate("/market");
      }, 1000);

    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Đăng nhập Google thất bại", {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
        },
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Facebook Login
  const sendAccessTokenToBackend = async (accessToken) => {
    try {
      const res = await fetch('http://localhost:5133/api/emailverification/facebook-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();

      if (res.ok) {
        const userObject = {
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          role: data.role || "User",
          phoneNumber: data.phoneNumber || "",
          avatarUrl: data.avatarUrl || "",
          emailConfirmed: data.emailConfirmed || false,
          loginProvider: "Facebook",
          token: data.token
        };

        setUser(userObject);
        setToken(data.token);

        toast.success("🎉 Đăng nhập Facebook thành công!", {
          style: {
            background: "#f0fff4",
            color: "#276749",
            fontSize: "13px",
            fontWeight: "400",
            padding: "12px 16px",
            border: "1px solid #9ae6b4",
            borderRadius: "4px",
          },
        });

        setTimeout(() => {
          navigate("/market");
        }, 1000);

      } else {
        toast.error(data.message || "Đăng nhập Facebook thất bại", {
          style: {
            background: "#fff5f5",
            color: "#c53030",
            fontSize: "13px",
            fontWeight: "400",
            padding: "12px 16px",
            border: "1px solid #fed7d7",
            borderRadius: "4px",
          },
        });
      }
    } catch (error) {
      toast.error("Lỗi kết nối tới server backend", {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
        },
      });
      console.error('Lỗi khi gọi API Facebook Login:', error);
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      toast.error("Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau.", {
        style: {
          background: "#fff5f5",
          color: "#c53030",
          fontSize: "13px",
          fontWeight: "400",
          padding: "12px 16px",
          border: "1px solid #fed7d7",
          borderRadius: "4px",
        },
      });
      return;
    }

    setFacebookLoading(true);
    window.FB.login(
      function (response) {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          sendAccessTokenToBackend(accessToken);
        } else {
          toast.error("Bạn đã huỷ đăng nhập Facebook", {
            style: {
              background: "#fff5f5",
              color: "#c53030",
              fontSize: "13px",
              fontWeight: "400",
              padding: "12px 16px",
              border: "1px solid #fed7d7",
              borderRadius: "4px",
            },
          });
        }
        setFacebookLoading(false);
      },
      { scope: 'email' }
    );
  };



  return (
    <div className="unimarketLoginContainer">
      <div className="unimarketLoginLeftSide">
        <div className="unimarketLoginBranding">
          <img src="/images/unimarket-logo-only.png" alt="UNIMARKET Logo" className="w-full max-w-sm mx-auto" />
          <div className="unimarketLoginSlogan">
            <span style={{ color: "#333" }}>Nền tảng đăng tin </span>
            <span style={{ color: "#d97706" }}>rao vặt yêu thích</span>
          </div>
          <div className="unimarketLoginWelcomeText">
            <p className="unimarketLoginWelcomeTitle">Chào mừng trở lại!</p>
            <p className="unimarketLoginWelcomeSubtitle">Đăng nhập để tiếp tục sử dụng dịch vụ</p>
          </div>
        </div>
      </div>

      <div className="unimarketLoginRightSide">
        <div className="unimarketLoginFormWrapper">
          <div className="unimarketLoginFormContainer">
      <img src="/images/unimarket-logo-only.png" alt="UNIMARKET Logo" className="w-full max-w-sm mx-auto" style={{width: 80, margin: '0 auto 16px', display: 'block'}} />
            <h2 className="unimarketLoginTitle">ĐĂNG NHẬP</h2>

            <form className="unimarketLoginForm" onSubmit={handleLogin} autoComplete="on">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  aria-label="Email"
                  className="unimarketLoginInput"
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Mật khẩu *"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  aria-label="Mật khẩu"
                  className="unimarketLoginInput"
                />
              </div>
              <div className="unimarketLoginForgotPassword">
                <a href="/forgot-password" className="unimarketLoginForgotPasswordLink">Quên mật khẩu?</a>
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className={isLoading ? 'unimarketLoginButton loading' : 'unimarketLoginButton'}
                aria-label={isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              >
                {isLoading ? '' : 'Đăng nhập'}
              </button>
            </form>

            <div className="unimarketLoginDivider">
              <div className="unimarketLoginDividerLine">
                <span className="unimarketLoginDividerText">Hoặc đăng nhập bằng</span>
              </div>
            </div>

            <div className="unimarketLoginSocialButtons">
              <div className="google-login-container unimarketLoginSocialButton" style={{padding: 0}}>
                <GoogleLogin
                  onSuccess={handleGoogleLoginSuccess}
                  onError={() => {
                    toast.error("Đăng nhập Google thất bại", {
                      style: {
                        background: "#fff5f5",
                        color: "#c53030",
                        fontSize: "13px",
                        fontWeight: "400",
                        padding: "12px 16px",
                        border: "1px solid #fed7d7",
                        borderRadius: "4px",
                      },
                    });
                  }}
                  disabled={googleLoading}
                  text="signin_with"
                  theme="outline"
                  size="large"
                  width="100%"
                  render={renderProps => (
                    <button
                      onClick={renderProps.onClick}
                      disabled={googleLoading}
                      className={
                        googleLoading
                          ? "unimarketLoginSocialButton google-button loading"
                          : "unimarketLoginSocialButton google-button"
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff',
                        border: 'none',
                        borderRadius: 7,
                        width: 100,
                        height: 39,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        cursor: googleLoading ? 'not-allowed' : 'pointer',
                        padding: 0,
                        gap: 8,
                        marginTop: '1px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <FcGoogle style={{ fontSize: 24 }} />
                      <span style={{ color: '#222', fontWeight: 500, fontSize: 15 }}>
                        {googleLoading ? 'Đang xử lý...' : 'Google'}
                      </span>
                      {googleLoading && (
                        <span
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 16,
                            height: 16,
                            border: '2px solid #e0e0e0',
                            borderTop: '2px solid #666',
                            borderRadius: '50%',
                            animation: 'login-spin 0.8s linear infinite'
                          }}
                        />
                      )}
                    </button>
                  )}
                />
              </div>
              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={!sdkReady || facebookLoading}
                className="unimarketLoginSocialButton facebook-button"
                aria-label={facebookLoading ? 'Đang xử lý Facebook...' : 'Đăng nhập với Facebook'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 7,
                  width: 100,
                  height: 39,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  cursor: !sdkReady || facebookLoading ? 'not-allowed' : 'pointer',
                  padding: 0,
                  gap: 8,
                  marginTop: '1px'
                }}
              >
                <FaFacebookF style={{ fontSize: 24, color: '#1877F2' }} />
                <span style={{ color: '#1877F2', fontWeight: 500, fontSize: 15 }}>
                  {facebookLoading ? 'Đang xử lý...' : 'Facebook'}
                </span>
              </button>
            </div>

            <p className="unimarketLoginSignupLink">
              Chưa có tài khoản? <a href="/register" className="unimarketLoginSignupLinkText">Đăng ký tài khoản mới</a>
            </p>

            {/* Đã bỏ phần footer-links và brand-logos theo yêu cầu */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;