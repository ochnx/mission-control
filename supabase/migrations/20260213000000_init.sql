-- Mission Control — Supabase Migration
-- Run this in the Supabase SQL Editor

-- ============================================
-- TASKS (Kanban Board)
-- ============================================
CREATE TABLE IF NOT EXISTS mc_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  assignee TEXT NOT NULL DEFAULT 'Oskar' CHECK (assignee IN ('Agent', 'Oskar')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date TIMESTAMPTZ,
  project_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MEMORIES (Second Brain)
-- ============================================
CREATE TABLE IF NOT EXISTS mc_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Learnings' CHECK (category IN ('Decisions', 'Learnings', 'Rules', 'People', 'Projects')),
  tags TEXT[] DEFAULT '{}',
  source_file TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- REMINDERS & CALENDAR
-- ============================================
CREATE TABLE IF NOT EXISTS mc_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'reminder' CHECK (type IN ('reminder', 'deadline', 'event')),
  notes TEXT DEFAULT '',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PEOPLE (CRM)
-- ============================================
CREATE TABLE IF NOT EXISTS mc_people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  role TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  last_contact TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PROJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS mc_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'planned', 'active', 'paused', 'done')),
  description TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Foreign key for tasks → projects
ALTER TABLE mc_tasks
  ADD CONSTRAINT fk_tasks_project
  FOREIGN KEY (project_id) REFERENCES mc_projects(id) ON DELETE SET NULL;

-- ============================================
-- RLS Policies (V1: Allow all)
-- ============================================
ALTER TABLE mc_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on mc_tasks" ON mc_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mc_memories" ON mc_memories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mc_reminders" ON mc_reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mc_people" ON mc_people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mc_projects" ON mc_projects FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON mc_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON mc_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA
-- ============================================

-- Projects
INSERT INTO mc_projects (id, name, status, description) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Mission Control', 'active', 'Shared dashboard between Oskar and AI agent'),
  ('a1000000-0000-0000-0000-000000000002', 'Run & Gun', 'active', 'Real estate media production company'),
  ('a1000000-0000-0000-0000-000000000003', 'Personal Brand', 'planned', 'Build Oskar''s personal brand and online presence'),
  ('a1000000-0000-0000-0000-000000000004', 'Automation Hub', 'idea', 'Central hub for all business automations');

-- Tasks
INSERT INTO mc_tasks (title, description, status, assignee, priority, due_date, project_id) VALUES
  ('Build Mission Control V1', 'Next.js dashboard with all modules', 'in_progress', 'Agent', 'high', '2026-02-14', 'a1000000-0000-0000-0000-000000000001'),
  ('Set up Supabase tables', 'Migration SQL and seed data', 'done', 'Agent', 'high', '2026-02-13', 'a1000000-0000-0000-0000-000000000001'),
  ('Review calendar integration', 'Check if Google Calendar API can feed into MC', 'todo', 'Oskar', 'medium', '2026-02-17', 'a1000000-0000-0000-0000-000000000001'),
  ('Client follow-ups this week', 'Contact pending leads from last week', 'todo', 'Oskar', 'high', '2026-02-14', 'a1000000-0000-0000-0000-000000000002'),
  ('Automate lead intake', 'Build pipeline for incoming real estate leads', 'todo', 'Agent', 'medium', '2026-02-20', 'a1000000-0000-0000-0000-000000000004'),
  ('Social media content plan', 'Draft content calendar for Feb/March', 'todo', 'Oskar', 'low', '2026-02-28', 'a1000000-0000-0000-0000-000000000003');

-- Memories
INSERT INTO mc_memories (content, category, tags, source_file) VALUES
  ('Always use service_role key for Supabase server-side, anon key for client-side', 'Rules', '{supabase,security}', 'TOOLS.md'),
  ('Oskar prefers dark themes, minimal UI, no clutter', 'Decisions', '{design,preferences}', 'USER.md'),
  ('E&V (Engel & Völkers) and Von Poll are key real estate partners', 'People', '{business,contacts}', 'memory/contacts.md'),
  ('The daily memory files are in memory/YYYY-MM-DD.md format', 'Rules', '{workflow,memory}', 'AGENTS.md'),
  ('Mission Control should be the single source of truth for tasks and planning', 'Decisions', '{architecture,planning}', 'memory/2026-02-13.md');

-- Reminders
INSERT INTO mc_reminders (title, datetime, type, notes) VALUES
  ('Weekly planning session', '2026-02-17 09:00:00+01', 'event', 'Review tasks, priorities for the week'),
  ('Follow up with Ferrari contact', '2026-02-15 14:00:00+01', 'reminder', 'Check on proposal status'),
  ('Mission Control V1 deadline', '2026-02-14 18:00:00+01', 'deadline', 'Get basic version running');

-- People
INSERT INTO mc_people (name, company, role, email, phone, notes, tags, last_contact) VALUES
  ('Max Mustermann', 'Engel & Völkers', 'Director', 'max@ev.com', '+49 171 1234567', 'Key contact for Hamburg office', '{real-estate,partner}', '2026-02-10'),
  ('Lisa Schmidt', 'Von Poll', 'Marketing Lead', 'lisa@vonpoll.com', '+49 172 9876543', 'Interested in video content packages', '{real-estate,lead}', '2026-02-08'),
  ('Marco Rossi', 'Ferrari Hamburg', 'Brand Manager', 'marco@ferrari.com', '+49 173 5555555', 'Potential collaboration for car content', '{automotive,lead}', '2026-02-05');
