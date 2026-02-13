'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Reminder } from '@/types';
import { CalendarView } from '@/components/calendar/calendar-view';
import { ReminderList } from '@/components/calendar/reminder-list';
import { CreateReminderDialog } from '@/components/calendar/create-reminder-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

export default function CalendarPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchReminders = useCallback(async () => {
    const { data } = await supabase
      .from('mc_reminders')
      .select('*')
      .order('datetime', { ascending: true });

    setReminders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase.from('mc_reminders').update({ completed: !completed }).eq('id', id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !completed } : r))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar & Reminders</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Stay on top of deadlines, events, and reminders
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Quick Add
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading...
        </div>
      ) : (
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar">
            <CalendarView
              reminders={reminders}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </TabsContent>
          <TabsContent value="list">
            <ReminderList reminders={reminders} onToggleComplete={toggleComplete} />
          </TabsContent>
        </Tabs>
      )}

      <CreateReminderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchReminders}
      />
    </div>
  );
}
