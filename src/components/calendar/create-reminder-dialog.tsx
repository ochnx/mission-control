'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { supabase } from '@/lib/supabase';

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  prefillDate?: string;
}

export function CreateReminderDialog({ open, onOpenChange, onCreated, prefillDate }: CreateReminderDialogProps) {
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState('');
  const [type, setType] = useState('reminder');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill date when dialog opens with a prefillDate
  useEffect(() => {
    if (open && prefillDate) {
      setDatetime(prefillDate);
    }
  }, [open, prefillDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !datetime) return;

    setSaving(true);
    await supabase.from('mc_reminders').insert({
      title: title.trim(),
      datetime,
      type,
      notes: notes.trim(),
    });

    setTitle('');
    setDatetime('');
    setType('reminder');
    setNotes('');
    setSaving(false);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rtitle">Title</Label>
            <Input
              id="rtitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reminder title"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rdatetime">Date & Time</Label>
              <Input
                id="rdatetime"
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="rnotes">Notes</Label>
            <Textarea
              id="rnotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim() || !datetime}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
