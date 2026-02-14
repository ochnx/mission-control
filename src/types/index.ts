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

export type ModuleKey = 'tasks' | 'memory' | 'calendar' | 'people' | 'projects' | 'activity';
