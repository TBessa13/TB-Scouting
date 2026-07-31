import React, { useEffect } from 'react';

interface NotificationToastProps {
  message: string | null;
  onClear: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClear }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClear();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-6 right-6 z-50 bg-[#1C1C1F] border border-[#ff535b] text-[#e5e2e3] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 max-w-md animate-slide-up">
      <div className="w-8 h-8 rounded-full bg-[#ff535b]/20 flex items-center justify-center text-[#ff535b] flex-shrink-0">
        <span className="material-symbols-outlined text-[20px]">notifications_active</span>
      </div>
      <span className="text-xs font-semibold leading-snug flex-1">{message}</span>
      <button
        onClick={onClear}
        className="text-[#e4bebc] hover:text-[#e5e2e3] p-1"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
