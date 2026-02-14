'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task, Reminder, AgentActivity, Person, Suggestion, AgentCommand } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Check,
  Clock,
  ListTodo,
  Target,
  Users,
  XCircle,
  X,
  Loader2,
  Zap,
  Mail,
  Search,
  Wrench,
  RefreshCw,
  Bot,
  UserCheck,
  Briefcase,
  CalendarClock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Terminal,
  Send,
  FileText,
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

const suggestionIcons: Record<string, React.ReactNode> = {
  overdue_task: <AlertTriangle className="w-4 h-4" />,
  follow_up: <UserCheck className="w-4 h-4" />,
  deal_action: <Briefcase className="w-4 h-4" />,
  calendar_gap: <CalendarClock className="w-4 h-4" />,
  insight: <Lightbulb className="w-4 h-4" />,
};

const priorityStyles: Record<string, { border: string; icon: string; badge: string }> = {
  high: { border: 'border-red-500/30', icon: 'text-red-400', badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
  medium: { border: 'border-yellow-500/30', icon: 'text-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  low: { border: 'border-blue-500/30', icon: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
};

const commandIcons: Record<string, React.ReactNode> = {
  research: <Search className="w-3.5 h-3.5" />,
  draft_email: <Mail className="w-3.5 h-3.5" />,
  generate_report: <FileText className="w-3.5 h-3.5" />,
  custom: <Terminal className="w-3.5 h-3.5" />,
};

const commandStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function NerveCenterPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [commands, setCommands] = useState<AgentCommand[]>([]);
  const [peopleCount, setPeopleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quickCommand, setQuickCommand] = useState('');
  const [sendingCommand, setSendingCommand] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchAll = useCallback(async () => {
    const [tasksRes, remindersRes, activityRes, peopleRes, suggestionsRes, commandsRes] = await Promise.all([
      supabase.from('mc_tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('mc_reminders').select('*').order('datetime', { ascending: true }),
      supabase.from('mc_agent_activity').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('mc_people').select('id', { count: 'exact', head: true }),
      supabase.from('mc_suggestions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('mc_agent_commands').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    setTasks(tasksRes.data || []);
    setReminders(remindersRes.data || []);
    setActivities(activityRes.data || []);
    setPeopleCount(peopleRes.count || 0);
    setSuggestions(suggestionsRes.data || []);
    setCommands(commandsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSuggestionAction = async (id: string, newStatus: 'accepted' | 'dismissed') => {
    await supabase.from('mc_suggestions').update({ status: newStatus }).eq('id', id);
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const sendQuickCommand = async () => {
    if (!quickCommand.trim()) return;
    setSendingCommand(true);
    await supabase.from('mc_agent_commands').insert({
      command_type: 'custom',
      parameters: { text: quickCommand.trim() },
    });
    setQuickCommand('');
    setSendingCommand(false);
    fetchAll();
  };

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

  // Suggestions sorted by priority (high > medium > low) then newest first
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sortedSuggestions = [...suggestions]
    .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Agent status — based on last activity timestamp
  const lastActivity = activities[0];
  const agentOnline = lastActivity
    ? (Date.now() - new Date(lastActivity.created_at).getTime()) < 30 * 60 * 1000 // 30 min
    : false;

  const pendingCommands = commands.filter((c) => c.status === 'pending' || c.status === 'processing');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading Command Center...
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Agent Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Command Center</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
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
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Last action: {relativeTime(lastActivity.created_at)}
            </span>
          )}
        </div>
      </div>

      {/* Quick Command Bar */}
      <Card className="border-border bg-card">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-primary shrink-0" />
            <Input
              value={quickCommand}
              onChange={(e) => setQuickCommand(e.target.value)}
              placeholder="Ask your agent..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendQuickCommand();
                }
              }}
              disabled={sendingCommand}
            />
            <Button
              size="sm"
              onClick={sendQuickCommand}
              disabled={!quickCommand.trim() || sendingCommand}
              className="gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      {sortedSuggestions.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('suggestions')}
            className="flex items-center gap-2 w-full text-left mb-3 min-h-[44px] md:min-h-0"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Smart Suggestions</span>
            <Badge variant="secondary" className="text-xs">{sortedSuggestions.length}</Badge>
            <span className="ml-auto md:hidden text-muted-foreground">
              {collapsedSections.suggestions ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </span>
          </button>
          {!collapsedSections.suggestions && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedSuggestions.map((s) => {
                const style = priorityStyles[s.priority] || priorityStyles.low;
                return (
                  <Card key={s.id} className={`border bg-card ${style.border}`}>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 shrink-0 ${style.icon}`}>
                          {suggestionIcons[s.suggestion_type] || <Zap className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug">{s.title}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${style.badge}`}>
                              {s.priority}
                            </span>
                          </div>
                          {s.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="xs"
                              variant="outline"
                              className="text-green-400 border-green-500/30 hover:bg-green-500/10 min-h-[44px] md:min-h-0 px-3"
                              onClick={() => handleSuggestionAction(s.id, 'accepted')}
                            >
                              <Check className="w-3 h-3" />
                              Accept
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground min-h-[44px] md:min-h-0 px-3"
                              onClick={() => handleSuggestionAction(s.id, 'dismissed')}
                            >
                              <X className="w-3 h-3" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* TODAY */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <button
              onClick={() => toggleSection('today')}
              className="flex items-center gap-2 w-full text-left min-h-[44px] md:min-h-0"
            >
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Today
              </CardTitle>
              <span className="ml-auto md:hidden text-muted-foreground">
                {collapsedSections.today ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </span>
            </button>
          </CardHeader>
          {!collapsedSections.today && (
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tasks due</span>
                <Badge variant="secondary" className="text-xs">{tasksDueToday.length}</Badge>
              </div>
              {tasksDueToday.length > 0 && (
                <div className="space-y-1.5">
                  {tasksDueToday.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-xs min-h-[44px] md:min-h-0">
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
                      <div key={r.id} className="flex items-center gap-2 text-xs min-h-[44px] md:min-h-0">
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
                      <div key={r.id} className="flex items-center gap-2 text-xs min-h-[44px] md:min-h-0">
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
          )}
        </Card>

        {/* ATTENTION */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <button
              onClick={() => toggleSection('attention')}
              className="flex items-center gap-2 w-full text-left min-h-[44px] md:min-h-0"
            >
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Needs Attention
              </CardTitle>
              <span className="ml-auto md:hidden text-muted-foreground">
                {collapsedSections.attention ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </span>
            </button>
          </CardHeader>
          {!collapsedSections.attention && (
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
                    <div key={t.id} className="flex items-center gap-2 text-xs min-h-[44px] md:min-h-0">
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
          )}
        </Card>

        {/* ACTIVITY FEED */}
        <Card className="border-border bg-card md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <button
              onClick={() => toggleSection('activity')}
              className="flex items-center gap-2 w-full text-left min-h-[44px] md:min-h-0"
            >
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Agent Activity
              </CardTitle>
              <span className="ml-auto md:hidden text-muted-foreground">
                {collapsedSections.activity ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </span>
            </button>
          </CardHeader>
          {!collapsedSections.activity && (
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
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
          )}
        </Card>
      </div>

      {/* Pending Commands */}
      {pendingCommands.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-yellow-400" />
              Pending Commands
              <Badge variant="secondary" className="text-xs ml-auto">{pendingCommands.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingCommands.map((cmd) => (
                <div key={cmd.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50">
                  <div className="text-muted-foreground">
                    {commandIcons[cmd.command_type] || <Terminal className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {cmd.command_type === 'custom'
                        ? (cmd.parameters as Record<string, string>)?.text || 'Custom command'
                        : `${cmd.command_type.replace('_', ' ')}${cmd.target_type ? ` → ${cmd.target_type}` : ''}`}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTime(cmd.created_at)}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize ${commandStatusColors[cmd.status]}`}
                  >
                    {cmd.status === 'processing' && <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" />}
                    {cmd.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Completed Commands */}
      {commands.filter((c) => c.status === 'completed').length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {commands
                .filter((c) => c.status === 'completed')
                .slice(0, 3)
                .map((cmd) => (
                  <div key={cmd.id} className="py-2 px-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-green-400">
                        {commandIcons[cmd.command_type] || <Terminal className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-medium capitalize">
                        {cmd.command_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {relativeTime(cmd.completed_at || cmd.created_at)}
                      </span>
                    </div>
                    {cmd.result && (
                      <p className="text-xs text-muted-foreground line-clamp-2 ml-5.5">
                        {cmd.result}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

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
