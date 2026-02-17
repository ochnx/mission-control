'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Reminder } from '@/types';

interface CalendarViewProps {
  reminders: Reminder[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClickReminder?: (reminder: Reminder) => void;
}

const typeColors: Record<string, string> = {
  reminder: 'bg-blue-500',
  deadline: 'bg-red-500',
  event: 'bg-emerald-500',
};

export function CalendarView({ reminders, selectedDate, onSelectDate, onClickReminder }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getRemindersForDay = (day: Date) =>
    reminders.filter((r) => isSameDay(new Date(r.datetime), day));

  const selectedReminders = getRemindersForDay(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Calendar Grid */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                setCurrentMonth(new Date());
                onSelectDate(new Date());
              }}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayReminders = getRemindersForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={cn(
                  'relative flex flex-col items-center p-2 text-xs rounded-lg transition-colors min-h-[48px]',
                  !isCurrentMonth && 'text-muted-foreground/40',
                  isSelected && 'bg-primary/10 text-primary',
                  isToday && !isSelected && 'bg-accent',
                  'hover:bg-accent/50'
                )}
              >
                <span className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full',
                  isToday && 'bg-primary text-primary-foreground'
                )}>
                  {format(day, 'd')}
                </span>
                {dayReminders.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayReminders.slice(0, 3).map((r) => (
                      <span
                        key={r.id}
                        className={cn('w-1 h-1 rounded-full', typeColors[r.type])}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">
          {format(selectedDate, 'EEEE, MMM d')}
        </h3>
        {selectedReminders.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing scheduled</p>
        ) : (
          <div className="space-y-2">
            {selectedReminders.map((r) => (
              <div
                key={r.id}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors',
                  r.completed && 'opacity-50'
                )}
                onClick={() => onClickReminder?.(r)}
              >
                <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', typeColors[r.type])} />
                <div className="min-w-0">
                  <p className={cn('text-sm', r.completed && 'line-through')}>
                    {r.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(r.datetime), 'h:mm a')}
                  </p>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{r.notes}</p>
                  )}
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {r.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
