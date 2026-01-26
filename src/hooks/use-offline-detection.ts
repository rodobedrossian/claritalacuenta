import { useEffect } from 'react';
import { showIOSBanner } from './use-ios-banner';

export function useOfflineDetection() {
  useEffect(() => {
    const handleOnline = () => {
      showIOSBanner('Conexión restaurada', 'success');
    };

    const handleOffline = () => {
      showIOSBanner('Sin conexión a internet', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
