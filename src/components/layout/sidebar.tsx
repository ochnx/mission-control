'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Target,
  Brain,
  Calendar,
  Users,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Zap,
  LayoutDashboard,
  Activity,
  Briefcase,
  Clock,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { key: 'home', label: 'Command Center', icon: LayoutDashboard, href: '/', emoji: '🏠' },
  { key: 'tasks', label: 'Tasks', icon: Target, href: '/tasks', emoji: '🎯' },
  { key: 'memory', label: 'Second Brain', icon: Brain, href: '/memory', emoji: '🧠' },
  { key: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar', emoji: '📅' },
  { key: 'people', label: 'People', icon: Users, href: '/people', emoji: '👥' },
  { key: 'projects', label: 'Projects', icon: FolderOpen, href: '/projects', emoji: '📁' },
  { key: 'deals', label: 'Deals', icon: Briefcase, href: '/deals', emoji: '💼' },
  { key: 'activity', label: 'Activity', icon: Activity, href: '/activity', emoji: '📊' },
  { key: 'timeline', label: 'Timeline', icon: Clock, href: '/timeline', emoji: '⏰' },
  { key: 'commands', label: 'Commands', icon: Terminal, href: '/commands', emoji: '⚡' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen border-r border-border bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
            Mission Control
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const linkContent = (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.key} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
