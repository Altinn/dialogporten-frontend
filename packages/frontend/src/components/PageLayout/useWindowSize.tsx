import { useEffect, useState } from 'react';

const mobileBreakpoint = 768;
const tabletBreakpoint = 1024;

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
  isMobile: boolean;
  isTabletOrSmaller: boolean;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= mobileBreakpoint,
        isTabletOrSmaller: window.innerWidth < tabletBreakpoint,
      };
    }
    return {
      width: undefined,
      height: undefined,
      isMobile: false,
      isTabletOrSmaller: false,
    };
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= mobileBreakpoint,
        isTabletOrSmaller: window.innerWidth < tabletBreakpoint,
      });
    }

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
