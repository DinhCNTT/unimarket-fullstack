import React, { useState } from "react";
import styles from "./VideoInfo.module.css"; // ✅

export default function VideoInfo({ video }) {
  const [expanded, setExpanded] = useState(false);

  if (!video) {
    return <div className={styles.userInfoWrapper}>Đang tải...</div>;
  }

  return (
    <div className={styles.userInfoWrapper}>
      <div className={styles.userInfo}>
        <img
          src={video?.nguoiDang?.avatarUrl || "/default-avatar.png"}
          alt="avatar"
          className={styles.avatar}
        />
        <div className={styles.userDetails}>
          <strong className={styles.userName}>
            {video?.nguoiDang?.fullName || "Người dùng"}
          </strong>
          <div className={styles.location}>
            {video?.diaChi}, {video?.quanHuyen}, {video?.tinhThanh}
          </div>
        </div>
      </div>

      <div className={styles.videoInfo}>
        <h2 className={styles.title}>{video?.tieuDe}</h2>
        <p className={`${styles.description} ${expanded ? styles.expanded : ""}`}>
          {video?.moTa}
        </p>
        {video?.moTa?.length > 120 && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className={styles.readMore}
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </button>
        )}
      </div>
    </div>
  );
}