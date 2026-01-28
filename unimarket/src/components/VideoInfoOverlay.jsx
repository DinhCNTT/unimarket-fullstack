// src/components/VideoInfoOverlay.jsx
import React from 'react';
import { FiEye } from "react-icons/fi";
import "./VideoInfoOverlay.css";
const VideoInfoOverlay = ({ video, formatCount, isDraggingVideo }) => {
  if (isDraggingVideo) {
    return null; // Ẩn khi đang kéo thanh progress
  }

  return (
    <div className="vdv-overlay">
      <div className="vdv-user-name">@{video.nguoiDang?.fullName}</div>
      <div className="vdv-title">{video.tieuDe}</div>
      <div className="vdv-price-address">
        <div className="vdv-price">{video.gia?.toLocaleString()} đ</div>
        <div className="vdv-address">
          {video.diaChi}, {video.quanHuyen}, {video.tinhThanh}
        </div>
      </div>
      <div className="vdv-view-count">
        <FiEye className="vdv-view-icon" />
        {formatCount(video.soLuotXem || 0)} lượt xem
      </div>
    </div>
  );
};

export default VideoInfoOverlay;