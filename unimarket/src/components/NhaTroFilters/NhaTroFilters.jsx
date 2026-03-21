// src/components/NhaTroFilters/NhaTroFilters.jsx
import React, { useState, useCallback } from "react";
import styles from "./NhaTroFilters.module.css";
import { FaChevronDown, FaSlidersH, FaTimes } from "react-icons/fa";

// ── Dữ liệu tĩnh ──────────────────────────────────────────────
const PRICE_PRESETS = [
    { label: "Dưới 2 triệu", min: 0, max: 2000000 },
    { label: "2 - 3 triệu", min: 2000000, max: 3000000 },
    { label: "3 - 5 triệu", min: 3000000, max: 5000000 },
    { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
    { label: "Trên 10 triệu", min: 10000000, max: null },
];

const AREA_PRESETS = [
    { label: "Dưới 20 m²", min: 0, max: 20 },
    { label: "20 - 30 m²", min: 20, max: 30 },
    { label: "30 - 50 m²", min: 30, max: 50 },
    { label: "Trên 50 m²", min: 50, max: null },
];

const ROOM_TYPES = [
    "Phòng trọ",
    "Chung cư mini",
    "Nhà nguyên căn",
    "Ký túc xá",
    "Sleepbox",
];

const AMENITIES = [
    "WiFi", "Máy lạnh", "Máy giặt",
    "Bếp", "Ban công", "Chỗ để xe",
    "Camera", "Nhân viên 24/7",
];

const SORT_OPTIONS = [
    { value: "newest", label: "Mới nhất" },
    { value: "price_asc", label: "Giá: thấp → cao" },
    { value: "price_desc", label: "Giá: cao → thấp" },
];

// ── Component chính ───────────────────────────────────────────
const NhaTroFilters = ({ onFilterChange }) => {
    const [activePrice, setActivePrice] = useState(null);
    const [activeArea, setActiveArea] = useState(null);
    const [roomTypes, setRoomTypes] = useState([]);
    const [amenities, setAmenities] = useState([]);
    const [sortBy, setSortBy] = useState("newest");
    const [showAmenities, setShowAmenities] = useState(false);
    const [hasFilter, setHasFilter] = useState(false);

    // ── Emit filters ra ngoài ────────────────────────────────────
    const emit = useCallback((overrides = {}) => {
        const current = {
            priceMin: activePrice?.min ?? null,
            priceMax: activePrice?.max ?? null,
            areaMin: activeArea?.min ?? null,
            areaMax: activeArea?.max ?? null,
            roomTypes,
            amenities,
            sortBy,
            ...overrides,
        };
        onFilterChange?.(current);
        // Kiểm tra có filter nào active không
        const active =
            current.priceMin != null ||
            current.priceMax != null ||
            current.areaMin != null ||
            current.roomTypes.length > 0 ||
            current.amenities.length > 0 ||
            current.sortBy !== "newest";
        setHasFilter(active);
    }, [activePrice, activeArea, roomTypes, amenities, sortBy, onFilterChange]);

    // ── Handlers ─────────────────────────────────────────────────
    const handlePrice = (preset) => {
        const next = activePrice?.label === preset.label ? null : preset;
        setActivePrice(next);
        emit({ priceMin: next?.min ?? null, priceMax: next?.max ?? null });
    };

    const handleArea = (preset) => {
        const next = activeArea?.label === preset.label ? null : preset;
        setActiveArea(next);
        emit({ areaMin: next?.min ?? null, areaMax: next?.max ?? null });
    };

    const toggleRoomType = (type) => {
        const next = roomTypes.includes(type)
            ? roomTypes.filter(t => t !== type)
            : [...roomTypes, type];
        setRoomTypes(next);
        emit({ roomTypes: next });
    };

    const toggleAmenity = (a) => {
        const next = amenities.includes(a)
            ? amenities.filter(x => x !== a)
            : [...amenities, a];
        setAmenities(next);
        emit({ amenities: next });
    };

    const handleSort = (e) => {
        setSortBy(e.target.value);
        emit({ sortBy: e.target.value });
    };

    const handleReset = () => {
        setActivePrice(null);
        setActiveArea(null);
        setRoomTypes([]);
        setAmenities([]);
        setSortBy("newest");
        setHasFilter(false);
        onFilterChange?.({ priceMin: null, priceMax: null, areaMin: null, areaMax: null, roomTypes: [], amenities: [], sortBy: "newest" });
    };

    // ── Số tiện ích được chọn ─────────────────────────────────────
    const amenityCount = amenities.length;

    return (
        <div className={styles.wrapper}>
            {/* ── Hàng filter chính ─── */}
            <div className={styles.filtersBar}>

                {/* SORT --- bên trái */}
                <div className={styles.sortWrap}>
                    <select className={styles.sortSelect} value={sortBy} onChange={handleSort}>
                        {SORT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <FaChevronDown className={styles.sortArrow} />
                </div>

                <div className={styles.divider} />

                {/* PRICE PRESETS */}
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Giá thuê</span>
                    <div className={styles.pills}>
                        {PRICE_PRESETS.map(p => (
                            <button
                                key={p.label}
                                className={`${styles.pill} ${activePrice?.label === p.label ? styles.pillActive : ""}`}
                                onClick={() => handlePrice(p)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.divider} />

                {/* AREA PRESETS */}
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Diện tích</span>
                    <div className={styles.pills}>
                        {AREA_PRESETS.map(p => (
                            <button
                                key={p.label}
                                className={`${styles.pill} ${activeArea?.label === p.label ? styles.pillActive : ""}`}
                                onClick={() => handleArea(p)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.divider} />

                {/* AMENITIES TOGGLE */}
                <button
                    className={`${styles.amenitiesToggle} ${showAmenities || amenityCount > 0 ? styles.amenitiesActive : ""}`}
                    onClick={() => setShowAmenities(s => !s)}
                >
                    <FaSlidersH size={13} />
                    Tiện ích
                    {amenityCount > 0 && <span className={styles.amenityBadge}>{amenityCount}</span>}
                    <FaChevronDown size={11} className={`${styles.arrow} ${showAmenities ? styles.arrowUp : ""}`} />
                </button>

                {/* RESET */}
                {hasFilter && (
                    <button className={styles.resetBtn} onClick={handleReset}>
                        <FaTimes size={11} /> Xóa lọc
                    </button>
                )}
            </div>

            {/* ── Hàng loại phòng ─── */}
            <div className={styles.roomTypesRow}>
                {ROOM_TYPES.map(type => (
                    <button
                        key={type}
                        className={`${styles.roomPill} ${roomTypes.includes(type) ? styles.roomPillActive : ""}`}
                        onClick={() => toggleRoomType(type)}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* ── Panel tiện ích (expand) ─── */}
            {showAmenities && (
                <div className={styles.amenitiesPanel}>
                    {AMENITIES.map(a => (
                        <label
                            key={a}
                            className={`${styles.amenityItem} ${amenities.includes(a) ? styles.amenityChecked : ""}`}
                        >
                            <input
                                type="checkbox"
                                checked={amenities.includes(a)}
                                onChange={() => toggleAmenity(a)}
                                className={styles.amenityCheckbox}
                            />
                            {a}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NhaTroFilters;
