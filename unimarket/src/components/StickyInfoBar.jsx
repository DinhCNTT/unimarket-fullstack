// src/components/VideoDetailsPanel/components/StickyInfoBar.jsx
import React, { useState, useEffect } from "react";
import { FaPhoneAlt } from "react-icons/fa";
import { SiMinutemailer } from "react-icons/si";
import "./StickyInfoBar.css";

const StickyInfoBar = ({
  data,
  user,
  onOpenChat,
  panelRef, 
}) => {
  const [showSticky, setShowSticky] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [showPhone, setShowPhone] = useState(false);
  
  // --- 1. LOGIC SCROLL SPY (Tự động đổi màu Tab khi cuộn) ---
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleScroll = () => {
      const scrollTop = panel.scrollTop;
      setShowSticky(scrollTop > 100);

      // Tìm phần tử TRỰC TIẾP mỗi khi cuộn (đảm bảo luôn thấy nếu nó tồn tại)
      const descEl = document.getElementById("section-description");
      const specsEl = document.getElementById("section-specs");

      // Offset khoảng 120px (chiều cao header + sticky bar)
      const offset = 120; 

      let currentTab = "overview";

      // Kiểm tra vị trí
      if (specsEl && scrollTop >= specsEl.offsetTop - offset) {
        currentTab = "specs";
      } else if (descEl && scrollTop >= descEl.offsetTop - offset) {
        currentTab = "description";
      }
      
      setActiveTab(currentTab);
    };

    panel.addEventListener("scroll", handleScroll);
    return () => panel.removeEventListener("scroll", handleScroll);
  }, [panelRef, data]); // Thêm data vào dependency để update khi data đổi

  // --- 2. LOGIC CLICK NÚT CUỘN (Đã sửa) ---
  const scrollTo = (tab) => {
    if (!panelRef?.current) return;
    
    const stickyBarOffset = 115; // Trừ hao chiều cao thanh sticky

    // Case 1: Tổng quan (Luôn đúng)
    if (tab === "overview") {
      panelRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    } 

    // Case 2: Mô tả chi tiết
    // TÌM ELEMENT NGAY LÚC CLICK (Thay vì dùng ref cũ)
    if (tab === "description") {
        const descEl = document.getElementById("section-description");
        if (descEl) {
            panelRef.current.scrollTo({
                top: descEl.offsetTop - stickyBarOffset,
                behavior: "smooth",
            });
        }
        return;
    }

    // Case 3: Thông số kỹ thuật
    if (tab === "specs") {
        const specsEl = document.getElementById("section-specs");
        if (specsEl) {
            panelRef.current.scrollTo({
                top: specsEl.offsetTop - stickyBarOffset,
                behavior: "smooth",
            });
        }
        return;
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return "";
    return showPhone ? phone : phone.slice(0, 6) + "***";
  };

  const getPhone = () => {
    return (
      data?.nguoiDang?.phoneNumber ||
      data?.nguoiDang?.sdt ||
      data?.soDienThoai ||
      "0900000000"
    );
  };

  if (!data) return null;

  const hasSpecs = data.thongSoChiTiet || data.ThongSoChiTiet;

  return (
    <>
      {showSticky && (
        <div className="sticky-container">
          <div className="sticky-info-content">
            <div className="sticky-left">
              <img
                src={data.danhSachAnh?.[0]?.url || data.danhSachAnh?.[0] || "/default.png"}
                alt="thumb"
                className="sticky-thumb"
              />
            </div>
            <div className="sticky-center">
              <div className="sticky-title">{data.tieuDe}</div>
              <div className="sticky-price">{data.gia?.toLocaleString()} đ</div>
            </div>
            <div className="sticky-right">
              <button
                className="sticky-btn phone"
                onClick={() => setShowPhone((prev) => !prev)}
              >
                <FaPhoneAlt />
                {formatPhone(getPhone())}
              </button>
              <button
                className="sticky-btn chat"
                onClick={onOpenChat}
              >
                <SiMinutemailer /> Chat
              </button>
            </div>
          </div>

          <div className="sticky-tab-content">
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => scrollTo("overview")}
            >
              Tổng quan
            </button>
            
            <button
              className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
              onClick={() => scrollTo("description")}
            >
              Mô tả chi tiết
            </button>

            {hasSpecs && (
              <button
                className={`tab-btn ${activeTab === "specs" ? "active" : ""}`}
                onClick={() => scrollTo("specs")}
              >
                Thông số
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StickyInfoBar;