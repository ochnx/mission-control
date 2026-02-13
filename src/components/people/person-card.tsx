'use client';

import { format } from 'date-fns';
import { Mail, Phone, User, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/types';

interface PersonCardProps {
  person: Person;
  onUpdated: () => void;
}

export function PersonCard({ person, onUpdated }: PersonCardProps) {
  const handleDelete = async () => {
    await supabase.from('mc_people').delete().eq('id', person.id);
    onUpdated();
  };

  return (
    <div className="glass-card rounded-lg p-4 group hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{person.name}</p>
            {person.role && (
              <p className="text-xs text-muted-foreground">{person.role}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-1.5 mb-3">
        {person.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="w-3 h-3" />
            <a href={`mailto:${person.email}`} className="hover:text-foreground transition-colors">
              {person.email}
            </a>
          </div>
        )}
        {person.phone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            <a href={`tel:${person.phone}`} className="hover:text-foreground transition-colors">
              {person.phone}
            </a>
          </div>
        )}
      </div>

      {person.notes && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{person.notes}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {person.tags?.map((tag) => (
            <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
        {person.last_contact && (
          <span className="text-[10px] text-muted-foreground">
            Last: {format(new Date(person.last_contact), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}
