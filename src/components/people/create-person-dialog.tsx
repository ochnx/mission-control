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
import { supabase } from '@/lib/supabase';

interface CreatePersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreatePersonDialog({ open, onOpenChange, onCreated }: CreatePersonDialogProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await supabase.from('mc_people').insert({
      name: name.trim(),
      company: company.trim(),
      role: role.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      tags,
    });

    setName('');
    setCompany('');
    setRole('');
    setEmail('');
    setPhone('');
    setNotes('');
    setTagsInput('');
    setSaving(false);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pname">Name</Label>
              <Input
                id="pname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pcompany">Company</Label>
              <Input
                id="pcompany"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prole">Role</Label>
              <Input
                id="prole"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Job title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pemail">Email</Label>
              <Input
                id="pemail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pphone">Phone</Label>
              <Input
                id="pphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptags">Tags</Label>
              <Input
                id="ptags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. client, partner"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pnotes">Notes</Label>
            <Textarea
              id="pnotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to remember..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Creating...' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
