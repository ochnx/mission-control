'use client';

import { format } from 'date-fns';
import { FolderOpen, ListTodo, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onUpdated: () => void;
}

const statusColors: Record<string, string> = {
  idea: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  planned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  done: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function ProjectCard({ project, onUpdated }: ProjectCardProps) {
  const handleDelete = async () => {
    await supabase.from('mc_projects').delete().eq('id', project.id);
    onUpdated();
  };

  return (
    <div className="glass-card rounded-lg p-4 group hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{project.name}</p>
            <Badge
              variant="outline"
              className={cn('text-[10px] mt-0.5 capitalize', statusColors[project.status])}
            >
              {project.status}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{project.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ListTodo className="w-3 h-3" />
          <span>{project.tasks_count || 0} tasks</span>
        </div>
        <span>
          Updated {format(new Date(project.updated_at), 'MMM d')}
        </span>
      </div>
    </div>
  );
}
