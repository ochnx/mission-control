'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Memory, MemoryEntity } from '@/types';
import { MemoryCard } from '@/components/memory/memory-card';
import { CreateMemoryDialog } from '@/components/memory/create-memory-dialog';
import { MemoryDetailPanel } from '@/components/memory/memory-detail-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Brain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const categories = ['All', 'Decisions', 'Learnings', 'Rules', 'People', 'Projects'] as const;
const sourceTypes = ['All', 'manual', 'agent', 'telegram', 'email'] as const;
const sourceLabels: Record<string, string> = {
  All: 'All Sources',
  manual: 'Manual',
  agent: 'Agent',
  telegram: 'Telegram',
  email: 'Email',
};

type SortOption = 'newest' | 'most_accessed' | 'most_relevant';

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Entity data for selected memory
  const [entities, setEntities] = useState<MemoryEntity[]>([]);
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});
  const [relatedMemories, setRelatedMemories] = useState<Memory[]>([]);

  const selectedMemory = memories.find((m) => m.id === selectedId) || null;

  const fetchMemories = useCallback(async () => {
    const sortColumn =
      sortBy === 'most_accessed'
        ? 'access_count'
        : sortBy === 'most_relevant'
          ? 'relevance_score'
          : 'created_at';

    let query = supabase
      .from('mc_memories')
      .select('*')
      .order(sortColumn, { ascending: false });

    if (category !== 'All') {
      query = query.eq('category', category);
    }
    if (sourceFilter !== 'All') {
      query = query.eq('source_type', sourceFilter);
    }
    if (search.trim()) {
      query = query.ilike('content', `%${search}%`);
    }

    const { data } = await query;
    setMemories((data as Memory[]) || []);
    setLoading(false);
  }, [category, sourceFilter, search, sortBy]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(fetchMemories, 300);
    return () => clearTimeout(timer);
  }, [fetchMemories]);

  // Fetch entity counts for all memories
  const fetchEntityCounts = useCallback(async () => {
    const { data } = await supabase
      .from('mc_memory_entities')
      .select('memory_id');

    if (data) {
      const counts: Record<string, number> = {};
      for (const row of data as { memory_id: string }[]) {
        counts[row.memory_id] = (counts[row.memory_id] || 0) + 1;
      }
      setEntityCounts(counts);
    }
  }, []);

  useEffect(() => {
    fetchEntityCounts();
  }, [fetchEntityCounts]);

  // Fetch entities + related memories for selected memory
  useEffect(() => {
    if (!selectedId) {
      setEntities([]);
      setRelatedMemories([]);
      return;
    }

    let cancelled = false;

    async function fetchDetail() {
      // Fetch entities for this memory
      const { data: entityData } = await supabase
        .from('mc_memory_entities')
        .select('*')
        .eq('memory_id', selectedId);

      if (cancelled) return;
      const ents = (entityData as MemoryEntity[]) || [];
      setEntities(ents);

      // Find related memories (share entities)
      if (ents.length > 0) {
        const entityNames = ents.map((e) => e.entity_name);
        const { data: relatedEntityData } = await supabase
          .from('mc_memory_entities')
          .select('memory_id')
          .in('entity_name', entityNames)
          .neq('memory_id', selectedId);

        if (cancelled) return;
        if (relatedEntityData && relatedEntityData.length > 0) {
          const relatedIds = [
            ...new Set((relatedEntityData as { memory_id: string }[]).map((r) => r.memory_id)),
          ];
          const { data: relatedData } = await supabase
            .from('mc_memories')
            .select('*')
            .in('id', relatedIds.slice(0, 5))
            .order('created_at', { ascending: false });

          if (!cancelled) {
            setRelatedMemories((relatedData as Memory[]) || []);
          }
        } else {
          setRelatedMemories([]);
        }
      } else {
        setRelatedMemories([]);
      }

      // Increment access count
      await supabase
        .from('mc_memories')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (memories.find((m) => m.id === selectedId)?.access_count ?? 0) + 1,
        })
        .eq('id', selectedId);
    }

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedId, memories]);

  const handleDeleted = () => {
    setSelectedId(null);
    fetchMemories();
    fetchEntityCounts();
  };

  const handleUpdated = () => {
    fetchMemories();
    fetchEntityCounts();
    // Re-trigger entity fetch for selected memory
    if (selectedId) {
      const id = selectedId;
      setSelectedId(null);
      setTimeout(() => setSelectedId(id), 0);
    }
  };

  return (
    <div className="flex -m-6 h-[calc(100vh-3.5rem)]">
      {/* Left Sidebar - Memory List */}
      <div className="w-full md:w-[40%] md:min-w-[340px] md:max-w-[480px] border-r border-border flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Second Brain</h2>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="most_accessed">Most Accessed</SelectItem>
                <SelectItem value="most_relevant">Most Relevant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="pl-9 h-9"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-colors text-xs',
                  category === cat && 'bg-primary text-primary-foreground'
                )}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {sourceTypes.map((src) => (
              <Badge
                key={src}
                variant={sourceFilter === src ? 'default' : 'secondary'}
                className={cn(
                  'cursor-pointer transition-colors text-[10px]',
                  sourceFilter === src
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setSourceFilter(src)}
              >
                {sourceLabels[src]}
              </Badge>
            ))}
          </div>
        </div>

        {/* Memory List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Loading memories...
              </div>
            ) : memories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <p className="text-sm">No memories found</p>
                <p className="text-xs mt-1">Try a different filter or capture something new</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {memories.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    selected={memory.id === selectedId}
                    entityCount={entityCounts[memory.id] || 0}
                    onClick={() => setSelectedId(memory.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Detail View */}
      <div className="hidden md:flex flex-1 flex-col bg-background min-w-0">
        {selectedMemory ? (
          <MemoryDetailPanel
            memory={selectedMemory}
            entities={entities}
            relatedMemories={relatedMemories}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
            onSelectMemory={setSelectedId}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Your Second Brain</h3>
            <p className="text-sm text-center max-w-xs">
              Select a memory to view details, or capture something new with the + button
            </p>
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Quick Capture
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Detail View (shown below list when memory selected) */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 bg-background md:hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
            <h3 className="text-sm font-medium">Memory Detail</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
              Back
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <MemoryDetailPanel
              memory={selectedMemory}
              entities={entities}
              relatedMemories={relatedMemories}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onSelectMemory={setSelectedId}
            />
          </div>
        </div>
      )}

      {/* Floating Quick Capture Button */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CreateMemoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchMemories}
      />
    </div>
  );
}
