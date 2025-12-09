import { useCallback, useEffect, useRef, useState } from 'react';

const mobileBreakpoint = 768;
const tabletBreakpoint = 1024;
const RESIZE_DEBOUNCE_DELAY = 100;

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
  isMobile: boolean;
  isTabletOrSmaller: boolean;
}

/**
 * Custom hook to get window size and responsive breakpoints
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;

      return {
        width,
        height,
        isMobile: width <= mobileBreakpoint,
        isTabletOrSmaller: width < tabletBreakpoint,
      };
    }

    return {
      width: undefined,
      height: undefined,
      isMobile: false,
      isTabletOrSmaller: false,
    };
  });

  const debounceTimeoutRef = useRef<number | null>(null);

  const handleResize = useCallback(() => {
    setWindowSize((prev) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= mobileBreakpoint;
      const isTabletOrSmaller = width < tabletBreakpoint;

      if (
        prev.width === width &&
        prev.height === height &&
        prev.isMobile === isMobile &&
        prev.isTabletOrSmaller === isTabletOrSmaller
      ) {
        return prev;
      }

      return {
        width,
        height,
        isMobile,
        isTabletOrSmaller,
      };
    });
  }, []);

  const debouncedHandleResize = useCallback(() => {
    if (debounceTimeoutRef.current !== null) {
      window.clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = window.setTimeout(() => {
      handleResize();
    }, RESIZE_DEBOUNCE_DELAY);
  }, [handleResize]);

  useEffect(() => {
    window.addEventListener('resize', debouncedHandleResize);

    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [handleResize, debouncedHandleResize]);

  return windowSize;
}
