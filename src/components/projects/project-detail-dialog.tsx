'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Project, Task } from '@/types';
import { Target, Plus } from 'lucide-react';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { useRouter } from 'next/navigation';

interface ProjectDetailDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const statusColor: Record<Project['status'], string> = {
  active: 'text-emerald-400',
  planned: 'text-blue-400',
  idea: 'text-yellow-400',
  paused: 'text-zinc-400',
  done: 'text-purple-400',
};

const taskStatusColor: Record<Task['status'], string> = {
  todo: 'text-zinc-400',
  in_progress: 'text-blue-400',
  done: 'text-emerald-400',
};

export function ProjectDetailDialog({ project, open, onOpenChange, onUpdated }: ProjectDetailDialogProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Project['status']>('idea');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  const fetchLinkedTasks = useCallback(async (projectId: string) => {
    const { data } = await supabase
      .from('mc_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setLinkedTasks((data as Task[]) || []);
  }, []);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setStatus(project.status);
      setDescription(project.description || '');
      setNotes(project.notes || '');
      setEditing(false);
      fetchLinkedTasks(project.id);
    }
  }, [project, fetchLinkedTasks]);

  if (!project) return null;

  const doneCount = linkedTasks.filter((t) => t.status === 'done').length;
  const todoCount = linkedTasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = linkedTasks.filter((t) => t.status === 'in_progress').length;

  const taskSummaryParts: string[] = [];
  if (doneCount > 0) taskSummaryParts.push(`${doneCount} done`);
  if (inProgressCount > 0) taskSummaryParts.push(`${inProgressCount} in progress`);
  if (todoCount > 0) taskSummaryParts.push(`${todoCount} todo`);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('mc_projects')
      .update({
        name: name.trim(),
        status,
        description: description.trim(),
        notes: notes.trim(),
      })
      .eq('id', project.id);
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    await supabase.from('mc_projects').delete().eq('id', project.id);
    onOpenChange(false);
    onUpdated();
  };

  const handleTaskClick = (taskId: string) => {
    onOpenChange(false);
    router.push(`/tasks?task=${taskId}`);
  };

  const handleTaskCreated = () => {
    fetchLinkedTasks(project.id);
    onUpdated();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Project' : project.name}</DialogTitle>
            <DialogDescription>
              {!editing && (
                <span className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`capitalize ${statusColor[project.status]}`}>{project.status}</Badge>
                  {linkedTasks.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {linkedTasks.length} task{linkedTasks.length !== 1 ? 's' : ''}
                      {taskSummaryParts.length > 0 && ` (${taskSummaryParts.join(', ')})`}
                    </span>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Project['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {project.description && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="text-sm whitespace-pre-wrap">{project.description}</p>
                </div>
              )}
              {project.notes && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Notes</Label>
                  <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Created</Label>
                  <p className="text-sm text-muted-foreground">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">{new Date(project.updated_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Linked Tasks Section */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-muted-foreground" />
                    <Label className="text-muted-foreground text-xs">Tasks</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setCreateTaskOpen(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Task
                  </Button>
                </div>
                {linkedTasks.length > 0 ? (
                  <div className="space-y-1">
                    {linkedTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleTaskClick(task.id)}
                        className="flex items-center justify-between w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <span className="truncate mr-2">{task.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${taskStatusColor[task.status]}`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{task.assignee}</span>
                          {task.due_date && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No tasks linked to this project</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                <Button onClick={() => setEditing(true)}>Edit</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onCreated={handleTaskCreated}
        defaultProjectId={project.id}
      />
    </>
  );
}
