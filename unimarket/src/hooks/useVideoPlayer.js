// src/hooks/useVideoPlayer.js
import { useState, useRef, useEffect, useCallback } from "react";

export const useVideoPlayer = (videoUrl) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Bắt đầu nên Mute
  const [volume, setVolume] = useState(1);
  const [showHeartEffect, setShowHeartEffect] = useState(false);

  const playerRef = useRef(null);
  const bgPlayerRef = useRef(null);
  const audioRef = useRef(null);

  // Tự động play khi videoUrl thay đổi
  useEffect(() => {
    const playMedia = async () => {
      try {
        await playerRef.current?.play();
        await bgPlayerRef.current?.play();
        await audioRef.current?.play();
      } catch (err) {
        console.warn("Autoplay bị chặn", err);
      }
    };
    if (videoUrl) {
      playMedia();
    }
  }, [videoUrl]);

  // Bật tiếng khi click lần đầu
  useEffect(() => {
    const unmuteOnFirstClick = () => {
      const video = playerRef.current;
      if (video) {
        video.muted = false;
        video.volume = 1.0;
        setIsMuted(false);
        setVolume(1.0);
        video.play().catch((err) => console.warn("Không thể play lại:", err));
      }
    };
    window.addEventListener("click", unmuteOnFirstClick, { once: true });
    return () => window.removeEventListener("click", unmuteOnFirstClick);
  }, []);

  const togglePlayPause = () => {
    const videoMain = playerRef.current;
    const videoBlur = bgPlayerRef.current;
    const audio = audioRef.current;
    if (!videoMain || !videoBlur) return;

    if (videoMain.paused) {
      videoMain.play();
      videoBlur.play();
      audio?.play();
      setIsPlaying(true);
    } else {
      videoMain.pause();
      videoBlur.pause();
      audio?.pause();
      setIsPlaying(false);
    }
  };

  const showHeart = () => {
    setShowHeartEffect(true);
    setTimeout(() => setShowHeartEffect(false), 600);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (playerRef.current) {
      playerRef.current.volume = newVolume;
      playerRef.current.muted = newVolume === 0;
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      audioRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    const newMuted = volume > 0;
    const newVolume = newMuted ? 0 : 1;
    handleVolumeChange(newVolume);
  };

  return {
    playerRef,
    bgPlayerRef,
    audioRef,
    isPlaying,
    isMuted,
    volume,
    showHeartEffect,
    togglePlayPause,
    showHeart,
    handleVolumeChange,
    toggleMute,
    setIsPlaying, // Export setter để đồng bộ với event
  };
};