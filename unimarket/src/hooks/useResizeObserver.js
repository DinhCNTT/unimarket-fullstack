import { useEffect, useRef } from 'react';
import { debounce } from '../utils/debounce';

const useResizeObserver = (elementRef, callback, debounceMs = 30) => {
  const debouncedCallback = useRef(debounce(callback, debounceMs)).current;

  useEffect(() => {
    if (!elementRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        debouncedCallback();
      }
    });

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, debouncedCallback]);
};

export default useResizeObserver;
