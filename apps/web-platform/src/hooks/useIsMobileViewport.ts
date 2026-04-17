'use client';

import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 740;

export function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);

    return () => {
      window.removeEventListener('resize', syncViewport);
    };
  }, []);

  return isMobile;
}
