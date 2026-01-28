// src/components/context/VolumeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const VolumeContext = createContext();

export const useVolume = () => useContext(VolumeContext);

export const VolumeProvider = ({ children }) => {
    // 1. Lấy giá trị từ localStorage để F5 không bị mất cài đặt
    const [volume, setVolumeState] = useState(() => {
        const savedVol = localStorage.getItem('app_volume');
        return savedVol !== null ? parseFloat(savedVol) : 1; // Mặc định 100%
    });

    const [isMuted, setIsMutedState] = useState(() => {
        const savedMute = localStorage.getItem('app_muted');
        return savedMute === 'true'; // Mặc định false (có tiếng) nhưng cẩn thận autoplay policy    
    });

    // 2. Hàm set volume có lưu vào localStorage
    const setVolume = (val) => {
        setVolumeState(val);
        localStorage.setItem('app_volume', val);
        // UX: Nếu chỉnh volume lên > 0 thì tự động bật tiếng (unmute)
        if (val > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    // 3. Hàm set mute có lưu vào localStorage
    const setIsMuted = (val) => {
        setIsMutedState(val);
        localStorage.setItem('app_muted', val);
    };

    return (
        <VolumeContext.Provider value={{ volume, setVolume, isMuted, setIsMuted }}>
            {children}
        </VolumeContext.Provider>
    );
};
