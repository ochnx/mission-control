'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle2,
  Clock,
  Mail,
  Search,
  RefreshCw,
  Zap,
  Loader2,
  Filter,
  Target,
  Bell,
  Wrench,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { TZDate } from '@date-fns/tz';

const TIMEZONE = 'Europe/Berlin';

function toBerlinDate(dateStr: string): Date {
  return new TZDate(dateStr, TIMEZONE);
}

function relativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

interface TimelineEntry {
  id: string;
  type: 'activity' | 'task' | 'reminder';
  icon: React.ReactNode;
  summary: string;
  detail?: string;
  timestamp: string;
  status?: string;
}

const FILTER_TYPES = ['all', 'activity', 'task', 'reminder'] as const;

const activityIcons: Record<string, React.ReactNode> = {
  cron_run: <RefreshCw className="w-4 h-4" />,
  task_complete: <CheckCircle2 className="w-4 h-4" />,
  mail_check: <Mail className="w-4 h-4" />,
  suggestion: <Zap className="w-4 h-4" />,
  research: <Search className="w-4 h-4" />,
  build: <Wrench className="w-4 h-4" />,
  sync: <RefreshCw className="w-4 h-4" />,
};

const typeColors: Record<string, { bg: string; text: string }> = {
  activity: { bg: 'bg-blue-400/10', text: 'text-blue-400' },
  task: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  reminder: { bg: 'bg-purple-400/10', text: 'text-purple-400' },
};

export default function TimelinePage() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchTimeline = useCallback(async () => {
    const results: TimelineEntry[] = [];

    // Fetch agent activities
    if (filter === 'all' || filter === 'activity') {
      const { data: activities } = await supabase
        .from('mc_agent_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      (activities || []).forEach((a) => {
        results.push({
          id: `activity-${a.id}`,
          type: 'activity',
          icon: activityIcons[a.action_type] || <Activity className="w-4 h-4" />,
          summary: a.summary || a.action_type,
          detail: a.cron_job_name || undefined,
          timestamp: a.created_at,
          status: a.status,
        });
      });
    }

    // Fetch recent task changes (done tasks as status changes)
    if (filter === 'all' || filter === 'task') {
      const { data: tasks } = await supabase
        .from('mc_tasks')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      (tasks || []).forEach((t) => {
        results.push({
          id: `task-${t.id}`,
          type: 'task',
          icon: <Target className="w-4 h-4" />,
          summary: `${t.status === 'done' ? 'Completed' : t.status === 'in_progress' ? 'Started' : 'Created'}: ${t.title}`,
          detail: t.assignee,
          timestamp: t.updated_at || t.created_at,
          status: t.status,
        });
      });
    }

    // Fetch reminders
    if (filter === 'all' || filter === 'reminder') {
      const { data: reminders } = await supabase
        .from('mc_reminders')
        .select('*')
        .order('datetime', { ascending: false })
        .limit(50);

      (reminders || []).forEach((r) => {
        results.push({
          id: `reminder-${r.id}`,
          type: 'reminder',
          icon: <Bell className="w-4 h-4" />,
          summary: `${r.completed ? 'Done' : r.type === 'event' ? 'Event' : 'Reminder'}: ${r.title}`,
          detail: r.type,
          timestamp: r.datetime,
          status: r.completed ? 'completed' : 'pending',
        });
      });
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setEntries(results);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Group by day
  const grouped = entries.reduce<Record<string, TimelineEntry[]>>((acc, entry) => {
    const dateKey = format(toBerlinDate(entry.timestamp), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Timeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Chronological view of all activity
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {FILTER_TYPES.map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              setFilter(type);
              setLoading(true);
            }}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading timeline...
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No timeline entries found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, dayEntries]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {format(new Date(dateKey), 'EEEE, MMM d')}
                </h3>
                <div className="flex-1 border-t border-border" />
                <Badge variant="outline" className="text-[10px]">{dayEntries.length}</Badge>
              </div>

              <div className="space-y-2">
                {dayEntries.map((entry) => {
                  const colors = typeColors[entry.type] || typeColors.activity;
                  return (
                    <Card key={entry.id} className="border-border bg-card">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1.5 rounded-md ${colors.bg} ${colors.text}`}>
                            {entry.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{entry.summary}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(toBerlinDate(entry.timestamp), 'HH:mm')}
                                <span className="text-muted-foreground/50 ml-1">
                                  ({relativeTime(entry.timestamp)})
                                </span>
                              </span>
                              {entry.detail && (
                                <Badge variant="outline" className="text-[10px]">
                                  {entry.detail}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${colors.text}`}
                            >
                              {entry.type}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
