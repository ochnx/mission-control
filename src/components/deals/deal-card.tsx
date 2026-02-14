'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday } from 'date-fns';
import { GripVertical, Calendar, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Deal } from '@/types';

interface DealCardProps {
  deal: Deal;
  onClick?: (deal: Deal) => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = deal.next_action_date && isPast(new Date(deal.next_action_date)) && !isToday(new Date(deal.next_action_date));

  const totalValue = (deal.value_monthly || 0) + (deal.value_budget || 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group glass-card rounded-lg p-3 cursor-pointer transition-all hover:border-primary/20',
        isDragging && 'opacity-50'
      )}
      onClick={() => onClick?.(deal)}
    >
      <div className="flex items-start gap-2">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{deal.name}</p>
          {deal.company && (
            <p className="text-xs text-muted-foreground mt-0.5">{deal.company.name}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {totalValue > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                <DollarSign className="w-3 h-3" />
                {totalValue.toLocaleString('de-DE')}€/mo
              </span>
            )}
            {deal.next_action && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0',
                  isOverdue ? 'border-red-500/40 text-red-400 bg-red-500/10' : ''
                )}
              >
                {deal.next_action}
              </Badge>
            )}
            {deal.next_action_date && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[10px]',
                  isOverdue ? 'text-red-400 font-medium' : 'text-muted-foreground'
                )}
              >
                <Calendar className="w-3 h-3" />
                {format(new Date(deal.next_action_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
