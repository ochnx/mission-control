'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const breadcrumbMap: Record<string, string> = {
  '/tasks': 'Tasks',
  '/memory': 'Second Brain',
  '/calendar': 'Calendar & Reminders',
  '/people': 'People',
  '/projects': 'Projects',
};

interface TopbarProps {
  onOpenSearch: () => void;
}

export function Topbar({ onOpenSearch }: TopbarProps) {
  const pathname = usePathname();
  const title = breadcrumbMap[pathname] || 'Dashboard';

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSearch}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Search className="w-4 h-4" />
          <span className="text-xs">Search</span>
          <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  );
}
