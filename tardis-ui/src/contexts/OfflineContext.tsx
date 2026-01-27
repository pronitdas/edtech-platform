import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  wasOffline: boolean;
  isPWA: boolean;
  isInstallable: boolean;
  onInstall: (() => void) | null;
  pendingSync: number;
  syncData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [pendingSync, setPendingSync] = useState(0);

  // Check if running as PWA
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsPWA(isStandalone);
    };

    checkPWA();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWA);

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkPWA);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Trigger sync when coming back online
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const onInstall = useCallback(async () => {
    if (!installPrompt) return null;

    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      setIsInstallable(false);
    }
    setInstallPrompt(null);
    return result;
  }, [installPrompt]);

  // Sync data when coming back online
  const syncData = useCallback(async () => {
    // Get pending items from localStorage
    const pendingItems = localStorage.getItem('pendingSyncItems');
    if (!pendingItems) return;

    try {
      const items = JSON.parse(pendingItems);
      setPendingSync(items.length);

      // Process each pending item
      for (const item of items) {
        try {
          await fetch(item.url, {
            method: item.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...item.headers,
            },
            body: JSON.stringify(item.body),
          });
        } catch (error) {
          console.error('Failed to sync item:', item, error);
        }
      }

      // Clear synced items
      localStorage.removeItem('pendingSyncItems');
      setPendingSync(0);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, []);

  // Queue item for later sync
  const queueForSync = useCallback((url: string, method: string = 'POST', body: any, headers: Record<string, string> = {}) => {
    const pendingItems = localStorage.getItem('pendingSyncItems');
    const items = pendingItems ? JSON.parse(pendingItems) : [];

    items.push({
      url,
      method,
      body,
      headers,
      timestamp: Date.now(),
    });

    localStorage.setItem('pendingSyncItems', JSON.stringify(items));
    setPendingSync(items.length);
  }, []);

  const value: OfflineContextType = {
    isOnline,
    wasOffline,
    isPWA,
    isInstallable,
    onInstall,
    pendingSync,
    syncData,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export default OfflineProvider;
