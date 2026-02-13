'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Target, Brain, Calendar, Users, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  type: 'task' | 'memory' | 'reminder' | 'person' | 'project';
  id: string;
  title: string;
  subtitle: string;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  task: Target,
  memory: Brain,
  reminder: Calendar,
  person: Users,
  project: FolderOpen,
};

const typeRoutes = {
  task: '/tasks',
  memory: '/memory',
  reminder: '/calendar',
  person: '/people',
  project: '/projects',
};

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState('');

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    const pattern = `%${q}%`;

    const [tasks, memories, reminders, people, projects] = await Promise.all([
      supabase.from('mc_tasks').select('id, title, status').ilike('title', pattern).limit(5),
      supabase.from('mc_memories').select('id, content, category').ilike('content', pattern).limit(5),
      supabase.from('mc_reminders').select('id, title, type').ilike('title', pattern).limit(5),
      supabase.from('mc_people').select('id, name, company').ilike('name', pattern).limit(5),
      supabase.from('mc_projects').select('id, name, status').ilike('name', pattern).limit(5),
    ]);

    const combined: SearchResult[] = [
      ...(tasks.data || []).map((t) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        subtitle: `Task · ${t.status}`,
      })),
      ...(memories.data || []).map((m) => ({
        type: 'memory' as const,
        id: m.id,
        title: m.content.slice(0, 80),
        subtitle: `Memory · ${m.category}`,
      })),
      ...(reminders.data || []).map((r) => ({
        type: 'reminder' as const,
        id: r.id,
        title: r.title,
        subtitle: `${r.type}`,
      })),
      ...(people.data || []).map((p) => ({
        type: 'person' as const,
        id: p.id,
        title: p.name,
        subtitle: p.company || 'Person',
      })),
      ...(projects.data || []).map((p) => ({
        type: 'project' as const,
        id: p.id,
        title: p.name,
        subtitle: `Project · ${p.status}`,
      })),
    ];

    setResults(combined);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    router.push(typeRoutes[result.type]);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search tasks, memories, people, projects..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Results">
            {results.map((result) => {
              const Icon = typeIcons[result.type];
              return (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm truncate">{result.title}</span>
                    <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
