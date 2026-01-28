import React from 'react';
import { IoVolumeHigh, IoVolumeMute } from 'react-icons/io5';
import styles from './VideoPlayerSection.module.css';

const VideoOverlayControls = ({
    videoRef,
    duration,
    currentTime,
    volume,
    isMuted,
    isHovering,
    onSeek,
    onVolumeChange,
    onToggleMute
}) => {

    // Hàm format: MM:SS
    const formatTime = (time) => {
        if (!time) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Tính toán vị trí phần trăm cho thanh input range (background)
    const currentPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`${styles.controlsLayer} ${isHovering ? styles.show : ''}`}>

            {/* A. Volume Control */}
            <div className={styles.volumeControl} onClick={(e) => e.stopPropagation()}>
                <div className={styles.muteBtn} onClick={onToggleMute}>
                    {isMuted || volume === 0 ? <IoVolumeMute size={24} color="#fff" /> : <IoVolumeHigh size={24} color="#fff" />}
                </div>
                <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={onVolumeChange}
                    className={styles.volumeSlider}
                />
            </div>

            {/* B. Progress Bar */}
            <div className={styles.progressBarContainer} onClick={(e) => e.stopPropagation()}>
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={onSeek}
                    className={styles.seekSlider}
                    style={{
                        backgroundSize: `${currentPercent}% 100%`
                    }}
                />

                {/* C. TIME DISPLAY (Cố định giữa)
                   - Đã xóa style left dynamic
                   - Vị trí sử dụng CSS lo hoằn toán
                */}
                <div className={styles.timeDisplay}>
                    <span style={{color: '#ff8800'}}>{formatTime(currentTime)}</span>
                    <span style={{color: '#fff', fontSize: '18px', fontWeight: '600', marginLeft: '5px'}}>
                        / {formatTime(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default VideoOverlayControls;
