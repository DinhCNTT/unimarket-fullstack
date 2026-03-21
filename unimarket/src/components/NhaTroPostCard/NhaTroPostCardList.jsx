// src/components/NhaTroPostCard/NhaTroPostCardList.jsx
// Card dạng ngang cho List View – ảnh bên trái, info bên phải
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaMapMarkerAlt, FaPlay } from "react-icons/fa";
import { IoFlameSharp } from "react-icons/io5";
import styles from "./NhaTroPostCardList.module.css";
import { formatRelativeTime } from "../../utils/dateUtils";

const NhaTroPostCardList = ({ post, isSaved, onToggleSave, isLoggedIn }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const BASE_URL = "http://localhost:5133";

    const firstImageUrl =
        post.images?.length > 0
            ? post.images[0].startsWith("http")
                ? post.images[0]
                : `${BASE_URL}${post.images[0]}`
            : null;

    const videoUrl = post.videoUrl
        ? post.videoUrl.startsWith("http")
            ? post.videoUrl
            : `${BASE_URL}${post.videoUrl}`
        : null;

    // Lấy chi tiết
    const getDetail = (key) => {
        const details = post.chiTietObj || post.ChiTietObj || {};
        const found = Object.keys(details).find(k => k.toLowerCase().includes(key.toLowerCase()));
        if (found) return details[found];
        if (key.includes("dientich")) return post.dienTichPhong || post.DienTichPhong || null;
        if (key.includes("succhua")) return post.sucChua || post.SucChua || null;
        return null;
    };

    const dienTich = getDetail("dientich") || getDetail("dt");
    const sucChua = getDetail("sucChua") || getDetail("nguoi");

    // Tên tiện ích ngắn
    const tienIchList = (() => {
        const raw = getDetail("tienIch");
        if (Array.isArray(raw)) return raw.slice(0, 4);
        if (typeof raw === "string") return raw.split(",").map(s => s.trim()).slice(0, 4);
        return [];
    })();

    const formatPrice = (price) => {
        if (!price) return "Thỏa thuận";
        if (price >= 1000000) return `${parseFloat((price / 1000000).toFixed(2))} tr/tháng`;
        return `${(price / 1000).toLocaleString()} k/tháng`;
    };

    const handleMouseEnter = () => {
        if (videoUrl && videoRef.current) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
        }
    };

    const handleMouseLeave = () => {
        if (videoUrl && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleSave(post.maTinDang, isSaved);
    };

    return (
        <div className={styles.card}>
            {/* HOT badge */}
            {post.savedCount >= 2 && (
                <div className={styles.hotBadge}>
                    <IoFlameSharp size={12} /> HOT
                </div>
            )}

            <Link to={`/chi-tiet-tin-dang-nha-tro/${post.maTinDang}`} className={styles.link}>
                {/* ── Ảnh bên trái ── */}
                <div
                    className={styles.imageWrap}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {videoUrl ? (
                        <>
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                className={styles.media}
                                muted loop playsInline poster={firstImageUrl}
                            />
                            {!isPlaying && (
                                <div className={styles.playBtn}>
                                    <FaPlay size={12} color="#fff" style={{ marginLeft: 2 }} />
                                </div>
                            )}
                        </>
                    ) : firstImageUrl ? (
                        <img src={firstImageUrl} alt={post.tieuDe} className={styles.media} loading="lazy" />
                    ) : (
                        <div className={styles.noImage}>Chưa có ảnh</div>
                    )}
                    <span className={styles.timeTag}>{formatRelativeTime(post.ngayDang)}</span>
                </div>

                {/* ── Info bên phải ── */}
                <div className={styles.info}>
                    <h3 className={styles.title}>{post.tieuDe}</h3>

                    <div className={styles.priceRow}>
                        <span className={styles.price}>{formatPrice(post.gia)}</span>
                        {dienTich && <span className={styles.tag}>{dienTich} m²</span>}
                        {sucChua && <span className={styles.tag}>{sucChua} người</span>}
                    </div>

                    <div className={styles.location}>
                        <FaMapMarkerAlt size={12} style={{ flexShrink: 0, color: "#f87d14" }} />
                        <span>
                            {post.diaChi || `${post.quanHuyen || ""}${post.quanHuyen && post.tinhThanh ? ", " : ""}${post.tinhThanh || ""}`}
                        </span>
                    </div>

                    {tienIchList.length > 0 && (
                        <div className={styles.amenities}>
                            {tienIchList.map((t, i) => (
                                <span key={i} className={styles.amenityTag}>{t}</span>
                            ))}
                        </div>
                    )}

                    {post.moTa && (
                        <p className={styles.desc}>{post.moTa.replace(/<[^>]+>/g, "").slice(0, 120)}...</p>
                    )}
                </div>
            </Link>

            {/* Nút tim */}
            {isLoggedIn && (
                <div
                    className={`${styles.heartBtn} ${isSaved ? styles.saved : ""}`}
                    onClick={handleSave}
                >
                    <FaHeart size={15} />
                </div>
            )}
        </div>
    );
};

export default NhaTroPostCardList;
