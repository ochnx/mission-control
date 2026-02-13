'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/types';
import { PersonCard } from '@/components/people/person-card';
import { CreatePersonDialog } from '@/components/people/create-person-dialog';
import { PersonDetailSheet } from '@/components/people/person-detail-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchPeople = useCallback(async () => {
    let query = supabase.from('mc_people').select('*').order('name', { ascending: true });

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data } = await query;
    setPeople(data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchPeople, 300);
    return () => clearTimeout(timer);
  }, [fetchPeople]);

  // Group by company
  const grouped = people.reduce<Record<string, Person[]>>((acc, person) => {
    const company = person.company || 'No Company';
    if (!acc[company]) acc[company] = [];
    acc[company].push(person);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">People</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Contacts, relationships, and key people
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or company..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading contacts...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p className="text-sm">No contacts found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([company, contacts]) => (
              <div key={company}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {company}
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {contacts.map((person) => (
                    <PersonCard key={person.id} person={person} onUpdated={fetchPeople} onClick={() => { setSelectedPerson(person); setDetailOpen(true); }} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <CreatePersonDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchPeople}
      />

      <PersonDetailSheet
        person={selectedPerson}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={fetchPeople}
      />
    </div>
  );
}
