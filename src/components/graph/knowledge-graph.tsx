'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import type { Person, Project, Task, Deal, TaskPerson, MemoryLink, Memory } from '@/types';
import { Search, X, Users, FolderOpen, Target, Briefcase, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// --- Types ---

type EntityType = 'person' | 'project' | 'task' | 'deal' | 'memory';

interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  val: number; // node size
  color: string;
  data: Person | Project | Task | Deal | Memory;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// --- Colors ---

const NODE_COLORS: Record<EntityType, string> = {
  person: '#3b82f6',   // blue
  project: '#22c55e',  // green
  task: '#eab308',     // yellow
  deal: '#a855f7',     // purple
  memory: '#f97316',   // orange
};

const FILTER_CONFIG: { type: EntityType; label: string; icon: typeof Users; color: string }[] = [
  { type: 'person', label: 'People', icon: Users, color: NODE_COLORS.person },
  { type: 'project', label: 'Projects', icon: FolderOpen, color: NODE_COLORS.project },
  { type: 'task', label: 'Tasks', icon: Target, color: NODE_COLORS.task },
  { type: 'deal', label: 'Deals', icon: Briefcase, color: NODE_COLORS.deal },
  { type: 'memory', label: 'Memories', icon: Brain, color: NODE_COLORS.memory },
];

// --- Detail Panel ---

function DetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const renderFields = () => {
    const d = node.data;
    switch (node.type) {
      case 'person': {
        const p = d as Person;
        return (
          <>
            {p.company && <Field label="Company" value={p.company} />}
            {p.role && <Field label="Role" value={p.role} />}
            {p.email && <Field label="Email" value={p.email} />}
            {p.phone && <Field label="Phone" value={p.phone} />}
            {p.notes && <Field label="Notes" value={p.notes} />}
          </>
        );
      }
      case 'project': {
        const p = d as Project;
        return (
          <>
            <Field label="Status" value={p.status} />
            {p.description && <Field label="Description" value={p.description} />}
          </>
        );
      }
      case 'task': {
        const t = d as Task;
        return (
          <>
            <Field label="Status" value={t.status} />
            <Field label="Priority" value={t.priority} />
            <Field label="Assignee" value={t.assignee} />
            {t.due_date && <Field label="Due" value={t.due_date} />}
            {t.description && <Field label="Description" value={t.description} />}
          </>
        );
      }
      case 'deal': {
        const dl = d as Deal;
        return (
          <>
            <Field label="Stage" value={dl.stage} />
            {dl.value_monthly != null && <Field label="Monthly" value={`€${dl.value_monthly}`} />}
            {dl.notes && <Field label="Notes" value={dl.notes} />}
          </>
        );
      }
      case 'memory': {
        const m = d as Memory;
        return (
          <>
            <Field label="Category" value={m.category} />
            <Field label="Content" value={m.content} />
          </>
        );
      }
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto bg-card border border-border rounded-xl p-4 shadow-xl z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }} />
          <span className="text-xs font-medium uppercase text-muted-foreground">{node.type}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <h3 className="text-lg font-semibold mb-3">{node.name}</h3>
      <div className="space-y-2">{renderFields()}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

// --- Main Component ---

export function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<EntityType>>(
    new Set(['person', 'project', 'task', 'deal', 'memory'])
  );
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<{ d3Force: (name: string) => { strength: (s: number) => void } | undefined } | null>(null);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      setDimensions({ width: container.clientWidth, height: container.clientHeight });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    const [peopleRes, projectsRes, tasksRes, dealsRes, memoriesRes, taskPeopleRes, memLinksRes] =
      await Promise.all([
        supabase.from('mc_people').select('*'),
        supabase.from('mc_projects').select('*'),
        supabase.from('mc_tasks').select('*'),
        supabase.from('mc_deals').select('*, company:mc_people!company_id(id, name, company)'),
        supabase.from('mc_memories').select('*'),
        supabase.from('mc_task_people').select('*'),
        supabase.from('mc_memory_links').select('*'),
      ]);

    const people = (peopleRes.data || []) as Person[];
    const projects = (projectsRes.data || []) as Project[];
    const tasks = (tasksRes.data || []) as Task[];
    const deals = (dealsRes.data as unknown as Deal[]) || [];
    const memories = (memoriesRes.data || []) as Memory[];
    const taskPeople = (taskPeopleRes.data || []) as TaskPerson[];
    const memLinks = (memLinksRes.data || []) as MemoryLink[];

    // Build connection count map
    const connectionCount: Record<string, number> = {};
    const inc = (id: string) => { connectionCount[id] = (connectionCount[id] || 0) + 1; };

    // Count connections
    tasks.forEach((t) => {
      if (t.project_id) { inc(t.id); inc(t.project_id); }
    });
    taskPeople.forEach((tp) => { inc(tp.task_id); inc(tp.person_id); });
    deals.forEach((d) => {
      if (d.company_id) { inc(d.id); inc(d.company_id); }
    });
    memLinks.forEach((ml) => { inc(ml.memory_id); inc(ml.entity_id); });

    const sizeFor = (id: string) => Math.max(3, Math.min(12, (connectionCount[id] || 0) + 2));

    // Build nodes
    const nodes: GraphNode[] = [
      ...people.map((p) => ({
        id: `person-${p.id}`, name: p.name, type: 'person' as EntityType,
        val: sizeFor(p.id), color: NODE_COLORS.person, data: p,
      })),
      ...projects.map((p) => ({
        id: `project-${p.id}`, name: p.name, type: 'project' as EntityType,
        val: sizeFor(p.id), color: NODE_COLORS.project, data: p,
      })),
      ...tasks.map((t) => ({
        id: `task-${t.id}`, name: t.title, type: 'task' as EntityType,
        val: sizeFor(t.id), color: NODE_COLORS.task, data: t,
      })),
      ...deals.map((d) => ({
        id: `deal-${d.id}`, name: d.name, type: 'deal' as EntityType,
        val: sizeFor(d.id), color: NODE_COLORS.deal, data: d,
      })),
      ...memories.map((m) => ({
        id: `memory-${m.id}`, name: m.content.slice(0, 40), type: 'memory' as EntityType,
        val: sizeFor(m.id), color: NODE_COLORS.memory, data: m,
      })),
    ];

    // Build links
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = [];
    const addLink = (source: string, target: string, label: string) => {
      if (nodeIds.has(source) && nodeIds.has(target)) {
        links.push({ source, target, label });
      }
    };

    // Task → Project
    tasks.forEach((t) => {
      if (t.project_id) addLink(`task-${t.id}`, `project-${t.project_id}`, 'belongs to');
    });

    // Task → Person
    taskPeople.forEach((tp) => {
      addLink(`task-${tp.task_id}`, `person-${tp.person_id}`, tp.role);
    });

    // Deal → Person/Company
    deals.forEach((d) => {
      if (d.company_id) addLink(`deal-${d.id}`, `person-${d.company_id}`, 'company');
    });

    // Memory → Entity
    memLinks.forEach((ml) => {
      addLink(`memory-${ml.memory_id}`, `${ml.entity_type}-${ml.entity_id}`, 'linked');
    });

    setGraphData({ nodes, links });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Configure forces after mount
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;
    const charge = fg.d3Force('charge');
    if (charge && 'strength' in charge) {
      (charge as { strength: (s: number) => void }).strength(-120);
    }
  }, [graphData]);

  // Toggle filter
  const toggleFilter = (type: EntityType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Filtered graph data
  const filteredData = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    const filteredNodes = graphData.nodes.filter((n) => {
      if (!activeFilters.has(n.type)) return false;
      if (search && !n.name.toLowerCase().includes(lowerSearch)) return false;
      return true;
    });
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphData.links.filter(
      (l) => {
        const src = typeof l.source === 'string' ? l.source : (l.source as unknown as GraphNode).id;
        const tgt = typeof l.target === 'string' ? l.target : (l.target as unknown as GraphNode).id;
        return nodeIds.has(src) && nodeIds.has(tgt);
      }
    );
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, activeFilters, search]);

  // Highlight connected nodes on hover
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const ids = new Set<string>([hoveredNode.id]);
    graphData.links.forEach((l) => {
      const src = typeof l.source === 'string' ? l.source : (l.source as unknown as GraphNode).id;
      const tgt = typeof l.target === 'string' ? l.target : (l.target as unknown as GraphNode).id;
      if (src === hoveredNode.id) ids.add(tgt);
      if (tgt === hoveredNode.id) ids.add(src);
    });
    return ids;
  }, [hoveredNode, graphData.links]);

  // Node canvas render
  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D) => {
      const n = node as GraphNode & { x: number; y: number };
      const size = n.val || 4;
      const isHovered = hoveredNode?.id === n.id;
      const isConnected = hoveredNode ? connectedNodeIds.has(n.id) : true;
      const isSelected = selectedNode?.id === n.id;
      const dimmed = hoveredNode && !isConnected;

      ctx.beginPath();
      ctx.arc(n.x, n.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = dimmed ? `${n.color}33` : n.color;
      ctx.fill();

      if (isHovered || isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      if (size > 4 || isHovered || isSelected) {
        const label = n.name.length > 20 ? n.name.slice(0, 18) + '…' : n.name;
        const fontSize = Math.max(3, size * 0.8);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = dimmed ? '#ffffff33' : '#ffffffcc';
        ctx.fillText(label, n.x, n.y + size + 2);
      }
    },
    [hoveredNode, connectedNodeIds, selectedNode]
  );

  // Link canvas render
  const paintLink = useCallback(
    (link: object, ctx: CanvasRenderingContext2D) => {
      const l = link as { source: { id: string; x: number; y: number }; target: { id: string; x: number; y: number } };
      const isConnected = hoveredNode
        ? connectedNodeIds.has(l.source.id) && connectedNodeIds.has(l.target.id)
        : true;

      ctx.beginPath();
      ctx.moveTo(l.source.x, l.source.y);
      ctx.lineTo(l.target.x, l.target.y);
      ctx.strokeStyle = isConnected ? '#ffffff22' : '#ffffff08';
      ctx.lineWidth = isConnected && hoveredNode ? 1.5 : 0.5;
      ctx.stroke();
    },
    [hoveredNode, connectedNodeIds]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading graph data...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {/* Controls bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {FILTER_CONFIG.map(({ type, label, icon: Icon, color }) => {
            const active = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  active
                    ? 'border-transparent text-white shadow-md'
                    : 'border-border text-muted-foreground bg-card hover:text-foreground'
                )}
                style={active ? { backgroundColor: color } : undefined}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="text-xs text-muted-foreground bg-card/80 border border-border rounded-lg px-3 py-1.5 shadow-sm">
          {filteredData.nodes.length} nodes · {filteredData.links.length} edges
        </div>
      </div>

      {/* Force Graph */}
      <ForceGraph2D
        ref={graphRef as React.MutableRefObject<never>}
        graphData={filteredData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        nodePointerAreaPaint={(node: object, color: string, ctx: CanvasRenderingContext2D) => {
          const n = node as GraphNode & { x: number; y: number };
          const size = n.val || 4;
          ctx.beginPath();
          ctx.arc(n.x, n.y, size + 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={(node: object) => {
          setSelectedNode(node as GraphNode);
        }}
        onNodeHover={(node: object | null) => {
          setHoveredNode(node ? (node as GraphNode) : null);
        }}
        onBackgroundClick={() => {
          setSelectedNode(null);
        }}
        cooldownTicks={100}
        warmupTicks={50}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      {/* Detail Panel */}
      {selectedNode && (
        <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}
