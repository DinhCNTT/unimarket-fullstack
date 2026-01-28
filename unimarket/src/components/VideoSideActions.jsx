import React from 'react';
import {
  IoHeart, IoHeartOutline, IoBookmark, IoBookmarkOutline,
  IoAddCircleOutline, IoCheckmarkCircleOutline
} from "react-icons/io5";
import { FaRegCommentDots, FaInfoCircle, FaShareAlt } from "react-icons/fa";
import defaultAvatar from "../assets/default-avatar.png";
import { useNavigate } from 'react-router-dom';
import "./VideoSideActions.css";

const VideoSideActions = ({
  video,
  user,
  token,
  isFollowing,
  formatCount,
  onFollow,
  onLike,
  onSave,
  onComment,
  onShare,
  onShowDetail
}) => {
  const navigate = useNavigate();

  return (
    <div className="vdv-side-info">
      {/* Avatar + Follow */}
      <div className="vdv-user-avatar-container">
        <img
          src={video.nguoiDang?.avatarUrl || defaultAvatar}
          alt="avatar"
          className="vdv-user-avatar"
          onClick={() => navigate(`/nguoi-dung/${video.nguoiDang?.id}`)}
          style={{ cursor: "pointer" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultAvatar;
          }}
        />
        {video.nguoiDang?.id && (
          <div
            className="vdv-follow-button"
            onClick={onFollow}
            title={isFollowing ? "Bỏ theo dõi" : "Theo dõi"}
          >
            {isFollowing ? (
              <IoCheckmarkCircleOutline size={24} />
            ) : (
              <IoAddCircleOutline size={24} />
            )}
          </div>
        )}
      </div>

      {/* ❤️ Like */}
      <div
        className="vdv-action-item"
        onClick={onLike}
        title={!token ? "Bạn cần đăng nhập để tym" : video.isLiked ? "Đã tym" : "Nhấn để tym"}
      >
        <div className={`vdv-icon-button vdv-like-button ${video.isLiked ? "liked" : ""}`}>
          {video.isLiked ? (
            <IoHeart size={28} color="#ff4d6d" />
          ) : (
            <IoHeartOutline size={28} />
          )}
        </div>
        <div className="vdv-icon-label">
          {formatCount(video.soTym || 0)}
        </div>
      </div>

      {/* 🔖 Save */}
      <div
        className="vdv-action-item"
        onClick={onSave}
        title={!user ? "Bạn cần đăng nhập để lưu" : video.isSaved ? "Đã lưu" : "Lưu video"}
      >
        <div className="vdv-icon-button">
          {video.isSaved ? (
            <IoBookmark size={24} color="gold" />
          ) : (
            <IoBookmarkOutline size={24} />
          )}
        </div>
        <div className="vdv-icon-label">
          {formatCount(video.soNguoiLuu || 0)}
        </div>
      </div>

      {/* 💬 Comment */}
      <div className="vdv-action-item" onClick={onComment}>
        <div className="vdv-icon-button">
          <FaRegCommentDots size={24} />
        </div>
        <div className="vdv-icon-label">
          {video.soBinhLuan || 0}
        </div>
      </div>

      {/* 📤 Share */}
      <div
        className="vdv-action-item"
        onClick={onShare}
        title="Chia sẻ tin đăng"
      >
        <div className="vdv-icon-button">
          <FaShareAlt size={24} />
        </div>
        <div className="vdv-icon-label">
          {formatCount(video.soLuotChiaSe || 0)}
        </div>
      </div>

      {/* ℹ️ Detail */}
      <div
        className="vdv-action-item"
        onClick={onShowDetail}
        title="Xem chi tiết tin đăng"
      >
        <div className="vdv-icon-button">
          <FaInfoCircle size={24} />
        </div>
      </div>
    </div>
  );
};

export default VideoSideActions;