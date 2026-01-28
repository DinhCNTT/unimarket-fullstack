// src/components/VideoPlayer.jsx
import React from 'react';
import VideoControls from "./VideoControls";
import "./VideoPlayer.css";
const VideoPlayer = ({
  video,
  index,
  currentIndex,
  videoElsRef,
  videoRef,
  setAspectRatios, // Sửa: Chỉ cần setAspectRatios
  handleVideoClick,
  showControls,
  handleDragStateChange
}) => {
  
  // Toàn bộ logic `ratioClass` và các thẻ div layout
  // sẽ được chuyển về component cha (VideoDetailViewer.jsx)
  
  return (
    // Sử dụng React.Fragment (hoặc <></>) vì component này không cần thẻ div bọc
    <>
      <video
        ref={(el) => {
          videoElsRef.current[index] = el;
          if (index === currentIndex) videoRef.current = el;
        }}
        src={video.videoUrl}
        className="vdv-player"
        controls={false}
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        autoPlay={index === currentIndex}
        loop
        onClick={(e) => handleVideoClick(e, index)}
        onDoubleClick={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => {
          const ratio = e.target.videoWidth / e.target.videoHeight;
          setAspectRatios((prev) => ({
            ...prev,
            [index]: ratio,
          }));
        }}
      />

      {index === currentIndex && (
        <VideoControls
          videoRef={videoRef}
          isVisible={showControls}
          onDragStateChange={handleDragStateChange}
        />
      )}
    </>
  );
};

export default VideoPlayer;