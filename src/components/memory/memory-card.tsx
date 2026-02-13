'use client';

import { format } from 'date-fns';
import { FileText, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { Memory } from '@/types';

interface MemoryCardProps {
  memory: Memory;
  onDeleted: () => void;
}

const categoryColors: Record<string, string> = {
  Decisions: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Learnings: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Rules: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  People: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Projects: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export function MemoryCard({ memory, onDeleted }: MemoryCardProps) {
  const handleDelete = async () => {
    await supabase.from('mc_memories').delete().eq('id', memory.id);
    onDeleted();
  };

  return (
    <div className="glass-card rounded-lg p-4 group hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between mb-2">
        <Badge
          variant="outline"
          className={categoryColors[memory.category] || ''}
        >
          {memory.category}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <p className="text-sm leading-relaxed mb-3">{memory.content}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {memory.source_file && (
            <>
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{memory.source_file}</span>
            </>
          )}
        </div>
        <span>{format(new Date(memory.created_at), 'MMM d, yyyy')}</span>
      </div>

      {memory.tags && memory.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {memory.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
