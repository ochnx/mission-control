'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TaskFiltersProps {
  filterAssignee: string;
  filterPriority: string;
  onAssigneeChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
}

export function TaskFilters({
  filterAssignee,
  filterPriority,
  onAssigneeChange,
  onPriorityChange,
}: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Select value={filterAssignee} onValueChange={onAssigneeChange}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          <SelectItem value="Oskar">Oskar</SelectItem>
          <SelectItem value="Agent">Agent</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterPriority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
