import React, { useState, useRef, useEffect } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import styles from "./VideoVolumeControl.module.css"; 

export default function VideoVolumeControl({
  volume,
  toggleMute,
  handleVolumeChange,
}) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const hideVolumeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideVolumeTimeoutRef.current) {
        clearTimeout(hideVolumeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={styles.volumeControlWrapper}
      onMouseEnter={() => {
        if (hideVolumeTimeoutRef.current) {
          clearTimeout(hideVolumeTimeoutRef.current);
          hideVolumeTimeoutRef.current = null;
        }
        setShowVolumeSlider(true);
      }}
      onMouseLeave={() => {
        hideVolumeTimeoutRef.current = setTimeout(() => {
          setShowVolumeSlider(false);
        }, 2000);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {showVolumeSlider && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const newVolume = parseFloat(e.target.value);
            handleVolumeChange(newVolume);
          }}
          className={styles.volumeSlider}
        />
      )}

      <button
        className={styles.volumeBtn}
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
      >
        {volume === 0 ? (
          <FaVolumeMute size={22} color="#fff" />
        ) : (
          <FaVolumeUp size={22} color="#fff" />
        )}
      </button>
    </div>
  );
}