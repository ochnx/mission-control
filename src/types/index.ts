export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  assignee: 'Agent' | 'Oskar';
  priority: 'high' | 'medium' | 'low';
  due_date: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  project?: Project;
}

export interface Memory {
  id: string;
  content: string;
  category: 'Decisions' | 'Learnings' | 'Rules' | 'People' | 'Projects';
  tags: string[];
  source_file: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  title: string;
  datetime: string;
  type: 'reminder' | 'deadline' | 'event';
  notes: string;
  completed: boolean;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
  tags: string[];
  last_contact: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  status: 'idea' | 'planned' | 'active' | 'paused' | 'done';
  description: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // computed
  tasks_count?: number;
}

export interface AgentActivity {
  id: string;
  action_type: string;
  status: 'success' | 'error' | 'running';
  summary: string;
  details: Record<string, unknown>;
  cron_job_name: string | null;
  duration_ms: number | null;
  created_at: string;
}

export type SuggestionType = 'overdue_task' | 'follow_up' | 'deal_action' | 'calendar_gap' | 'insight';

export interface Suggestion {
  id: string;
  suggestion_type: SuggestionType;
  title: string;
  description: string | null;
  action_type: string | null;
  action_data: Record<string, unknown> | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'accepted' | 'dismissed';
  created_at: string;
}

export interface Deal {
  id: string;
  name: string;
  company_id: string | null;
  stage: 'lead' | 'proposal' | 'negotiation' | 'signed' | 'active' | 'churned';
  value_monthly: number | null;
  value_budget: number | null;
  value_courtage: number | null;
  notes: string;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  updated_at: string;
  company?: Person;
}

export interface TaskPerson {
  task_id: string;
  person_id: string;
  role: 'assignee' | 'stakeholder' | 'related';
  person?: Person;
  task?: Task;
}

export interface MemoryLink {
  memory_id: string;
  entity_type: 'task' | 'project' | 'person';
  entity_id: string;
}

export interface AgentCommand {
  id: string;
  command_type: 'research' | 'draft_email' | 'generate_report' | 'custom';
  target_type: 'person' | 'task' | 'project' | null;
  target_id: string | null;
  parameters: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result: string | null;
  created_at: string;
  completed_at: string | null;
}

export type ModuleKey = 'tasks' | 'memory' | 'calendar' | 'people' | 'projects' | 'activity' | 'deals' | 'timeline' | 'commands';
