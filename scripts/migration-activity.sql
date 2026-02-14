CREATE TABLE mc_agent_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,  -- "cron_run", "task_complete", "mail_check", "suggestion", "research", "build", "sync"
  status TEXT DEFAULT 'success',  -- "success", "error", "running"
  summary TEXT NOT NULL,  -- Human-readable summary
  details JSONB DEFAULT '{}',  -- Extra structured data
  cron_job_name TEXT,  -- Which cron job triggered this
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_created ON mc_agent_activity(created_at DESC);
CREATE INDEX idx_activity_type ON mc_agent_activity(action_type);

ALTER TABLE mc_agent_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON mc_agent_activity FOR ALL USING (true);
