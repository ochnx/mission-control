'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  addWeeks,
  subWeeks,
  isPast,
  isToday,
  parseISO,
  setHours,
  setMinutes,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  CalendarDays,
  Check,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Reminder } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CreateReminderDialog } from '@/components/calendar/create-reminder-dialog';
import { ReminderDetailDialog } from '@/components/calendar/reminder-detail-dialog';

type ViewMode = 'month' | 'week';

const typeColors = {
  reminder: { dot: 'bg-blue-500', text: 'text-blue-400', bar: 'bg-blue-500/80', border: 'border-blue-500/40' },
  deadline: { dot: 'bg-red-500', text: 'text-red-400', bar: 'bg-red-500/80', border: 'border-red-500/40' },
  event: { dot: 'bg-emerald-500', text: 'text-emerald-400', bar: 'bg-emerald-500/80', border: 'border-emerald-500/40' },
} as const;

const typeIcons = {
  reminder: Clock,
  deadline: AlertCircle,
  event: CalendarDays,
} as const;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function parseQuickAdd(text: string): { title: string; type: Reminder['type']; datetime?: Date } {
  let type: Reminder['type'] = 'reminder';
  let title = text.trim();

  if (/\b(deadline|due)\b/i.test(title)) {
    type = 'deadline';
    title = title.replace(/\b(deadline|due)\b:?\s*/i, '').trim();
  } else if (/\b(event|meeting|call)\b/i.test(title)) {
    type = 'event';
  }

  const timeMatch = title.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  let datetime: Date | undefined;
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
    datetime = setMinutes(setHours(new Date(), hours), minutes);
    title = title.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i, '').trim();
  }

  return { title, type, datetime };
}

export default function CalendarPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [createPrefillDate, setCreatePrefillDate] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

  const fetchReminders = useCallback(async () => {
    const { data } = await supabase
      .from('mc_reminders')
      .select('*')
      .order('datetime', { ascending: true });
    setReminders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const getRemindersForDay = useCallback(
    (day: Date) => reminders.filter((r) => isSameDay(parseISO(r.datetime), day)),
    [reminders]
  );

  const selectedDayReminders = useMemo(
    () => getRemindersForDay(selectedDate),
    [selectedDate, getRemindersForDay]
  );

  const upcomingReminders = useMemo(
    () => reminders.filter((r) => !r.completed && !isPast(parseISO(r.datetime))).slice(0, 8),
    [reminders]
  );

  const overdueReminders = useMemo(
    () => reminders.filter((r) => !r.completed && isPast(parseISO(r.datetime)) && !isToday(parseISO(r.datetime))),
    [reminders]
  );

  // Navigation
  const navigateBack = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };
  const navigateForward = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Month view days
  const monthDays = useMemo(() => {
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    const calStart = startOfWeek(ms, { weekStartsOn: 1 });
    const calEnd = endOfWeek(me, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    const we = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: ws, end: we });
  }, [currentDate]);

  // Click day to select; click again to open create dialog
  const handleDayClick = (day: Date) => {
    if (isSameDay(day, selectedDate)) {
      setCreatePrefillDate(format(day, "yyyy-MM-dd'T'10:00"));
      setCreateOpen(true);
    } else {
      setSelectedDate(day);
    }
  };

  // Toggle complete
  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase.from('mc_reminders').update({ completed: !completed }).eq('id', id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !completed } : r))
    );
  };

  // Quick add submit
  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;
    setQuickAddSaving(true);
    const parsed = parseQuickAdd(quickAddText);
    const dt = parsed.datetime || selectedDate;
    await supabase.from('mc_reminders').insert({
      title: parsed.title,
      datetime: format(dt, "yyyy-MM-dd'T'HH:mm:ss"),
      type: parsed.type,
      notes: '',
    });
    setQuickAddText('');
    setQuickAddSaving(false);
    fetchReminders();
  };

  const headerLabel =
    viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy')
      : `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="shrink-0">
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
        </div>

        {/* Quick add bar */}
        <form
          className="flex items-center gap-2 flex-1 max-w-lg"
          onSubmit={(e) => {
            e.preventDefault();
            handleQuickAdd();
          }}
        >
          <div className="relative flex-1">
            <Plus className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              placeholder="Quick add... 'Call Sarah at 3pm' or 'deadline: proposal'"
              className="pl-8 h-9 text-sm"
              disabled={quickAddSaving}
            />
          </div>
          <Button type="submit" size="sm" disabled={quickAddSaving || !quickAddText.trim()} className="h-9">
            Add
          </Button>
        </form>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 shrink-0"
          onClick={() => {
            setCreatePrefillDate(format(selectedDate, "yyyy-MM-dd'T'HH:mm"));
            setCreateOpen(true);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </Button>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between glass-card rounded-xl px-4 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              viewMode === 'month' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              viewMode === 'week' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Week
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={navigateBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button onClick={goToToday} className="text-sm font-semibold min-w-[160px] text-center hover:text-primary transition-colors">
            {headerLabel}
          </button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={navigateForward}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 hidden lg:flex"
          onClick={() => setSidePanelOpen(!sidePanelOpen)}
        >
          {sidePanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
      ) : (
        <div className={cn(
          'grid gap-4 transition-all',
          sidePanelOpen ? 'grid-cols-1 lg:grid-cols-[1fr_300px]' : 'grid-cols-1'
        )}>
          {/* Main calendar area */}
          <div className="glass-card rounded-xl p-4 min-w-0">
            {viewMode === 'month' ? (
              <MonthGrid
                days={monthDays}
                currentDate={currentDate}
                selectedDate={selectedDate}
                getRemindersForDay={getRemindersForDay}
                onDayClick={handleDayClick}
              />
            ) : (
              <WeekGrid
                days={weekDays}
                selectedDate={selectedDate}
                getRemindersForDay={getRemindersForDay}
                onDayClick={handleDayClick}
                onClickReminder={(r) => {
                  setSelectedReminder(r);
                  setDetailOpen(true);
                }}
              />
            )}
          </div>

          {/* Side panel */}
          {sidePanelOpen && (
            <div className="space-y-4">
              {/* Selected day */}
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-primary" />
                  {format(selectedDate, 'EEEE, MMM d')}
                  {isToday(selectedDate) && (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Today</Badge>
                  )}
                </h3>
                {selectedDayReminders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nothing scheduled.{' '}
                    <button
                      className="text-primary hover:underline"
                      onClick={() => {
                        setCreatePrefillDate(format(selectedDate, "yyyy-MM-dd'T'10:00"));
                        setCreateOpen(true);
                      }}
                    >
                      Add something?
                    </button>
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayReminders.map((r) => (
                      <ReminderItem
                        key={r.id}
                        reminder={r}
                        onClick={() => {
                          setSelectedReminder(r);
                          setDetailOpen(true);
                        }}
                        onToggleComplete={() => toggleComplete(r.id, r.completed)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Overdue */}
              {overdueReminders.length > 0 && (
                <div className="glass-card rounded-xl p-4 border-red-500/20">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Overdue ({overdueReminders.length})
                  </h3>
                  <div className="space-y-1.5">
                    {overdueReminders.slice(0, 5).map((r) => (
                      <ReminderItem
                        key={r.id}
                        reminder={r}
                        showDate
                        onClick={() => {
                          setSelectedReminder(r);
                          setDetailOpen(true);
                        }}
                        onToggleComplete={() => toggleComplete(r.id, r.completed)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  Upcoming
                </h3>
                {upcomingReminders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">All clear!</p>
                ) : (
                  <div className="space-y-1.5">
                    {upcomingReminders.map((r) => (
                      <ReminderItem
                        key={r.id}
                        reminder={r}
                        showDate
                        onClick={() => {
                          setSelectedReminder(r);
                          setDetailOpen(true);
                        }}
                        onToggleComplete={() => toggleComplete(r.id, r.completed)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateReminderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchReminders}
        prefillDate={createPrefillDate}
      />

      <ReminderDetailDialog
        reminder={selectedReminder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={fetchReminders}
      />
    </div>
  );
}

// ─── Month Grid ───────────────────────────────────────────────────────────────

function MonthGrid({
  days,
  currentDate,
  selectedDate,
  getRemindersForDay,
  onDayClick,
}: {
  days: Date[];
  currentDate: Date;
  selectedDate: Date;
  getRemindersForDay: (day: Date) => Reminder[];
  onDayClick: (day: Date) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-7 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-[11px] text-muted-foreground font-medium py-1.5 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
        {days.map((day) => {
          const dayReminders = getRemindersForDay(day);
          const isSelected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const inMonth = isSameMonth(day, currentDate);
          const hasOverdue = dayReminders.some(
            (r) => !r.completed && isPast(parseISO(r.datetime)) && !isToday(parseISO(r.datetime))
          );

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                'relative flex flex-col items-start p-1.5 sm:p-2 text-xs transition-all min-h-[72px] sm:min-h-[88px] bg-background/50',
                !inMonth && 'opacity-30',
                isSelected && 'bg-primary/5 ring-1 ring-primary/30 z-10',
                today && !isSelected && 'bg-accent/60',
                'hover:bg-accent/40'
              )}
            >
              <span
                className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-medium mb-0.5',
                  today && 'bg-primary text-primary-foreground font-bold',
                  isSelected && !today && 'text-primary'
                )}
              >
                {format(day, 'd')}
              </span>

              {dayReminders.length > 0 && (
                <div className="flex flex-col gap-0.5 w-full mt-auto">
                  {dayReminders.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        'w-full h-[3px] rounded-full',
                        typeColors[r.type].bar,
                        r.completed && 'opacity-30'
                      )}
                      title={r.title}
                    />
                  ))}
                  {dayReminders.length > 3 && (
                    <span className="text-[9px] text-muted-foreground">+{dayReminders.length - 3}</span>
                  )}
                </div>
              )}

              {hasOverdue && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Week Grid ────────────────────────────────────────────────────────────────

function WeekGrid({
  days,
  selectedDate,
  getRemindersForDay,
  onDayClick,
  onClickReminder,
}: {
  days: Date[];
  selectedDate: Date;
  getRemindersForDay: (day: Date) => Reminder[];
  onDayClick: (day: Date) => void;
  onClickReminder: (r: Reminder) => void;
}) {
  return (
    <div className="overflow-x-auto">
      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border/30 pb-2 mb-0">
        <div />
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onDayClick(day)}
            className={cn(
              'text-center py-1 transition-colors',
              isSameDay(day, selectedDate) && 'text-primary',
              'hover:text-primary'
            )}
          >
            <div className="text-[10px] uppercase text-muted-foreground">{format(day, 'EEE')}</div>
            <div
              className={cn(
                'w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-medium',
                isToday(day) && 'bg-primary text-primary-foreground',
                isSameDay(day, selectedDate) && !isToday(day) && 'ring-1 ring-primary/40'
              )}
            >
              {format(day, 'd')}
            </div>
          </button>
        ))}
      </div>

      {/* Time grid */}
      <div className="relative overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          {HOURS.map((hour) => (
            <div key={`row-${hour}`} className="contents">
              {/* Hour label */}
              <div className="text-[10px] text-muted-foreground text-right pr-2 h-12 flex items-start justify-end pt-0">
                {hour === 0 ? '' : format(setHours(new Date(), hour), 'ha').toLowerCase()}
              </div>
              {/* Day columns */}
              {days.map((day, dayIndex) => (
                <div
                  key={`cell-${hour}-${dayIndex}`}
                  className={cn(
                    'h-12 border-t border-border/15 relative',
                    isToday(day) && 'bg-primary/[0.02]'
                  )}
                  onClick={() => onDayClick(day)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Positioned events */}
        <div className="absolute inset-0 grid grid-cols-[56px_repeat(7,1fr)] pointer-events-none">
          <div />
          {days.map((day) => {
            const dayReminders = getRemindersForDay(day);
            return (
              <div key={day.toISOString()} className="relative">
                {dayReminders.map((r) => {
                  const dt = parseISO(r.datetime);
                  const h = dt.getHours();
                  const m = dt.getMinutes();
                  const topPx = h * 48 + (m / 60) * 48;

                  return (
                    <button
                      key={r.id}
                      className={cn(
                        'absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] leading-tight text-left truncate border-l-2 pointer-events-auto z-[5]',
                        typeColors[r.type].border,
                        r.completed ? 'opacity-40 bg-muted/30' : 'bg-muted/60 hover:bg-muted'
                      )}
                      style={{ top: `${topPx}px`, minHeight: '20px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClickReminder(r);
                      }}
                      title={r.title}
                    >
                      <span className={cn(r.completed && 'line-through')}>{r.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Reminder Item (Side Panel) ───────────────────────────────────────────────

function ReminderItem({
  reminder,
  showDate,
  onClick,
  onToggleComplete,
}: {
  reminder: Reminder;
  showDate?: boolean;
  onClick: () => void;
  onToggleComplete: () => void;
}) {
  const Icon = typeIcons[reminder.type] || Clock;
  const isOverdue = !reminder.completed && isPast(parseISO(reminder.datetime)) && !isToday(parseISO(reminder.datetime));

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group',
        reminder.completed && 'opacity-40',
        isOverdue && 'border border-red-500/20'
      )}
      onClick={onClick}
    >
      <button
        className={cn(
          'w-4 h-4 shrink-0 rounded-full border flex items-center justify-center transition-colors',
          reminder.completed ? 'bg-primary/20 border-primary text-primary' : 'border-muted-foreground/30 hover:border-primary/50'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
      >
        {reminder.completed && <Check className="w-2.5 h-2.5" />}
      </button>

      <Icon className={cn('w-3 h-3 shrink-0', typeColors[reminder.type].text)} />

      <div className="flex-1 min-w-0">
        <p className={cn('text-xs truncate', reminder.completed && 'line-through')}>
          {reminder.title}
        </p>
        <p className={cn('text-[10px]', isOverdue ? 'text-red-400' : 'text-muted-foreground')}>
          {showDate
            ? format(parseISO(reminder.datetime), 'MMM d, h:mm a')
            : format(parseISO(reminder.datetime), 'h:mm a')}
        </p>
      </div>

      {isOverdue && (
        <span className="text-[9px] text-red-400 font-medium shrink-0">Overdue</span>
      )}
    </div>
  );
}
