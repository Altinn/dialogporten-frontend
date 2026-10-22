import { type RefObject, useEffect, useState } from 'react';

/**
 * Becomes true once the element has come within `rootMargin` of the viewport, and stays true.
 * Falls back to true where IntersectionObserver is unavailable.
 */
export const useInViewOnce = (ref: RefObject<Element | null>, rootMargin = '200px 0px'): boolean => {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, inView]);

  return inView;
};
