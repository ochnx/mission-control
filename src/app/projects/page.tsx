'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';
import { ProjectCard } from '@/components/projects/project-card';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectDetailDialog } from '@/components/projects/project-detail-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const statuses = ['all', 'active', 'planned', 'idea', 'paused', 'done'] as const;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    let query = supabase.from('mc_projects').select('*').order('updated_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: projectsData } = await query;

    if (projectsData) {
      // Fetch task counts for each project
      const projectIds = projectsData.map((p) => p.id);
      const { data: tasks } = await supabase
        .from('mc_tasks')
        .select('project_id')
        .in('project_id', projectIds);

      const taskCounts: Record<string, number> = {};
      tasks?.forEach((t) => {
        if (t.project_id) {
          taskCounts[t.project_id] = (taskCounts[t.project_id] || 0) + 1;
        }
      });

      setProjects(
        projectsData.map((p) => ({
          ...p,
          tasks_count: taskCounts[p.id] || 0,
        }))
      );
    }

    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'planned');
  const backlog = projects.filter((p) => p.status === 'idea');
  const other = projects.filter((p) => p.status === 'paused' || p.status === 'done');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track all your projects, from ideas to completion
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {statuses.map((s) => (
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
          Loading projects...
        </div>
      ) : (
        <div className="space-y-8">
          {activeProjects.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Active & Planned
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onUpdated={fetchProjects} onClick={() => { setSelectedProject(project); setDetailOpen(true); }} />
                ))}
              </div>
            </div>
          )}

          {backlog.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Backlog / Ideas
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {backlog.map((project) => (
                  <ProjectCard key={project.id} project={project} onUpdated={fetchProjects} onClick={() => { setSelectedProject(project); setDetailOpen(true); }} />
                ))}
              </div>
            </div>
          )}

          {other.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Paused & Done
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {other.map((project) => (
                  <ProjectCard key={project.id} project={project} onUpdated={fetchProjects} onClick={() => { setSelectedProject(project); setDetailOpen(true); }} />
                ))}
              </div>
            </div>
          )}

          {projects.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-sm">No projects found</p>
            </div>
          )}
        </div>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchProjects}
      />

      <ProjectDetailDialog
        project={selectedProject}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={fetchProjects}
      />
    </div>
  );
}
