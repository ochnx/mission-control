-- Second Brain V2 Migration
-- Adds source tracking, access stats, relevance scoring, and entity linking

-- Add new columns to mc_memories
ALTER TABLE mc_memories ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';
ALTER TABLE mc_memories ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;
ALTER TABLE mc_memories ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;
ALTER TABLE mc_memories ADD COLUMN IF NOT EXISTS relevance_score FLOAT DEFAULT 1.0;

-- Entity extraction / linking table
CREATE TABLE IF NOT EXISTS mc_memory_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES mc_memories(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,  -- person, company, project, deal, property
  entity_name TEXT NOT NULL,
  entity_id UUID,             -- optional FK to mc_contacts, mc_deals, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for entity lookups
CREATE INDEX IF NOT EXISTS idx_memory_entities_type_name ON mc_memory_entities (entity_type, entity_name);
CREATE INDEX IF NOT EXISTS idx_memory_entities_memory_id ON mc_memory_entities (memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_entities_entity_id ON mc_memory_entities (entity_id);

-- Index for sorting/filtering on new columns
CREATE INDEX IF NOT EXISTS idx_memories_source_type ON mc_memories (source_type);
CREATE INDEX IF NOT EXISTS idx_memories_relevance ON mc_memories (relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_memories_access_count ON mc_memories (access_count DESC);
