// src/components/ChatBanHang/LocationPickerModal.jsx
import React, { useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./ModuleChatCss/LocationPickerModal.module.css";
// Icon SVG cho nút Close và GPS (Dùng tạm SVG inline cho tiện, bạn có thể thay bằng Icon component của bạn)
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const GpsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>;

// Component xử lý logic khi map di chuyển
const MapController = ({ onMove, center }) => {
  const map = useMap();

  // Sự kiện khi map dừng kéo
  React.useEffect(() => {
    if (!map) return;
    
    const handleMoveEnd = () => {
      onMove(map.getCenter());
    };

    map.on('move', handleMoveEnd); // Cập nhật liên tục để UI mượt hơn hoặc dùng 'moveend' để tối ưu
    return () => {
      map.off('move', handleMoveEnd);
    };
  }, [map, onMove]);

  // Di chuyển map khi center thay đổi từ bên ngoài (ví dụ bấm nút GPS)
  React.useEffect(() => {
    if(center) map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
};

const LocationPickerModal = ({ initialPosition, onConfirm, onClose }) => {
  // Mặc định HCM
  const defaultPos = { lat: 10.762622, lng: 106.660172 };
  const [position, setPosition] = useState(initialPosition || defaultPos);
  const [mapCenter, setMapCenter] = useState(initialPosition || defaultPos);

  const handleConfirm = () => {
    onConfirm(position);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter(newPos); // Kích hoạt useEffect trong MapController để bay tới vị trí
          setPosition(newPos);
        },
        () => alert("Không thể lấy vị trí của bạn.")
      );
    }
  };

  // Hàm update vị trí khi kéo map
  const onMapMove = useCallback((newCenter) => {
    setPosition(newCenter);
  }, []);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        
        {/* Header đơn giản hóa */}
        <div className={styles.headerOverlay}>
          <h3>Chọn vị trí giao hàng</h3>
          <button className={styles.btnClose} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className={styles.mapWrapper}>
          <MapContainer 
            center={mapCenter} 
            zoom={17} 
            scrollWheelZoom={true} 
            zoomControl={false} // Tắt nút zoom mặc định xấu xí
            style={{ height: "100%", width: "100%" }}
          >
            {/* Dùng bản đồ CartoDB Voyager cho giao diện sáng, đẹp, hiện đại hơn OSM gốc */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapController onMove={onMapMove} center={mapCenter} />
          </MapContainer>

          {/* CÁI GHIM CỐ ĐỊNH Ở GIỮA (Quan trọng) */}
          <div className={styles.centerPin}>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/447/447031.png" 
              alt="pin" 
              className={styles.pinImage}
            />
            <div className={styles.pinShadow}></div>
          </div>

          {/* Nút GPS nổi trên bản đồ */}
          <button className={styles.btnLocate} onClick={handleLocateMe} title="Vị trí của tôi">
            <GpsIcon />
          </button>
        </div>

        {/* Footer nổi lên trên map */}
        <div className={styles.footerPanel}>
          <div className={styles.coordInfo}>
            <span className={styles.coordLabel}>Vị trí đã chọn:</span>
            <span className={styles.coordValue}>
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </span>
          </div>
          <button className={styles.btnConfirm} onClick={handleConfirm}>
            Xác nhận địa điểm
          </button>
        </div>

      </div>
    </div>
  );
};

export default LocationPickerModal;