'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task, Reminder, AgentActivity, Person } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Target,
  Users,
  XCircle,
  Loader2,
  Zap,
  Mail,
  Search,
  Wrench,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { formatDistanceToNow, isToday, isBefore, startOfDay, format } from 'date-fns';
import { TZDate } from '@date-fns/tz';

const TIMEZONE = 'Europe/Berlin';

function toBerlinDate(dateStr: string): Date {
  return new TZDate(dateStr, TIMEZONE);
}

function relativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

function isTodayBerlin(dateStr: string): boolean {
  return isToday(toBerlinDate(dateStr));
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return isBefore(toBerlinDate(dateStr), startOfDay(toBerlinDate(new Date().toISOString())));
}

const actionIcons: Record<string, React.ReactNode> = {
  cron_run: <RefreshCw className="w-3.5 h-3.5" />,
  task_complete: <CheckCircle2 className="w-3.5 h-3.5" />,
  mail_check: <Mail className="w-3.5 h-3.5" />,
  suggestion: <Zap className="w-3.5 h-3.5" />,
  research: <Search className="w-3.5 h-3.5" />,
  build: <Wrench className="w-3.5 h-3.5" />,
  sync: <RefreshCw className="w-3.5 h-3.5" />,
};

const statusColors: Record<string, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  running: 'text-yellow-400',
};

export default function NerveCenterPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [peopleCount, setPeopleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [tasksRes, remindersRes, activityRes, peopleRes] = await Promise.all([
      supabase.from('mc_tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('mc_reminders').select('*').order('datetime', { ascending: true }),
      supabase.from('mc_agent_activity').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('mc_people').select('id', { count: 'exact', head: true }),
    ]);

    setTasks(tasksRes.data || []);
    setReminders(remindersRes.data || []);
    setActivities(activityRes.data || []);
    setPeopleCount(peopleRes.count || 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Derived data
  const tasksDueToday = tasks.filter((t) => t.due_date && isTodayBerlin(t.due_date) && t.status !== 'done');
  const overdueTasks = tasks.filter((t) => t.status !== 'done' && isOverdue(t.due_date));
  const todayReminders = reminders.filter((r) => !r.completed && isTodayBerlin(r.datetime));
  const todayEvents = reminders.filter((r) => r.type === 'event' && isTodayBerlin(r.datetime));

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  // Agent status — based on last activity timestamp
  const lastActivity = activities[0];
  const agentOnline = lastActivity
    ? (Date.now() - new Date(lastActivity.created_at).getTime()) < 30 * 60 * 1000 // 30 min
    : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading Command Center...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Status Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of everything that matters today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className={`w-2 h-2 rounded-full ${agentOnline ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs font-medium">
              {agentOnline ? 'Active' : 'Offline'}
            </span>
          </div>
          {lastActivity && (
            <span className="text-xs text-muted-foreground">
              Last action: {relativeTime(lastActivity.created_at)}
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* TODAY */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tasks due</span>
              <Badge variant="secondary" className="text-xs">{tasksDueToday.length}</Badge>
            </div>
            {tasksDueToday.length > 0 && (
              <div className="space-y-1.5">
                {tasksDueToday.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <Target className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{t.title}</span>
                    <Badge variant={t.priority === 'high' ? 'destructive' : 'outline'} className="text-[10px] ml-auto shrink-0">
                      {t.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Events</span>
                <Badge variant="secondary" className="text-xs">{todayEvents.length}</Badge>
              </div>
              {todayEvents.length > 0 && (
                <div className="space-y-1.5 mt-1.5">
                  {todayEvents.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{r.title}</span>
                      <span className="text-muted-foreground ml-auto text-[10px] shrink-0">
                        {format(toBerlinDate(r.datetime), 'HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Reminders</span>
                <Badge variant="secondary" className="text-xs">{todayReminders.length}</Badge>
              </div>
              {todayReminders.length > 0 && (
                <div className="space-y-1.5 mt-1.5">
                  {todayReminders.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{r.title}</span>
                      <span className="text-muted-foreground ml-auto text-[10px] shrink-0">
                        {format(toBerlinDate(r.datetime), 'HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ATTENTION */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Overdue tasks</span>
              <Badge variant={overdueTasks.length > 0 ? 'destructive' : 'secondary'} className="text-xs">
                {overdueTasks.length}
              </Badge>
            </div>
            {overdueTasks.length > 0 && (
              <div className="space-y-1.5">
                {overdueTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="truncate text-red-300">{t.title}</span>
                    <span className="text-red-400/70 ml-auto text-[10px] shrink-0">
                      {t.due_date && format(toBerlinDate(t.due_date), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {overdueTasks.length === 0 && (
              <div className="text-xs text-muted-foreground py-2">
                No overdue tasks. All clear.
              </div>
            )}

            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">In progress</span>
                <Badge variant="secondary" className="text-xs">{tasksByStatus.in_progress}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTIVITY FEED */}
        <Card className="border-border bg-card md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No activity recorded yet.
                <br />
                <span className="text-[10px]">Run the migration to create mc_agent_activity table.</span>
              </div>
            ) : (
              <ScrollArea className="h-[280px] pr-2">
                <div className="space-y-2">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5 py-1.5">
                      <div className={`mt-0.5 ${statusColors[a.status] || 'text-muted-foreground'}`}>
                        {actionIcons[a.action_type] || <Activity className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug truncate">{a.summary}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {relativeTime(a.created_at)}
                          </span>
                          {a.duration_ms && (
                            <span className="text-[10px] text-muted-foreground">
                              {a.duration_ms < 1000 ? `${a.duration_ms}ms` : `${(a.duration_ms / 1000).toFixed(1)}s`}
                            </span>
                          )}
                          <Badge
                            variant={a.status === 'error' ? 'destructive' : 'outline'}
                            className="text-[9px] px-1 py-0"
                          >
                            {a.action_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To Do</p>
                <p className="text-2xl font-bold">{tasksByStatus.todo}</p>
              </div>
              <ListTodo className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{tasksByStatus.in_progress}</p>
              </div>
              <Loader2 className="w-5 h-5 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Done</p>
                <p className="text-2xl font-bold">{tasksByStatus.done}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">People</p>
                <p className="text-2xl font-bold">{peopleCount}</p>
              </div>
              <Users className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
