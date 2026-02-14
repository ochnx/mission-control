'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useWake } from '@/hooks/use-wake';
import { WakeToast } from '@/components/wake-toast';
import type { Task } from '@/types';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskFilters } from '@/components/tasks/task-filters';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { TaskDetailSheet } from '@/components/tasks/task-detail-sheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { wake, toastVisible } = useWake();

  const fetchTasks = useCallback(async () => {
    let query = supabase.from('mc_tasks').select('*').order('created_at', { ascending: false });

    if (filterAssignee !== 'all') {
      query = query.eq('assignee', filterAssignee);
    }
    if (filterPriority !== 'all') {
      query = query.eq('priority', filterPriority);
    }

    const { data } = await query;
    setTasks(data || []);
    setLoading(false);
  }, [filterAssignee, filterPriority]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    await supabase.from('mc_tasks').update({ status: newStatus }).eq('id', taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track your tasks across all projects
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </div>

      <TaskFilters
        filterAssignee={filterAssignee}
        filterPriority={filterPriority}
        onAssigneeChange={setFilterAssignee}
        onPriorityChange={setFilterPriority}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading tasks...
        </div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={updateTaskStatus}
          onTaskClick={(task) => {
            setSelectedTask(task);
            setDetailOpen(true);
          }}
        />
      )}

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(title) => {
          fetchTasks();
          if (title) wake(`New task created: ${title}`);
        }}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={fetchTasks}
      />

      <WakeToast visible={toastVisible} />
    </div>
  );
}
