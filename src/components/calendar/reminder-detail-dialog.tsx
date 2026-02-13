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
import type { Reminder } from '@/types';

interface ReminderDetailDialogProps {
  reminder: Reminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function ReminderDetailDialog({ reminder, open, onOpenChange, onUpdated }: ReminderDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState('');
  const [type, setType] = useState<Reminder['type']>('reminder');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title || '');
      setDatetime(reminder.datetime ? reminder.datetime.slice(0, 16) : '');
      setType(reminder.type);
      setNotes(reminder.notes || '');
      setCompleted(reminder.completed);
      setEditing(false);
    }
  }, [reminder]);

  if (!reminder) return null;

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('mc_reminders')
      .update({
        title: title.trim(),
        datetime: datetime || null,
        type,
        notes: notes.trim(),
        completed,
      })
      .eq('id', reminder.id);
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    await supabase.from('mc_reminders').delete().eq('id', reminder.id);
    onOpenChange(false);
    onUpdated();
  };

  const toggleComplete = async () => {
    const newVal = !completed;
    setCompleted(newVal);
    await supabase.from('mc_reminders').update({ completed: newVal }).eq('id', reminder.id);
    onUpdated();
  };

  const typeColor = {
    reminder: 'text-blue-400',
    deadline: 'text-red-400',
    event: 'text-emerald-400',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Reminder' : reminder.title}</DialogTitle>
          <DialogDescription>
            {!editing && (
              <span className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`capitalize ${typeColor[reminder.type]}`}>{reminder.type}</Badge>
                {reminder.completed && <Badge variant="secondary">Completed</Badge>}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-datetime">Date & Time</Label>
              <Input
                id="edit-datetime"
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Reminder['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Date & Time</Label>
              <p className="text-sm">
                {reminder.datetime
                  ? new Date(reminder.datetime).toLocaleString()
                  : 'No date set'}
              </p>
            </div>
            {reminder.notes && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Notes</Label>
                <p className="text-sm whitespace-pre-wrap">{reminder.notes}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Created</Label>
              <p className="text-sm text-muted-foreground">{new Date(reminder.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !title.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              <Button variant="outline" onClick={toggleComplete}>
                {completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
              <Button onClick={() => setEditing(true)}>Edit</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
