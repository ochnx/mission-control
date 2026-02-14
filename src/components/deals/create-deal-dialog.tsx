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
import type { Person } from '@/types';

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateDealDialog({ open, onOpenChange, onCreated }: CreateDealDialogProps) {
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [stage, setStage] = useState('lead');
  const [valueMonthly, setValueMonthly] = useState('');
  const [valueBudget, setValueBudget] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState<Pick<Person, 'id' | 'name' | 'company'>[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from('mc_people').select('id, name, company').order('name').then(({ data }) => {
        setPeople((data as Pick<Person, 'id' | 'name' | 'company'>[]) || []);
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    await supabase.from('mc_deals').insert({
      name: name.trim(),
      company_id: companyId || null,
      stage,
      value_monthly: valueMonthly ? parseFloat(valueMonthly) : null,
      value_budget: valueBudget ? parseFloat(valueBudget) : null,
      next_action: nextAction.trim() || null,
      next_action_date: nextActionDate || null,
      notes: notes.trim(),
    });

    setName('');
    setCompanyId('');
    setStage('lead');
    setValueMonthly('');
    setValueBudget('');
    setNextAction('');
    setNextActionDate('');
    setNotes('');
    setSaving(false);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-name">Deal Name</Label>
            <Input
              id="deal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E&V Frankfurt Campaign"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Contact / Company</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}{p.company ? ` (${p.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="deal-monthly">Monthly Value (€)</Label>
              <Input
                id="deal-monthly"
                type="number"
                value={valueMonthly}
                onChange={(e) => setValueMonthly(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-budget">Ad Budget (€)</Label>
              <Input
                id="deal-budget"
                type="number"
                value={valueBudget}
                onChange={(e) => setValueBudget(e.target.value)}
                placeholder="5000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="deal-next-action">Next Action</Label>
              <Input
                id="deal-next-action"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Follow-up call"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-next-date">Next Action Date</Label>
              <Input
                id="deal-next-date"
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-notes">Notes</Label>
            <Textarea
              id="deal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Deal context..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
