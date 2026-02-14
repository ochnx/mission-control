# Second Brain / Memory Module — Research & Feature Plan

**Date:** 2026-02-14  
**Context:** Improving the MC `/memory` page from basic CRUD to a genuinely useful knowledge management system  
**Current state:** `mc_memories` table with content, category, tags, source_file, created_at. Categories: Decisions, Learnings, Rules, People, Projects.

---

## 1. State of the Art — What the Best Apps Are Doing (2026)

### Notion (AI-native workspace)
- **Notion AI Q&A:** Ask questions across your entire workspace; the AI searches all pages, databases, and docs semantically.
- **Database views + Relations:** Memories aren't flat notes — they live in databases with relations, rollups, and filters. You can view the same data as a table, board, timeline, or gallery.
- **Templates & Automations:** Recurring structures (meeting notes, project briefs) auto-create and link.
- **Weakness:** Performance degrades with large databases. AI features require paid plans. Overkill for personal knowledge — better for team wikis.

### Obsidian (local-first, plugin ecosystem)
- **Bidirectional links + Graph view:** Every note can link to any other. The graph view reveals clusters and orphans.
- **1000+ community plugins:** AI plugins (Smart Connections, Copilot) add semantic search, auto-linking, and chat-with-notes.
- **Local markdown files:** You own your data. Git-versioned. Full offline.
- **Canvas:** Visual boards for spatial thinking — connect notes, images, and links on a whiteboard.
- **CLAUDE.md pattern (Léonard Sellem, 2026):** Context files at every folder scope let AI agents "wake up informed" without needing search. The system self-maintains via nightly agent routines.
- **Weakness:** Steep learning curve. Plugin dependency. No built-in collaboration.

### Roam Research (networked thought)
- **Block-level references:** Link not just pages but individual paragraphs. Everything is a block.
- **Daily notes as inbox:** Today's page is capture; backlinks auto-surface context.
- **Graph database underneath:** Native bidirectional links create a knowledge graph.
- **Weakness:** $15/mo, niche UX, steep learning curve. Community has shrunk since Obsidian's rise.

### Mem.ai (AI-first)
- **Zero-organization philosophy:** You just write. AI handles categorization, tagging, and retrieval.
- **Natural language search:** "What did I decide about pricing last month?" works.
- **Automatic tagging and organization:** No folders, no manual structure.
- **Smart write:** AI generates drafts from your existing notes.
- **Weakness:** Cloud-only, limited customization, smaller ecosystem.

### Emerging: Copana, Second Brain (thesecondbrain.io), NotebookLM
- **Copana:** "Auto-memory" — mention something once, it remembers forever. Proactive surfacing of relevant memories during conversations.
- **thesecondbrain.io:** Drop any media (YouTube, PDFs, podcasts, articles) → instantly searchable, AI-chattable, interconnected. Focused on multimedia knowledge.
- **NotebookLM (Google):** Upload sources → AI creates a grounded assistant. Best for "chat with your documents."

---

## 2. What Makes a Second Brain Useful vs. a Dumping Ground

### The Core Insight
> "Organization alone doesn't create value. A pile of well-tagged notes is still just a pile." — Léonard Sellem

> "For all the influencers talking about PKM, remarkably few have done anything incredible with their systems. The main use case seems to be *talking about your knowledge management system*." — a16z podcast

### The 5 Failure Modes
1. **The Everything Bucket:** Dump everything, organize nothing. "I'll sort it later" — later never comes.
2. **The Beautiful Graveyard:** Perfectly organized, never referenced. Organization becomes the hobby.
3. **The Second Job:** System requires >30 min/week maintenance → abandoned when busy.
4. **The Search Desert:** Great capture, terrible retrieval. Can't find anything when you need it.
5. **The Isolated Island:** Notes exist but never surface at the right moment. No proactive connections.

### What Actually Works (Research Synthesis)

| Principle | Why It Matters |
|---|---|
| **Retrieval-first design** | Success metric: "Do you actually reference your notes when making decisions?" If no, the system is decorative. |
| **Frictionless capture** | If capturing takes >10 seconds, it won't happen. Inbox → process later. |
| **AI-powered maintenance** | Humans won't maintain it. Agents should triage, tag, link, and update. |
| **Proactive surfacing** | Don't wait for search. Surface relevant memories when context demands it. |
| **Progressive distillation** | Raw notes → processed insights → actionable knowledge. Layers, not flat storage. |
| **Connection discovery** | Value comes from unexpected links between ideas, people, and projects. |
| **Time decay awareness** | Recent = more relevant. Old memories should fade unless reinforced. |
| **Maintenance budget <30 min/week** | If the system needs more, it will die. |

### The Three-Layer Architecture (from downloadchaos.com)
1. **Capture Layer:** Frictionless inbox. Zero friction. Dump everything.
2. **Process Layer:** Weekly review transforms raw notes into usable knowledge.
3. **Retrieve Layer:** Search + connections, not folders. Find by meaning, not location.

---

## 3. How AI (The Agent) Makes the Second Brain Smarter

### 3.1 Auto-Categorization & Tagging
- **Current:** Manual category selection from 5 options.
- **Better:** Agent analyzes content and auto-assigns category, tags, and related entities (people, projects, deals).
- **Tech:** LLM classification on save. Simple prompt: "Given this memory, assign category, tags, and extract mentioned entities."
- **Key insight from Mem.ai:** The best system is one where the user NEVER has to categorize manually.

### 3.2 Semantic Search (Vector/Embedding Search)
- **Current:** Presumably keyword/text search on content field.
- **Better:** Embed all memories as vectors. Search by meaning: "What did we decide about the Blankenese listing?" finds relevant memories even if those exact words weren't used.
- **Tech:** pgvector extension for Postgres (already using Supabase). Generate embeddings via OpenAI `text-embedding-3-small` on save. Cosine similarity search.
- **Cost:** ~$0.02 per 1M tokens for embeddings. Negligible.

### 3.3 Proactive Knowledge Surfacing
- **The killer feature nobody has built well yet.**
- **Concept:** When the agent is working on a deal, preparing for a meeting, or writing an email, it automatically queries the memory system for relevant context.
- **Implementation:** Before responding to user requests, agent runs a semantic search against memories with the current context. Surfaces relevant memories as "recall."
- **Example:** User says "meeting with Müller tomorrow" → Agent surfaces: past interactions with Müller, his preferences, deal history, any decisions made about his properties.

### 3.4 Connection Discovery (Knowledge Graph)
- **Concept:** Memories aren't isolated. They connect to people, projects, deals, decisions.
- **Implementation:** Extract entities from each memory (people, companies, properties, projects). Store as a lightweight graph. When viewing a person → see all related memories. When viewing a project → see all decisions, learnings, people involved.
- **Tech:** Can be done with Postgres relations (memory_entities junction table) — no need for Neo4j at our scale.
- **Visual:** Graph visualization showing memory clusters and connections.

### 3.5 Automatic Memory Creation
- **Concept:** Agent creates memories autonomously from conversations, emails, meetings.
- **Sources:**
  - Telegram conversations (when important decisions or info are shared)
  - Email threads (client preferences, deal terms)
  - Meeting transcripts (action items, decisions)
  - Deal updates (stage changes, price changes)
- **Implementation:** After processing a conversation/email, agent evaluates: "Is there anything worth remembering long-term?" If yes → auto-create memory with source attribution.

### 3.6 Memory Aging & Reinforcement
- **Concept:** Not all memories are equally valuable over time. Recent > old. Referenced > forgotten.
- **Implementation:**
  - Track `last_accessed_at` and `access_count`
  - Relevance score = f(recency, access_frequency, connections)
  - Periodic review: Agent flags stale memories for archival or deletion
  - Spaced repetition-inspired: Important memories resurface periodically

### 3.7 Context Injection (Sellem Pattern)
- **Instead of searching memories every time, pre-inject relevant context.**
- For each "scope" (deal, client, project), maintain a living CONTEXT document that the agent reads at session start.
- Agent updates these contexts nightly from accumulated memories.
- This is what makes the system *compound* — each session benefits from all previous sessions.

---

## 4. The 10x Version for Our Use Case

### Who: Agency owner managing deals, clients, projects, team
### What they need from a Second Brain:

#### Deal Intelligence
- Every deal has accumulated knowledge: client preferences, property history, pricing discussions, competitor info, neighborhood context.
- Before a viewing → agent surfaces: client's style preferences, budget discussions, past viewings they liked/disliked.
- After a meeting → agent auto-captures: what was discussed, what was promised, next steps.

#### People/Relationship Memory
- For every contact: communication history, preferences, personality notes, relationship strength.
- "What do I know about Thomas Müller?" → comprehensive dossier from all memories.
- Birthday reminders, follow-up triggers, relationship decay alerts.

#### Decision Log
- Every significant decision with context: why it was made, what alternatives were considered, who was involved.
- Searchable: "Why did we decide to go with Von Poll instead of E&V for that listing?"
- Prevents re-litigating decisions. Institutional memory.

#### Project Playbooks
- Recurring patterns: "How did we handle the last renovation project?" "What's our process for luxury listings?"
- Agent learns from past projects and suggests playbooks for new ones.
- Templates that evolve based on actual outcomes.

#### Client Intelligence Briefings
- Before any client interaction, agent prepares a brief: recent communications, open items, deal status, personal notes, any promises made.
- This is the "proactive surfacing" feature applied to the CRM use case.

---

## 5. Concrete Feature List with Priorities

### P0 — Foundation (Must Have, Build First)

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 1 | **Semantic Search** | Add pgvector to mc_memories. Generate embeddings on save. Search by meaning. | M |
| 2 | **Auto-Categorization** | Agent auto-assigns category + tags on memory creation. User can override. Remove manual category picker as primary input. | S |
| 3 | **Entity Extraction** | Extract people, companies, projects, deals from memory content. Store in `memory_entities` junction table. | M |
| 4 | **Agent Memory API** | Endpoint for the agent to create, search, and retrieve memories programmatically. Used during conversations. | M |
| 5 | **Improved Memory Creation UX** | Just type/paste content. Everything else (category, tags, entities) is auto-detected. Quick-capture widget. | S |
| 6 | **Source Attribution** | Every memory tracks its origin: manual, telegram conversation, email, meeting transcript, deal update. | S |

### P1 — Intelligence Layer (High Value, Build Next)

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 7 | **Proactive Context Surfacing** | Agent queries memories before responding. "Here's what I remember about [topic]" appears as recall context. | M |
| 8 | **Connection Graph** | Visual graph showing how memories connect via shared entities. Click a person → see all memories. Click a project → see decisions + learnings. | L |
| 9 | **Auto-Memory from Conversations** | Agent creates memories from Telegram chats when significant decisions/info are shared. Needs user confirmation toggle. | M |
| 10 | **Memory Timeline View** | Chronological view of memories, filterable by entity/category. See evolution of knowledge over time. | M |
| 11 | **Relationship Dossier** | For any person/company: auto-generated summary of all known information, interactions, and open items. | M |
| 12 | **Memory Aging & Relevance** | Track access patterns. Score relevance. Surface stale memories for review. Archive old, unreferenced ones. | S |

### P2 — Compound Intelligence (Differentiator, Build When P0+P1 Solid)

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 13 | **Deal Intelligence Briefing** | Before client meetings: auto-generated brief with deal history, client preferences, decisions, open items. | L |
| 14 | **Living Context Documents** | Per-deal, per-client, per-project context docs auto-updated by agent nightly. Agent reads these at session start. | L |
| 15 | **Cross-Memory Insights** | "You decided X for Project A, but Y for similar Project B. Worth reviewing?" Agent finds contradictions and patterns. | L |
| 16 | **Auto-Memory from Email** | Parse important emails → create memories for decisions, commitments, client preferences. | M |
| 17 | **Memory Templates** | Structured memory types: Decision (options considered, chosen, why), Meeting (attendees, discussed, actions), Person (role, preferences, notes). | M |
| 18 | **Weekly Knowledge Digest** | Agent sends weekly summary: new memories, stale items to review, interesting connections discovered. | S |
| 19 | **Playbook Evolution** | Track project outcomes. Agent suggests process improvements based on what worked vs. what didn't. | L |
| 20 | **Natural Language Memory Query** | Chat interface: "What did I promise the Bergers?" "Summarize all learnings from Q4 2025." Returns synthesized answers, not just raw memories. | M |

---

## 6. Technical Implementation Notes

### Database Changes
```sql
-- Add vector column for semantic search
ALTER TABLE mc_memories ADD COLUMN embedding vector(1536);

-- Add metadata columns
ALTER TABLE mc_memories ADD COLUMN source_type TEXT DEFAULT 'manual'; -- manual, telegram, email, meeting, deal
ALTER TABLE mc_memories ADD COLUMN last_accessed_at TIMESTAMPTZ;
ALTER TABLE mc_memories ADD COLUMN access_count INTEGER DEFAULT 0;
ALTER TABLE mc_memories ADD COLUMN relevance_score FLOAT DEFAULT 1.0;

-- Entity extraction table
CREATE TABLE mc_memory_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES mc_memories(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- person, company, project, deal, property
  entity_name TEXT NOT NULL,
  entity_id UUID, -- optional FK to mc_contacts, mc_deals, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for vector search
CREATE INDEX ON mc_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for entity lookups
CREATE INDEX ON mc_memory_entities (entity_type, entity_name);
CREATE INDEX ON mc_memory_entities (memory_id);
```

### Embedding Pipeline
1. On memory create/update → call OpenAI `text-embedding-3-small` → store vector
2. Search: embed query → cosine similarity against all memories → return top-k
3. Cost: ~$0.02/1M tokens. At 1000 memories averaging 200 tokens each = $0.004 total. Essentially free.

### Agent Integration Pattern
```
User says something → Agent extracts context keywords →
  Agent calls /api/memories/search?q=semantic_query →
  Relevant memories injected into agent context →
  Agent responds with full context awareness
```

### Recommended Build Order
1. **Week 1:** pgvector + embeddings + semantic search API
2. **Week 2:** Auto-categorization + entity extraction on save
3. **Week 3:** Agent memory API + proactive surfacing in conversations
4. **Week 4:** Connection graph UI + timeline view
5. **Ongoing:** Auto-memory from conversations, email integration, briefings

---

## 7. Key Sources

| Source | Key Insight |
|--------|------------|
| [Copana.ai blog (2026)](https://copana.ai/blog/best-ai-second-brain-tools-2026) | Auto-capture + proactive surfacing = the features that matter most |
| [Léonard Sellem (2026)](https://sellem.me/en/blog/2026-02-04-ai-native-second-brain/) | Context injection > retrieval. Agent-maintained context files. System should self-maintain. |
| [downloadchaos.com (2025)](https://downloadchaos.com/blog/second-brain-building-guide-2025) | Three-layer architecture. Maintenance <30 min/week or it dies. Retrieval-first design. |
| [a16z podcast](https://share.snipd.com/episode/eb6990a4-9b66-42c7-989d-271bd1cf17ec) | Most PKM systems are decorative. Value = actually using it for decisions. |
| [OneReach.ai — Graph RAG (2025)](https://onereach.ai/blog/graph-rag-the-future-of-knowledge-management-software/) | Knowledge graphs + RAG = enterprise-grade knowledge management |
| [Mem.ai](https://aloa.co/ai/comparisons/ai-note-taker-comparison/notion-ai-vs-mem) | Zero-organization is the goal. AI-first categorization and retrieval. |
| [FAANG — PKM with Vectors (2025)](https://medium.com/@FAANG/building-an-ai-powered-personal-knowledge-management-system-with-vector-databases-a-developers-c777e776b4b9) | pgvector + embeddings = semantic search for personal knowledge |
| [Spaced (Reddit)](https://www.reddit.com/r/Evernote/comments/1fmj36r/) | Spaced repetition for knowledge retention — memories should resurface |

---

## 8. TL;DR — The Vision

**Current state:** A notes table with 5 categories. Manual CRUD. Flat, disconnected, passive.

**Target state:** An AI-powered knowledge system that:
1. **Captures automatically** from conversations, emails, and meetings
2. **Organizes itself** — no manual categorization needed
3. **Searches by meaning** — "what did we decide about X?" just works
4. **Surfaces proactively** — before meetings, during deals, when relevant
5. **Discovers connections** — links people to decisions to projects to outcomes
6. **Compounds over time** — each week it knows more, connects more, surfaces better

**The north star:** When the agent prepares you for a client meeting, it should know everything you've ever learned about that client, their preferences, your past promises, and relevant market context — without you having to ask.
