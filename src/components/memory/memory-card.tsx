'use client';

import { formatDistanceToNow } from 'date-fns';
import { Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Memory } from '@/types';
import { cn } from '@/lib/utils';

interface MemoryCardProps {
  memory: Memory;
  selected: boolean;
  entityCount: number;
  onClick: () => void;
}

const categoryColors: Record<string, string> = {
  Decisions: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Learnings: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Rules: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  People: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Projects: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export function MemoryCard({ memory, selected, entityCount, onClick }: MemoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all duration-150',
        'hover:bg-accent/50',
        selected
          ? 'border-primary/30 bg-primary/5'
          : 'border-transparent hover:border-border'
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Badge
          variant="outline"
          className={cn('text-[10px] py-0 px-1.5', categoryColors[memory.category])}
        >
          {memory.category}
        </Badge>
        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
          {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
        </span>
      </div>

      <p className="text-sm leading-relaxed line-clamp-2 text-foreground/90">
        {memory.content}
      </p>

      <div className="flex items-center gap-2 mt-2">
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0">
            {memory.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0"
              >
                #{tag}
              </span>
            ))}
            {memory.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{memory.tags.length - 3}
              </span>
            )}
          </div>
        )}
        {entityCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 ml-auto">
            <Link2 className="w-3 h-3" />
            {entityCount}
          </div>
        )}
      </div>
    </button>
  );
}
