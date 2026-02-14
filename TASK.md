# Second Brain V2 Rebuild

Read RESEARCH.md for full context. You're rebuilding the MC Memory/Second Brain page.

## What Exists
- `mc_memories` table: id, content, category, tags, source_file, created_at
- Basic CRUD page at /memory with card grid, category filter, text search
- Components: memory-card, create-memory-dialog, memory-detail-dialog

## What To Build (P0 Features)

### 1. Database Migration SQL
Create `scripts/migration-second-brain-v2.sql`:
- Add columns to mc_memories: `source_type` (manual/telegram/email/agent), `last_accessed_at`, `access_count`, `relevance_score`
- Create `mc_memory_entities` junction table (id, memory_id FK, entity_type, entity_name, entity_id optional, created_at)
- Indexes for entity lookups
- DON'T add pgvector yet (requires Supabase extension enable) — leave that for later

### 2. Updated Types
Update `src/types/index.ts`:
- Memory type: add source_type, last_accessed_at, access_count, relevance_score, entities (MemoryEntity[])
- Add MemoryEntity type

### 3. Redesigned Memory Page (`src/app/memory/page.tsx`)
Replace the current basic page with a much more powerful UI:

**Layout:** Left sidebar (40%) with memory list + filters, Right panel (60%) with selected memory detail

**Left Sidebar:**
- Search bar at top (debounced, searches content)
- Category pills (All, Decisions, Learnings, Rules, People, Projects, + any custom)
- Source filter chips (All, Manual, Agent, Telegram, Email)
- Memory list: cards showing first 2 lines of content, category badge, relative time, entity count
- Sort: newest first (default), most accessed, most relevant

**Right Panel (selected memory):**
- Full content (rendered markdown)
- Category + Tags (editable inline)
- Source attribution (where did this come from?)
- Linked entities section: shows linked people/projects/deals with clickable badges
- "Related Memories" section: shows memories that share entities (query mc_memory_entities)
- Access stats: created, last accessed, access count
- Actions: Edit, Delete, Add Entity Link

**Quick Capture:**
- Floating "+" button bottom-right
- Opens minimal dialog: just a text area + Submit
- Agent auto-categorizes later (for now, defaults to "Learnings")

### 4. Create Memory Dialog
Simplified: 
- Large text area (main input)
- Optional category selector (defaults to auto/Learnings)
- Optional tags input
- Source type auto-set to "manual"
- Entity linking: search existing people/projects, add as links

### 5. Memory Detail Dialog → Full Panel
Replace dialog with inline right-panel detail view (not a popup).
Show full content, metadata, linked entities, related memories.

### 6. Design
- Dark theme (matches existing MC)
- Tailwind + shadcn/ui (already in project)
- Mobile: stack layout (list on top, detail below on tap)
- Smooth transitions between selected memories
- Empty state: encouraging message + quick capture button

## Rules
- ONLY modify files in src/components/memory/, src/app/memory/, src/types/
- Don't touch other pages or the layout/sidebar
- Use existing supabase client from src/lib/supabase.ts
- Use existing shadcn components (button, badge, dialog, input, etc.)
- Keep it clean: no unused imports, proper TypeScript types
- The migration SQL is just a file — it will be run manually later
- Test build passes: `npm run build` must succeed

When completely finished, run: openclaw gateway wake --text "Done: Second Brain V2 rebuilt — new split-panel UI, entity linking, related memories, quick capture" --mode now
