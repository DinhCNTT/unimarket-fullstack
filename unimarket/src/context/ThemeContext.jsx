// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Lấy theme đã lưu, mặc định là 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // 1. Lưu vào localStorage
    localStorage.setItem('theme', theme);

    // 2. CẬP NHẬT QUAN TRỌNG: Gắn attribute vào thẻ HTML
    // Nếu theme là 'auto', tạm thời ta coi như 'light' hoặc 'dark' tùy bạn, ở đây ta xử lý đơn giản:
    const modeToApply = theme === 'auto' ? 'light' : theme; 
    document.documentElement.setAttribute('data-theme', modeToApply);
    
  }, [theme]);

  const effectiveTheme = theme === 'auto' ? 'light' : theme;

  const value = {
    theme, 
    setTheme, 
    effectiveTheme, 
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};