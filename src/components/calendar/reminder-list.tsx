'use client';

import { format, isPast, isToday } from 'date-fns';
import { Check, Clock, AlertCircle, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Reminder } from '@/types';

interface ReminderListProps {
  reminders: Reminder[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onClickReminder?: (reminder: Reminder) => void;
}

const typeIcons: Record<string, typeof Clock> = {
  reminder: Clock,
  deadline: AlertCircle,
  event: CalendarDays,
};

const typeColors: Record<string, string> = {
  reminder: 'text-blue-400',
  deadline: 'text-red-400',
  event: 'text-emerald-400',
};

export function ReminderList({ reminders, onToggleComplete, onClickReminder }: ReminderListProps) {
  const upcoming = reminders.filter((r) => !r.completed);
  const completed = reminders.filter((r) => r.completed);

  const renderItem = (reminder: Reminder) => {
    const Icon = typeIcons[reminder.type] || Clock;
    const isOverdue = !reminder.completed && isPast(new Date(reminder.datetime)) && !isToday(new Date(reminder.datetime));

    return (
      <div
        key={reminder.id}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg glass-card group hover:border-primary/20 transition-all cursor-pointer',
          reminder.completed && 'opacity-50'
        )}
        onClick={() => onClickReminder?.(reminder)}
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'w-6 h-6 shrink-0 rounded-full border',
            reminder.completed
              ? 'bg-primary/20 border-primary text-primary'
              : 'border-muted-foreground/30'
          )}
          onClick={() => onToggleComplete(reminder.id, reminder.completed)}
        >
          {reminder.completed && <Check className="w-3 h-3" />}
        </Button>

        <Icon className={cn('w-4 h-4 shrink-0', typeColors[reminder.type])} />

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm', reminder.completed && 'line-through')}>
            {reminder.title}
          </p>
          {reminder.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{reminder.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px]">
              Overdue
            </Badge>
          )}
          <span className={cn('text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
            {format(new Date(reminder.datetime), 'MMM d, h:mm a')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Upcoming ({upcoming.length})</h3>
        <div className="space-y-2">
          {upcoming.length > 0 ? (
            upcoming.map(renderItem)
          ) : (
            <p className="text-sm text-muted-foreground">Nothing upcoming</p>
          )}
        </div>
      </div>

      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
            Completed ({completed.length})
          </h3>
          <div className="space-y-2">{completed.map(renderItem)}</div>
        </div>
      )}
    </div>
  );
}
