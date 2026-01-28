import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Tạo unique tab ID
  const [tabId] = useState(() => {
    let storedTabId = sessionStorage.getItem("tabId");
    if (!storedTabId) {
      storedTabId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("tabId", storedTabId);
    }
    return storedTabId;
  });

  // State chính
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [role, setRoleState] = useState(null);
  const [fullName, setFullNameState] = useState("");
  const [email, setEmailState] = useState("");
  const [phoneNumber, setPhoneNumberState] = useState("");
  const [avatarUrl, setAvatarUrlState] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Hàm lấy token từ storage (ưu tiên sessionStorage)
  const getStoredToken = () => {
    const sessionToken = sessionStorage.getItem("token");
    if (sessionToken) return sessionToken;
    
    const localToken = localStorage.getItem("token");
    if (localToken) {
      // Copy sang sessionStorage cho tab này
      sessionStorage.setItem("token", localToken);
      return localToken;
    }
    
    return null;
  };

  // ✅ Hàm lấy user từ storage (ưu tiên sessionStorage)
  const getStoredUser = () => {
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) {
        return JSON.parse(sessionUser);
      }
      
      const localUser = localStorage.getItem("user");
      if (localUser) {
        const userData = JSON.parse(localUser);
        // Copy sang sessionStorage cho tab này
        sessionStorage.setItem("user", JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);
    }
    
    return null;
  };

  // ✅ Hàm khôi phục user từ localStorage individual fields (fallback)
  const getStoredUserFromFields = () => {
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
    const userFullName = localStorage.getItem("userFullName") || sessionStorage.getItem("userFullName");
    const userRole = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
    const userPhoneNumber = localStorage.getItem("userPhoneNumber") || sessionStorage.getItem("userPhoneNumber");
    const userAvatar = localStorage.getItem("userAvatar") || sessionStorage.getItem("userAvatar");
    const storedToken = getStoredToken();
    
    if (userId && userEmail && storedToken) {
      return {
        id: userId,
        email: userEmail,
        fullName: userFullName || "",
        role: userRole || "User",
        phoneNumber: userPhoneNumber || "",
        avatarUrl: userAvatar || "",
        token: storedToken,
        emailConfirmed: true // Giả định đã xác minh nếu có token
      };
    }
    
    return null;
  };

  // ✅ Hàm lưu user vào storage
  const saveUserToStorage = (userData) => {
    if (!userData) return;
    
    const userToSave = {
      id: userData.id,
      email: userData.email,
      fullName: userData.fullName || "",
      role: userData.role || "User",
      phoneNumber: userData.phoneNumber || "",
      avatarUrl: userData.avatarUrl || "",
      token: userData.token,
      emailConfirmed: userData.emailConfirmed || false,
      loginProvider: userData.loginProvider || "Email"
    };
    
    // Lưu vào sessionStorage (ưu tiên cho tab hiện tại)
    sessionStorage.setItem("user", JSON.stringify(userToSave));
    sessionStorage.setItem("userId", userData.id || "");
    sessionStorage.setItem("userEmail", userData.email || "");
    sessionStorage.setItem("userFullName", userData.fullName || "");
    sessionStorage.setItem("userRole", userData.role || "User");
    sessionStorage.setItem("userPhoneNumber", userData.phoneNumber || "");
    sessionStorage.setItem("userAvatar", userData.avatarUrl || "");
    
    // Lưu vào localStorage (để tab mới có thể sử dụng)
    localStorage.setItem("user", JSON.stringify(userToSave));
    localStorage.setItem("userId", userData.id || "");
    localStorage.setItem("userEmail", userData.email || "");
    localStorage.setItem("userFullName", userData.fullName || "");
    localStorage.setItem("userRole", userData.role || "User");
    localStorage.setItem("userPhoneNumber", userData.phoneNumber || "");
    localStorage.setItem("userAvatar", userData.avatarUrl || "");
  };

  // ✅ Hàm lưu token vào storage
  const saveTokenToStorage = (tokenValue) => {
    if (tokenValue) {
      sessionStorage.setItem("token", tokenValue);
      localStorage.setItem("token", tokenValue);
    }
  };

  // ✅ Hàm xóa dữ liệu khỏi storage
  const clearStorage = () => {
    // Xóa từ sessionStorage
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userFullName");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userPhoneNumber");
    sessionStorage.removeItem("userAvatar");
    sessionStorage.removeItem("token");
    
    // Xóa từ localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userPhoneNumber");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("token");
  };

  // ✅ Hàm set user (public API)
  const setUser = (newUser) => {
    if (newUser) {
      // Đảm bảo user object có token
      const userWithToken = {
        ...newUser,
        token: newUser.token || getStoredToken()
      };
      
      setUserState(userWithToken);
      setRoleState(userWithToken.role || "User");
      setFullNameState(userWithToken.fullName || "");
      setEmailState(userWithToken.email || "");
      setPhoneNumberState(userWithToken.phoneNumber || "");
      setAvatarUrlState(userWithToken.avatarUrl || "");
      
      // Lưu vào storage
      saveUserToStorage(userWithToken);
    } else {
      // Reset tất cả state
      setUserState(null);
      setRoleState(null);
      setFullNameState("");
      setEmailState("");
      setPhoneNumberState("");
      setAvatarUrlState("");
      
      // Xóa storage
      clearStorage();
    }
  };

  // ✅ Hàm update user (chỉ cập nhật một số field)
  const updateUser = (updates) => {
    setUserState(prevUser => {
      if (!prevUser) return prevUser;
      
      const updatedUser = { ...prevUser, ...updates };
      
      // Cập nhật individual states
      if (updates.role !== undefined) setRoleState(updates.role);
      if (updates.fullName !== undefined) setFullNameState(updates.fullName);
      if (updates.email !== undefined) setEmailState(updates.email);
      if (updates.phoneNumber !== undefined) setPhoneNumberState(updates.phoneNumber);
      if (updates.avatarUrl !== undefined) setAvatarUrlState(updates.avatarUrl);
      
      // Lưu vào storage
      saveUserToStorage(updatedUser);
      
      return updatedUser;
    });
  };

  // ✅ Hàm set token (public API)
  const setToken = (newToken) => {
    setTokenState(newToken);
    
    if (newToken) {
      saveTokenToStorage(newToken);
      
      // Cập nhật token trong user object nếu có
      if (user) {
        const userWithToken = { ...user, token: newToken };
        setUserState(userWithToken);
        saveUserToStorage(userWithToken);
      }
    } else {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    }
  };

  // ✅ Hàm logout với cross-tab sync
  const logout = () => {
    // Reset tất cả state
    setUserState(null);
    setTokenState(null);
    setRoleState(null);
    setFullNameState("");
    setEmailState("");
    setPhoneNumberState("");
    setAvatarUrlState("");
    
    // Xóa storage
    clearStorage();
    
    // 🔥 THÊM: Gửi signal logout cho các tab khác
    // Sử dụng localStorage để trigger storage event trên các tab khác
    localStorage.setItem("logout_signal", Date.now().toString());
    // Xóa ngay sau đó để không ảnh hưởng đến việc restore data
    setTimeout(() => {
      localStorage.removeItem("logout_signal");
    }, 100);
    
    // 🔥 THÊM: Gửi signal để clear search history UI trên tất cả tabs
    localStorage.setItem("clear_search_history_ui", Date.now().toString());
    setTimeout(() => {
      localStorage.removeItem("clear_search_history_ui");
    }, 100);
  };

  // 🔥 THÊM: Listen cho storage events để đồng bộ logout cross-tab
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Xử lý logout signal
      if (e.key === "logout_signal" && e.newValue) {
        console.log(`Tab ${tabId}: Received logout signal from another tab`);
        
        // Reset tất cả state (không cần gọi clearStorage vì tab khác đã xóa rồi)
        setUserState(null);
        setTokenState(null);
        setRoleState(null);
        setFullNameState("");
        setEmailState("");
        setPhoneNumberState("");
        setAvatarUrlState("");
        
        // Xóa sessionStorage của tab hiện tại
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("userEmail");
        sessionStorage.removeItem("userFullName");
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("userPhoneNumber");
        sessionStorage.removeItem("userAvatar");
        sessionStorage.removeItem("token");
        
        console.log(`Tab ${tabId}: Logged out due to cross-tab logout`);
      }
      
      // 🔥 THÊM: Xử lý clear search history UI signal
      if (e.key === "clear_search_history_ui" && e.newValue) {
        console.log(`Tab ${tabId}: Received clear search history UI signal`);
        // Trigger custom event để VideoSearchOverlay có thể listen
        window.dispatchEvent(new CustomEvent('clearSearchHistoryUI'));
      }
    };

    // Chỉ listen storage event khi đã mount
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [tabId]); // Dependency chỉ cần tabId

  // ✅ Khôi phục dữ liệu khi component mount
  useEffect(() => {
    const restoreAuthData = () => {
      try {
        const storedToken = getStoredToken();
        const storedUser = getStoredUser() || getStoredUserFromFields();
        
        if (storedToken) {
          setTokenState(storedToken);
        }
        
        if (storedUser) {
          // Đảm bảo user object có token
          const userWithToken = {
            ...storedUser,
            token: storedUser.token || storedToken
          };
          
          setUserState(userWithToken);
          setRoleState(userWithToken.role || "User");
          setFullNameState(userWithToken.fullName || "");
          setEmailState(userWithToken.email || "");
          setPhoneNumberState(userWithToken.phoneNumber || "");
          setAvatarUrlState(userWithToken.avatarUrl || "");
          
          // Lưu lại user hoàn chỉnh vào storage
          saveUserToStorage(userWithToken);
          
          console.log("Auth data restored:", {
            user: userWithToken,
            token: storedToken,
            hasToken: !!storedToken,
            hasUserToken: !!userWithToken.token
          });
        }
      } catch (error) {
        console.error("Error restoring auth data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    restoreAuthData();
  }, []);

  // ✅ Individual setters (backwards compatibility)
  const setRole = (newRole) => {
    setRoleState(newRole);
    if (user) {
      updateUser({ role: newRole });
    }
  };

  const setFullName = (newFullName) => {
    setFullNameState(newFullName);
    if (user) {
      updateUser({ fullName: newFullName });
    }
  };

  const setEmail = (newEmail) => {
    setEmailState(newEmail);
    if (user) {
      updateUser({ email: newEmail });
    }
  };

  const setPhoneNumber = (newPhoneNumber) => {
    setPhoneNumberState(newPhoneNumber);
    if (user) {
      updateUser({ phoneNumber: newPhoneNumber });
    }
  };

  const setAvatarUrl = (newAvatarUrl) => {
    setAvatarUrlState(newAvatarUrl);
    if (user) {
      updateUser({ avatarUrl: newAvatarUrl });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        // States
        user,
        role,
        fullName,
        email,
        phoneNumber,
        avatarUrl,
        token,
        tabId,
        loading,
        
        // Setters
        setUser,
        updateUser,
        setRole,
        setFullName,
        setEmail,
        setPhoneNumber,
        setAvatarUrl,
        setToken,
        logout,
        
        // Utility functions
        getStoredToken,
        getStoredUser,
        saveUserToStorage,
        saveTokenToStorage,
        clearStorage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};