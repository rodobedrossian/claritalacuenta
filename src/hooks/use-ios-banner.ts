import { useState, useEffect } from 'react';

type BannerType = 'error' | 'info' | 'success';

interface BannerEvent {
  message: string;
  type: BannerType;
}

let bannerTimeout: NodeJS.Timeout | null = null;
const listeners = new Set<(event: BannerEvent | null) => void>();

export const showIOSBanner = (message: string, type: BannerType = 'info') => {
  if (bannerTimeout) clearTimeout(bannerTimeout);
  
  listeners.forEach(listener => listener({ message, type }));
  
  bannerTimeout = setTimeout(() => {
    listeners.forEach(listener => listener(null));
    bannerTimeout = null;
  }, 3000);
};

export function useIOSBanner() {
  const [state, setState] = useState<BannerEvent | null>(null);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
