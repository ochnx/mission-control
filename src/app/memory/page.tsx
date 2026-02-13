'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Memory } from '@/types';
import { MemoryCard } from '@/components/memory/memory-card';
import { CreateMemoryDialog } from '@/components/memory/create-memory-dialog';
import { MemoryDetailDialog } from '@/components/memory/memory-detail-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const categories = ['All', 'Decisions', 'Learnings', 'Rules', 'People', 'Projects'] as const;

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchMemories = useCallback(async () => {
    let query = supabase.from('mc_memories').select('*').order('created_at', { ascending: false });

    if (category !== 'All') {
      query = query.eq('category', category);
    }
    if (search.trim()) {
      query = query.ilike('content', `%${search}%`);
    }

    const { data } = await query;
    setMemories(data || []);
    setLoading(false);
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(fetchMemories, 300);
    return () => clearTimeout(timer);
  }, [fetchMemories]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Second Brain</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Decisions, learnings, rules — everything worth remembering
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Memory
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                category === cat && 'bg-primary text-primary-foreground'
              )}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Memory Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading memories...
        </div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p className="text-sm">No memories found</p>
          <p className="text-xs mt-1">Try a different filter or add a new memory</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} onDeleted={fetchMemories} onClick={() => { setSelectedMemory(memory); setDetailOpen(true); }} />
          ))}
        </div>
      )}

      <CreateMemoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchMemories}
      />

      <MemoryDetailDialog
        memory={selectedMemory}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={fetchMemories}
      />
    </div>
  );
}
