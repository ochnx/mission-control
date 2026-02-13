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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/types';

interface PersonDetailSheetProps {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function PersonDetailSheet({ person, open, onOpenChange, onUpdated }: PersonDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [lastContact, setLastContact] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (person) {
      setName(person.name || '');
      setCompany(person.company || '');
      setRole(person.role || '');
      setEmail(person.email || '');
      setPhone(person.phone || '');
      setNotes(person.notes || '');
      setTags((person.tags || []).join(', '));
      setLastContact(person.last_contact || '');
      setEditing(false);
    }
  }, [person]);

  if (!person) return null;

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('mc_people')
      .update({
        name: name.trim(),
        company: company.trim(),
        role: role.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        last_contact: lastContact || null,
      })
      .eq('id', person.id);
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    await supabase.from('mc_people').delete().eq('id', person.id);
    onOpenChange(false);
    onUpdated();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? 'Edit Contact' : person.name}</SheetTitle>
          <SheetDescription>
            {!editing && person.role && (
              <span>{person.role}{person.company ? ` at ${person.company}` : ''}</span>
            )}
          </SheetDescription>
        </SheetHeader>

        {editing ? (
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
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
              <Label htmlFor="edit-last-contact">Last Contact</Label>
              <Input
                id="edit-last-contact"
                type="date"
                value={lastContact}
                onChange={(e) => setLastContact(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            {person.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {person.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {person.email && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="text-sm">{person.email}</p>
                </div>
              )}
              {person.phone && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="text-sm">{person.phone}</p>
                </div>
              )}
              {person.company && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Company</Label>
                  <p className="text-sm">{person.company}</p>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Last Contact</Label>
                <p className="text-sm">{person.last_contact ? new Date(person.last_contact).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
            {person.notes && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Notes</Label>
                <p className="text-sm whitespace-pre-wrap">{person.notes}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Added</Label>
              <p className="text-sm text-muted-foreground">{new Date(person.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <SheetFooter>
          {editing ? (
            <div className="flex w-full gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1">
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
