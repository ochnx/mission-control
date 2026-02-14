'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AgentActivity } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle2,
  Clock,
  Mail,
  Search,
  Wrench,
  RefreshCw,
  Zap,
  Loader2,
  Filter,
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

const ACTION_TYPES = ['all', 'cron_run', 'task_complete', 'mail_check', 'suggestion', 'research', 'build', 'sync'] as const;

const actionIcons: Record<string, React.ReactNode> = {
  cron_run: <RefreshCw className="w-4 h-4" />,
  task_complete: <CheckCircle2 className="w-4 h-4" />,
  mail_check: <Mail className="w-4 h-4" />,
  suggestion: <Zap className="w-4 h-4" />,
  research: <Search className="w-4 h-4" />,
  build: <Wrench className="w-4 h-4" />,
  sync: <RefreshCw className="w-4 h-4" />,
};

const statusColors: Record<string, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  running: 'text-yellow-400',
};

const statusBg: Record<string, string> = {
  success: 'bg-green-400/10',
  error: 'bg-red-400/10',
  running: 'bg-yellow-400/10',
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchActivities = useCallback(async () => {
    let query = supabase
      .from('mc_agent_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      query = query.eq('action_type', filter);
    }

    const { data } = await query;
    setActivities(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Group activities by date
  const grouped = activities.reduce<Record<string, AgentActivity[]>>((acc, activity) => {
    const dateKey = format(toBerlinDate(activity.created_at), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(activity);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity Log</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete history of agent actions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {ACTION_TYPES.map((type) => (
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
            {type === 'all' ? 'All' : type.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading activities...
        </div>
      ) : activities.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === 'all'
                ? 'No activities recorded yet. Run the migration to create the mc_agent_activity table.'
                : `No "${filter.replace('_', ' ')}" activities found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, dayActivities]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {format(new Date(dateKey), 'EEEE, MMM d')}
                </h3>
                <div className="flex-1 border-t border-border" />
                <Badge variant="outline" className="text-[10px]">{dayActivities.length}</Badge>
              </div>

              <div className="space-y-2">
                {dayActivities.map((a) => (
                  <Card key={a.id} className="border-border bg-card">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 p-1.5 rounded-md ${statusBg[a.status] || 'bg-muted'} ${statusColors[a.status] || 'text-muted-foreground'}`}>
                          {actionIcons[a.action_type] || <Activity className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{a.summary}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(toBerlinDate(a.created_at), 'HH:mm')}
                              <span className="text-muted-foreground/50 ml-1">
                                ({relativeTime(a.created_at)})
                              </span>
                            </span>
                            {a.duration_ms != null && (
                              <span className="text-xs text-muted-foreground">
                                {a.duration_ms < 1000 ? `${a.duration_ms}ms` : `${(a.duration_ms / 1000).toFixed(1)}s`}
                              </span>
                            )}
                            {a.cron_job_name && (
                              <Badge variant="outline" className="text-[10px]">
                                {a.cron_job_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            {a.action_type.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant={a.status === 'error' ? 'destructive' : a.status === 'running' ? 'secondary' : 'outline'}
                            className="text-[10px]"
                          >
                            {a.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
