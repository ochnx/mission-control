'use client';

import { useState } from 'react';
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

interface CreateMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateMemoryDialog({ open, onOpenChange, onCreated }: CreateMemoryDialogProps) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Learnings');
  const [tagsInput, setTagsInput] = useState('');
  const [sourceFile, setSourceFile] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await supabase.from('mc_memories').insert({
      content: content.trim(),
      category,
      tags,
      source_file: sourceFile.trim(),
    });

    setContent('');
    setCategory('Learnings');
    setTagsInput('');
    setSourceFile('');
    setSaving(false);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Memory</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's worth remembering?"
              rows={4}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Decisions">Decisions</SelectItem>
                <SelectItem value="Learnings">Learnings</SelectItem>
                <SelectItem value="Rules">Rules</SelectItem>
                <SelectItem value="People">People</SelectItem>
                <SelectItem value="Projects">Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. supabase, workflow, design"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source File</Label>
            <Input
              id="source"
              value={sourceFile}
              onChange={(e) => setSourceFile(e.target.value)}
              placeholder="e.g. AGENTS.md"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !content.trim()}>
              {saving ? 'Saving...' : 'Save Memory'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
