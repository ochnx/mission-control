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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import type { Memory } from '@/types';

interface MemoryDetailDialogProps {
  memory: Memory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const categories: Memory['category'][] = ['Decisions', 'Learnings', 'Rules', 'People', 'Projects'];

export function MemoryDetailDialog({ memory, open, onOpenChange, onUpdated }: MemoryDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Memory['category']>('Learnings');
  const [tags, setTags] = useState('');
  const [sourceFile, setSourceFile] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (memory) {
      setContent(memory.content || '');
      setCategory(memory.category);
      setTags((memory.tags || []).join(', '));
      setSourceFile(memory.source_file || '');
      setEditing(false);
    }
  }, [memory]);

  if (!memory) return null;

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('mc_memories')
      .update({
        content: content.trim(),
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        source_file: sourceFile.trim(),
      })
      .eq('id', memory.id);
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    await supabase.from('mc_memories').delete().eq('id', memory.id);
    onOpenChange(false);
    onUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Memory' : 'Memory Detail'}</DialogTitle>
          <DialogDescription>
            {!editing && (
              <span className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{memory.category}</Badge>
                {memory.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Memory['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-source">Source File</Label>
              <Input
                id="edit-source"
                value={sourceFile}
                onChange={(e) => setSourceFile(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm whitespace-pre-wrap">{memory.content}</p>
            </div>
            {memory.source_file && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Source</Label>
                <p className="text-sm text-muted-foreground font-mono">{memory.source_file}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Created</Label>
              <p className="text-sm text-muted-foreground">{new Date(memory.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !content.trim()}>
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
