import React, { useEffect, useRef, useCallback } from 'react';

const useInfiniteScroll = (callback, options = {}) => {
  const { threshold = 200, enabled = true } = options;
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const setSentinel = useCallback((node) => {
    sentinelRef.current = node;

    if (observerRef.current) observerRef.current.disconnect();

    if (!node || !enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observerRef.current.observe(node);
  }, [callback, threshold, enabled]);

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return setSentinel;
};

export default useInfiniteScroll;
