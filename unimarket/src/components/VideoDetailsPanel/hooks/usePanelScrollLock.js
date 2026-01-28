import { useEffect, useRef } from "react";

export const usePanelScrollLock = (isOpen, panelRef) => {
  const touchStartYRef = useRef(null);

  // 1. Add/remove class .no-scroll global
  useEffect(() => {
    const viewer =
      document.querySelector(".vdv-wrapper") ||
      document.querySelector(".vdv-full-screen-scroll") ||
      document.querySelector(".video-detail-viewer");
    
    if (!viewer) return;

    if (isOpen) {
      viewer.classList.add("no-scroll");
    } else {
      viewer.classList.remove("no-scroll");
    }
  }, [isOpen]);

  // 2. Event Listeners capture
  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    const onWheelCapture = (e) => {
      if (panel.contains(e.target)) {
        const atTop = panel.scrollTop === 0 && e.deltaY < 0;
        const atBottom = panel.scrollHeight - panel.clientHeight === panel.scrollTop && e.deltaY > 0;

        if (atTop || atBottom) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };

    const onTouchStartCapture = (e) => {
      touchStartYRef.current = e.touches ? e.touches[0].clientY : null;
    };

    const onTouchMoveCapture = (e) => {
      const currentY = e.touches ? e.touches[0].clientY : null;
      const startY = touchStartYRef.current;
      const deltaY = startY != null && currentY != null ? currentY - startY : 0;

      if (panel.contains(e.target)) {
        const atTop = panel.scrollTop === 0 && deltaY > 0;
        const atBottom = panel.scrollHeight - panel.clientHeight === panel.scrollTop && deltaY < 0;

        if (atTop || atBottom) {
          e.preventDefault();
          e.stopPropagation();
        }
        touchStartYRef.current = currentY;
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("wheel", onWheelCapture, { passive: false, capture: true });
    document.addEventListener("touchstart", onTouchStartCapture, { passive: true, capture: true });
    document.addEventListener("touchmove", onTouchMoveCapture, { passive: false, capture: true });

    return () => {
      document.removeEventListener("wheel", onWheelCapture, { capture: true });
      document.removeEventListener("touchstart", onTouchStartCapture, { capture: true });
      document.removeEventListener("touchmove", onTouchMoveCapture, { capture: true });
      touchStartYRef.current = null;
    };
  }, [isOpen, panelRef]);
};