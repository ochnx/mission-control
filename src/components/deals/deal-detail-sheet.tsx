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
import type { Deal, Person } from '@/types';
import { cn } from '@/lib/utils';
import { isPast, isToday } from 'date-fns';

interface DealDetailSheetProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const stageColors: Record<string, string> = {
  lead: 'text-blue-400',
  proposal: 'text-purple-400',
  negotiation: 'text-amber-400',
  signed: 'text-emerald-400',
  active: 'text-teal-400',
  churned: 'text-red-400',
};

export function DealDetailSheet({ deal, open, onOpenChange, onUpdated }: DealDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [stage, setStage] = useState<Deal['stage']>('lead');
  const [valueMonthly, setValueMonthly] = useState('');
  const [valueBudget, setValueBudget] = useState('');
  const [valueCourtage, setValueCourtage] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState<Pick<Person, 'id' | 'name' | 'company'>[]>([]);

  useEffect(() => {
    if (deal) {
      setName(deal.name);
      setCompanyId(deal.company_id || '');
      setStage(deal.stage);
      setValueMonthly(deal.value_monthly?.toString() || '');
      setValueBudget(deal.value_budget?.toString() || '');
      setValueCourtage(deal.value_courtage?.toString() || '');
      setNextAction(deal.next_action || '');
      setNextActionDate(deal.next_action_date || '');
      setNotes(deal.notes || '');
      setEditing(false);
    }
  }, [deal]);

  useEffect(() => {
    if (editing) {
      supabase.from('mc_people').select('id, name, company').order('name').then(({ data }) => {
        setPeople((data as Pick<Person, 'id' | 'name' | 'company'>[]) || []);
      });
    }
  }, [editing]);

  if (!deal) return null;

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('mc_deals')
      .update({
        name: name.trim(),
        company_id: companyId || null,
        stage,
        value_monthly: valueMonthly ? parseFloat(valueMonthly) : null,
        value_budget: valueBudget ? parseFloat(valueBudget) : null,
        value_courtage: valueCourtage ? parseFloat(valueCourtage) : null,
        next_action: nextAction.trim() || null,
        next_action_date: nextActionDate || null,
        notes: notes.trim(),
      })
      .eq('id', deal.id);
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    await supabase.from('mc_deals').delete().eq('id', deal.id);
    onOpenChange(false);
    onUpdated();
  };

  const isOverdue = deal.next_action_date && isPast(new Date(deal.next_action_date)) && !isToday(new Date(deal.next_action_date));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? 'Edit Deal' : deal.name}</SheetTitle>
          <SheetDescription>
            {!editing && (
              <span className="flex items-center gap-2">
                <Badge variant="outline" className={cn('capitalize', stageColors[deal.stage])}>{deal.stage}</Badge>
                {deal.company && (
                  <Badge variant="outline">{deal.company.name}</Badge>
                )}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {editing ? (
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="edit-deal-name">Name</Label>
              <Input id="edit-deal-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contact</Label>
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
                <Select value={stage} onValueChange={(v) => setStage(v as Deal['stage'])}>
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
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-monthly">Monthly (€)</Label>
                <Input id="edit-monthly" type="number" value={valueMonthly} onChange={(e) => setValueMonthly(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-budget">Budget (€)</Label>
                <Input id="edit-budget" type="number" value={valueBudget} onChange={(e) => setValueBudget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-courtage">Courtage (%)</Label>
                <Input id="edit-courtage" type="number" value={valueCourtage} onChange={(e) => setValueCourtage(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-next-action">Next Action</Label>
                <Input id="edit-next-action" value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-next-date">Action Date</Label>
                <Input id="edit-next-date" type="date" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deal-notes">Notes</Label>
              <Textarea id="edit-deal-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Monthly</Label>
                <p className="text-sm">{deal.value_monthly ? `€${deal.value_monthly.toLocaleString('de-DE')}` : '—'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Ad Budget</Label>
                <p className="text-sm">{deal.value_budget ? `€${deal.value_budget.toLocaleString('de-DE')}` : '—'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Courtage</Label>
                <p className="text-sm">{deal.value_courtage ? `${deal.value_courtage}%` : '—'}</p>
              </div>
            </div>
            {deal.next_action && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Next Action</Label>
                <p className={cn('text-sm', isOverdue && 'text-red-400 font-medium')}>
                  {deal.next_action}
                  {deal.next_action_date && (
                    <span className={cn('ml-2', isOverdue ? 'text-red-400' : 'text-muted-foreground')}>
                      (by {new Date(deal.next_action_date).toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>
            )}
            {deal.notes && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Notes</Label>
                <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Created</Label>
              <p className="text-sm text-muted-foreground">{new Date(deal.created_at).toLocaleDateString()}</p>
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
