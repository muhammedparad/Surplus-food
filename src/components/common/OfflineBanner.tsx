import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useApp();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-sm"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are currently working offline. You can browse cached records, but new submissions are paused until reconnected.</span>
    </div>
  );
};
