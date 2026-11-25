import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-yellow-300 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[40px]"
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-2.5 py-2 text-xs font-semibold text-yellow-300 hover:bg-yellow-400/20 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Install Simna Construction</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg"
                  aria-label="Close install instructions"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
                1. Tap the <strong className="text-yellow-400">Share</strong> icon in your Safari toolbar.
                <br />
                2. Scroll down and tap <strong className="text-yellow-400">Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-300 transition-colors"
              >
                समझ गया / Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-2 rounded-xl border border-yellow-500/40 bg-zinc-900 px-3.5 py-2.5 text-xs font-medium text-yellow-300 shadow-xl">
      <WifiOff className="w-4 h-4 shrink-0 text-yellow-400" />
      <span>ऑफ़लाइन मोड — कैश्ड जानकारी दिख रही है / Offline Mode</span>
    </div>
  );
};
