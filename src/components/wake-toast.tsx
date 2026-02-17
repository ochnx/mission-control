'use client';

export function WakeToast({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-medium shadow-lg backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Agent notified
      </div>
    </div>
  );
}
