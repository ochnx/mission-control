'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Target,
  Brain,
  Calendar,
  Users,
  FolderOpen,
  LayoutDashboard,
  Activity,
  Clock,
  Terminal,
  Plus,
  ArrowRight,
  Loader2,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────

type ResultType = 'task' | 'memory' | 'reminder' | 'person' | 'project';

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  status?: string;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Config ──────────────────────────────────────────────────────────

const typeConfig: Record<ResultType, { icon: typeof Target; color: string; route: string }> = {
  task:     { icon: Target,     color: 'text-blue-400',   route: '/tasks' },
  memory:   { icon: Brain,      color: 'text-purple-400', route: '/memory' },
  reminder: { icon: Calendar,   color: 'text-amber-400',  route: '/calendar' },
  person:   { icon: Users,      color: 'text-green-400',  route: '/people' },
  project:  { icon: FolderOpen, color: 'text-orange-400', route: '/projects' },
};

const statusColors: Record<string, string> = {
  todo: 'bg-zinc-400',
  in_progress: 'bg-blue-400',
  done: 'bg-green-400',
  idea: 'bg-zinc-400',
  planned: 'bg-amber-400',
  active: 'bg-green-400',
  paused: 'bg-orange-400',
};

const navPages = [
  { label: 'Command Center', icon: LayoutDashboard, href: '/',          keywords: ['home', 'dashboard', 'command center'] },
  { label: 'Tasks',          icon: Target,          href: '/tasks',     keywords: ['tasks', 'todo', 'kanban'] },
  { label: 'Second Brain',   icon: Brain,           href: '/memory',    keywords: ['memory', 'brain', 'notes', 'knowledge'] },
  { label: 'Calendar',       icon: Calendar,        href: '/calendar',  keywords: ['calendar', 'reminders', 'events'] },
  { label: 'People',         icon: Users,           href: '/people',    keywords: ['people', 'contacts', 'crm'] },
  { label: 'Projects',       icon: FolderOpen,      href: '/projects',  keywords: ['projects'] },
  { label: 'Activity',       icon: Activity,        href: '/activity',  keywords: ['activity', 'log', 'feed'] },
  { label: 'Timeline',       icon: Clock,           href: '/timeline',  keywords: ['timeline', 'history'] },
  { label: 'Commands',       icon: Terminal,         href: '/commands',  keywords: ['commands', 'agent'] },
];

const quickActions = [
  { label: 'New Task',     icon: Plus, route: '/tasks?create=true',    keywords: ['new task', 'create task', 'add task'] },
  { label: 'New Project',  icon: Plus, route: '/projects?create=true', keywords: ['new project', 'create project'] },
  { label: 'New Person',   icon: Plus, route: '/people?create=true',   keywords: ['new person', 'add contact', 'create person'] },
  { label: 'New Memory',   icon: Plus, route: '/memory?create=true',   keywords: ['new memory', 'add memory', 'save note'] },
  { label: 'New Reminder', icon: Plus, route: '/calendar?create=true', keywords: ['new reminder', 'add reminder', 'set reminder'] },
];

// ─── Component ───────────────────────────────────────────────────────

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentItems, setRecentItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset query when modal opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      loadRecent();
    }
  }, [open]);

  // Load recent items
  const loadRecent = useCallback(async () => {
    const [tasks, memories] = await Promise.all([
      supabase.from('mc_tasks').select('id, title, status').order('updated_at', { ascending: false }).limit(3),
      supabase.from('mc_memories').select('id, content, category').order('created_at', { ascending: false }).limit(2),
    ]);

    const items: SearchResult[] = [
      ...(tasks.data || []).map((t) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        subtitle: t.status?.replace('_', ' ') || 'task',
        status: t.status,
      })),
      ...(memories.data || []).map((m) => ({
        type: 'memory' as const,
        id: m.id,
        title: m.content?.slice(0, 80) || 'Untitled',
        subtitle: m.category || 'memory',
      })),
    ];

    setRecentItems(items);
  }, []);

  // Search across all tables
  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.startsWith('>') || q.startsWith('/')) {
      setResults([]);
      return;
    }

    setLoading(true);
    const pattern = `%${q}%`;

    try {
      const [tasks, memories, reminders, people, projects] = await Promise.all([
        supabase.from('mc_tasks').select('id, title, status, description').or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(5),
        supabase.from('mc_memories').select('id, content, category').ilike('content', pattern).limit(5),
        supabase.from('mc_reminders').select('id, title, type, datetime').ilike('title', pattern).limit(5),
        supabase.from('mc_people').select('id, name, company, role').or(`name.ilike.${pattern},company.ilike.${pattern},role.ilike.${pattern}`).limit(5),
        supabase.from('mc_projects').select('id, name, status, description').or(`name.ilike.${pattern},description.ilike.${pattern}`).limit(5),
      ]);

      const combined: SearchResult[] = [
        ...(tasks.data || []).map((t) => ({
          type: 'task' as const,
          id: t.id,
          title: t.title,
          subtitle: t.status?.replace('_', ' ') || 'task',
          status: t.status,
        })),
        ...(memories.data || []).map((m) => ({
          type: 'memory' as const,
          id: m.id,
          title: m.content?.slice(0, 80) || 'Untitled',
          subtitle: m.category || 'memory',
        })),
        ...(reminders.data || []).map((r) => ({
          type: 'reminder' as const,
          id: r.id,
          title: r.title,
          subtitle: r.type || 'reminder',
          meta: r.datetime ? new Date(r.datetime).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) : undefined,
        })),
        ...(people.data || []).map((p) => ({
          type: 'person' as const,
          id: p.id,
          title: p.name,
          subtitle: [p.role, p.company].filter(Boolean).join(' · ') || 'Person',
        })),
        ...(projects.data || []).map((p) => ({
          type: 'project' as const,
          id: p.id,
          title: p.name,
          subtitle: p.status?.replace('_', ' ') || 'project',
          status: p.status,
        })),
      ];

      setResults(combined);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Detect mode
  const isCommandMode = query.startsWith('>');
  const isNavMode = query.startsWith('/');
  const isSearchMode = query.length > 0 && !isCommandMode && !isNavMode;
  const isEmptyMode = query.length === 0;

  // Filter nav pages
  const filteredNavPages = useMemo(() => {
    if (!isNavMode && !isEmptyMode) return [];
    const q = isNavMode ? query.slice(1).toLowerCase().trim() : '';
    if (!q) return navPages;
    return navPages.filter((p) =>
      p.label.toLowerCase().includes(q) || p.keywords.some((k) => k.includes(q))
    );
  }, [query, isNavMode, isEmptyMode]);

  // Filter quick actions
  const filteredActions = useMemo(() => {
    if (!isCommandMode) return [];
    const q = query.slice(1).toLowerCase().trim();
    if (!q) return quickActions;
    return quickActions.filter((a) =>
      a.label.toLowerCase().includes(q) || a.keywords.some((k) => k.includes(q))
    );
  }, [query, isCommandMode]);

  // Group search results by type
  const groupedResults = useMemo(() => {
    const groups: Partial<Record<ResultType, SearchResult[]>> = {};
    for (const r of results) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type]!.push(r);
    }
    return groups;
  }, [results]);

  const groupLabels: Record<ResultType, string> = {
    task: 'Tasks',
    memory: 'Memories',
    reminder: 'Reminders',
    person: 'People',
    project: 'Projects',
  };

  // Handle select
  const handleSelect = (route: string) => {
    onOpenChange(false);
    router.push(route);
  };

  const handleResultSelect = (result: SearchResult) => {
    onOpenChange(false);
    router.push(typeConfig[result.type].route);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={
          isCommandMode
            ? 'Type a command...'
            : isNavMode
            ? 'Go to page...'
            : 'Search everything... (> commands, / navigate)'
        }
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-xs text-muted-foreground">Searching...</span>
          </div>
        )}

        {/* Empty mode: show recent + nav */}
        {isEmptyMode && (
          <>
            {recentItems.length > 0 && (
              <CommandGroup heading="Recent">
                {recentItems.map((item) => {
                  const cfg = typeConfig[item.type];
                  const Icon = cfg.icon;
                  return (
                    <CommandItem
                      key={`recent-${item.type}-${item.id}`}
                      onSelect={() => handleResultSelect(item)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm truncate">{item.title}</span>
                        <span className="text-xs text-muted-foreground capitalize">{item.subtitle}</span>
                      </div>
                      {item.status && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[item.status] || 'bg-zinc-400'}`} />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.label}
                  onSelect={() => handleSelect(action.route)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0 text-primary" />
                  <span className="text-sm">{action.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Navigate">
              {navPages.slice(0, 5).map((page) => {
                const Icon = page.icon;
                return (
                  <CommandItem
                    key={page.href}
                    onSelect={() => handleSelect(page.href)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{page.label}</span>
                    <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground/50" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {/* Command mode */}
        {isCommandMode && (
          <>
            <CommandEmpty>No commands found.</CommandEmpty>
            <CommandGroup heading="Commands">
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.label}
                    onSelect={() => handleSelect(action.route)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm">{action.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {/* Nav mode */}
        {isNavMode && (
          <>
            <CommandEmpty>No pages found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {filteredNavPages.map((page) => {
                const Icon = page.icon;
                return (
                  <CommandItem
                    key={page.href}
                    onSelect={() => handleSelect(page.href)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{page.label}</span>
                    <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground/50" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {/* Search mode */}
        {isSearchMode && !loading && (
          <>
            {results.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
            {(Object.entries(groupedResults) as [ResultType, SearchResult[]][]).map(([type, items]) => {
              const cfg = typeConfig[type];
              return (
                <CommandGroup key={type} heading={groupLabels[type]}>
                  {items.map((result) => {
                    const Icon = cfg.icon;
                    return (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        onSelect={() => handleResultSelect(result)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm truncate">{result.title}</span>
                          <span className="text-xs text-muted-foreground capitalize">{result.subtitle}</span>
                        </div>
                        {result.meta && (
                          <span className="text-xs text-muted-foreground shrink-0">{result.meta}</span>
                        )}
                        {result.status && (
                          <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[result.status] || 'bg-zinc-400'}`} />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </>
        )}
      </CommandList>

      {/* Footer with keyboard hints */}
      <div className="flex items-center gap-4 px-3 py-2 border-t border-border text-[10px] text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 font-mono">↑↓</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 font-mono">↵</kbd>
          select
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 font-mono">esc</kbd>
          close
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 font-mono">&gt;</kbd>
            commands
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 font-mono">/</kbd>
            pages
          </span>
        </span>
      </div>
    </CommandDialog>
  );
}
