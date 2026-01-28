// src/hooks/useVideoScroll.js
import { useState, useEffect, useRef } from "react";
import throttle from "lodash.throttle";

export const useVideoScroll = (scrollRef) => {
  const [hideUserInfo, setHideUserInfo] = useState(false);
  const lastHideStateRef = useRef(false);
  const scrollStopTimer = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = scrollRef.current?.scrollTop || 0;

      if (scrollTop > 100) {
        clearTimeout(scrollStopTimer.current);
        if (!lastHideStateRef.current) {
          setHideUserInfo(true);
          lastHideStateRef.current = true;
        }
      } else {
        clearTimeout(scrollStopTimer.current);
        scrollStopTimer.current = setTimeout(() => {
          if (lastHideStateRef.current) {
            setHideUserInfo(false);
            lastHideStateRef.current = false;
          }
        }, 300);
      }
    };

    const throttledScroll = throttle(handleScroll, 80);
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", throttledScroll);
    }

    return () => {
      if (el) el.removeEventListener("scroll", throttledScroll);
      clearTimeout(scrollStopTimer.current);
    };
  }, [scrollRef]); // Phụ thuộc vào scrollRef

  return hideUserInfo;
};