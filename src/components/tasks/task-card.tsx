'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { GripVertical, Calendar, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const [commanding, setCommanding] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDeepDive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCommanding(true);
    await supabase.from('mc_agent_commands').insert({
      command_type: 'research',
      target_type: 'task',
      target_id: task.id,
      parameters: { title: task.title, description: task.description },
    });
    setCommanding(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group glass-card rounded-lg p-3 cursor-pointer transition-all hover:border-primary/20',
        isDragging && 'opacity-50'
      )}
      onClick={() => onClick?.(task)}
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
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-medium leading-tight">{task.title}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  onClick={handleDeepDive}
                  disabled={commanding}
                >
                  <Search className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Deep Dive</TooltipContent>
            </Tooltip>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', priorityColors[task.priority])}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {task.assignee}
            </Badge>
            {task.due_date && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
