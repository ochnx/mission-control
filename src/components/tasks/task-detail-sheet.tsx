'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
import type { Task } from '@/types';

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function TaskDetailSheet({ task, open, onOpenChange, onUpdated }: TaskDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [assignee, setAssignee] = useState<Task['assignee']>('Oskar');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setAssignee(task.assignee);
      setPriority(task.priority);
      setDueDate(task.due_date || '');
      setEditing(false);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('mc_tasks')
      .update({
        title: title.trim(),
        description: description.trim(),
        status,
        assignee,
        priority,
        due_date: dueDate || null,
      })
      .eq('id', task.id);
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    await supabase.from('mc_tasks').delete().eq('id', task.id);
    onOpenChange(false);
    onUpdated();
  };

  const priorityColor = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-zinc-400',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? 'Edit Task' : task.title}</SheetTitle>
          <SheetDescription>
            {!editing && (
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{task.status.replace('_', ' ')}</Badge>
                <Badge variant="outline" className={priorityColor[task.priority]}>{task.priority}</Badge>
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {editing ? (
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Task['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assignee} onValueChange={(v) => setAssignee(v as Task['assignee'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oskar">Oskar</SelectItem>
                    <SelectItem value="Agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-due">Due Date</Label>
                <Input
                  id="edit-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            {task.description && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Description</Label>
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Assignee</Label>
                <p className="text-sm">{task.assignee}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Priority</Label>
                <p className={`text-sm capitalize ${priorityColor[task.priority]}`}>{task.priority}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Due Date</Label>
                <p className="text-sm">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Created</Label>
                <p className="text-sm">{new Date(task.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        <SheetFooter>
          {editing ? (
            <div className="flex w-full gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1">
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ) : (
            <div className="flex w-full gap-2">
              <Button variant="destructive" onClick={handleDelete} className="flex-1">
                Delete
              </Button>
              <Button onClick={() => setEditing(true)} className="flex-1">
                Edit
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
