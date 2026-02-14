'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AgentCommand } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  Search,
  Mail,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

const statusFilters = ['all', 'pending', 'processing', 'completed', 'failed'] as const;

const commandIcons: Record<string, React.ReactNode> = {
  research: <Search className="w-4 h-4" />,
  draft_email: <Mail className="w-4 h-4" />,
  generate_report: <FileText className="w-4 h-4" />,
  custom: <Terminal className="w-4 h-4" />,
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5 text-yellow-400" />,
  processing: <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />,
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  failed: <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

const statusBadgeColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function CommandsPage() {
  const [commands, setCommands] = useState<AgentCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchCommands = useCallback(async () => {
    let query = supabase
      .from('mc_agent_commands')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setCommands(data || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Commands</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Agent command history and status tracking
        </p>
      </div>

      <div className="flex items-center gap-2">
        {statusFilters.map((s) => (
          <Badge
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer transition-colors capitalize',
              statusFilter === s && 'bg-primary text-primary-foreground'
            )}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading commands...
        </div>
      ) : commands.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Terminal className="w-8 h-8 mb-3 opacity-50" />
          <p className="text-sm">No commands found</p>
          <p className="text-xs mt-1">Use the Quick Command bar or action buttons to send commands to your agent.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_1fr] gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <span className="w-5" />
            <span>Type</span>
            <span>Target</span>
            <span>Status</span>
            <span>Created</span>
            <span>Result</span>
          </div>

          {commands.map((cmd) => (
            <Card key={cmd.id} className="border-border bg-card">
              <CardContent className="py-3 px-4">
                {/* Desktop table row */}
                <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_1fr] gap-4 items-center">
                  <div className="text-muted-foreground">
                    {commandIcons[cmd.command_type] || <Terminal className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {cmd.command_type.replace('_', ' ')}
                    </p>
                    {cmd.command_type === 'custom' && (cmd.parameters as Record<string, string>)?.text && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {(cmd.parameters as Record<string, string>).text}
                      </p>
                    )}
                  </div>
                  <div>
                    {cmd.target_type ? (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {cmd.target_type}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                  <div>
                    <Badge variant="outline" className={cn('text-[10px] capitalize gap-1', statusBadgeColors[cmd.status])}>
                      {statusIcons[cmd.status]}
                      {cmd.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(cmd.created_at), 'MMM d, HH:mm')}
                  </div>
                  <div className="min-w-0">
                    {cmd.result ? (
                      <p className="text-xs text-muted-foreground truncate">{cmd.result}</p>
                    ) : cmd.completed_at ? (
                      <span className="text-[10px] text-muted-foreground">
                        Completed {formatDistanceToNow(new Date(cmd.completed_at), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="md:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground">
                        {commandIcons[cmd.command_type] || <Terminal className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {cmd.command_type.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] capitalize gap-1', statusBadgeColors[cmd.status])}>
                      {statusIcons[cmd.status]}
                      {cmd.status}
                    </Badge>
                  </div>
                  {cmd.command_type === 'custom' && (cmd.parameters as Record<string, string>)?.text && (
                    <p className="text-xs text-muted-foreground truncate">
                      {(cmd.parameters as Record<string, string>).text}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {cmd.target_type && (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {cmd.target_type}
                      </Badge>
                    )}
                    <span>{format(new Date(cmd.created_at), 'MMM d, HH:mm')}</span>
                  </div>
                  {cmd.result && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{cmd.result}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
