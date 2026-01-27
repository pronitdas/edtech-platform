import React from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { Wifi, WifiOff, RefreshCw, Download } from 'lucide-react';

interface OfflineBannerProps {
  compact?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ compact = false }) => {
  const { isOnline, wasOffline, syncData, pendingSync } = useOffline();

  if (isOnline && !wasOffline) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${
      isOnline ? 'bg-amber-500' : 'bg-red-500'
    } text-white px-4 py-2 ${compact ? 'py-1' : 'py-3'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        {isOnline ? (
          <>
            <Wifi className="h-5 w-5" />
            <span className="font-medium">
              {compact ? 'Back online' : 'You\'re back online! Syncing your progress...'}
            </span>
            {!compact && pendingSync > 0 && (
              <span className="text-sm opacity-90">
                ({pendingSync} items pending)
              </span>
            )}
            {!compact && (
              <button
                onClick={syncData}
                className="ml-2 p-1 hover:bg-white/20 rounded-full"
                title="Sync now"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5" />
            <span className="font-medium">
              {compact ? 'Offline mode' : 'You\'re offline. Some features may be limited.'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

interface InstallPromptProps {
  className?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ className = '' }) => {
  const { isInstallable, onInstall, isPWA } = useOffline();

  if (isPWA || !isInstallable || !onInstall) return null;

  return (
    <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Install TARDIS App</h3>
            <p className="text-sm text-white/80">
              Get the full experience with our mobile app
            </p>
          </div>
        </div>
        <button
          onClick={() => onInstall()}
          className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default OfflineBanner;
