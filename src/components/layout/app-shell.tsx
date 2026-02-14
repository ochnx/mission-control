'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { SearchModal } from './search-modal';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar — always visible */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar — overlay with backdrop */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 md:hidden animate-in slide-in-from-left duration-200">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            onOpenSearch={() => setSearchOpen(true)}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
          />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
        <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </TooltipProvider>
  );
}
