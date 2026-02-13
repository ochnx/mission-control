'use client';

import { useState, useEffect } from 'react';
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
import type { Project } from '@/types';

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

export function ProjectDetailDialog({ project, open, onOpenChange, onUpdated }: ProjectDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Project['status']>('idea');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setStatus(project.status);
      setDescription(project.description || '');
      setNotes(project.notes || '');
      setEditing(false);
    }
  }, [project]);

  if (!project) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Project' : project.name}</DialogTitle>
          <DialogDescription>
            {!editing && (
              <span className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`capitalize ${statusColor[project.status]}`}>{project.status}</Badge>
                {project.tasks_count !== undefined && (
                  <span className="text-xs text-muted-foreground">{project.tasks_count} task{project.tasks_count !== 1 ? 's' : ''}</span>
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
  );
}
