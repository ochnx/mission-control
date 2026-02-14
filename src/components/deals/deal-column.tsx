'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DealColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

const columnColors: Record<string, string> = {
  lead: 'bg-blue-500/10 text-blue-400',
  proposal: 'bg-purple-500/10 text-purple-400',
  negotiation: 'bg-amber-500/10 text-amber-400',
  signed: 'bg-emerald-500/10 text-emerald-400',
  active: 'bg-teal-500/10 text-teal-400',
  churned: 'bg-red-500/10 text-red-400',
};

export function DealColumn({ id, title, count, children }: DealColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border border-border bg-card/50 p-3 min-w-[220px] kanban-column transition-colors',
        isOver && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', columnColors[id])}>
            {title}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-2 min-h-[100px]">{children}</div>
    </div>
  );
}
