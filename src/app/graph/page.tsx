'use client';

import { KnowledgeGraph } from '@/components/graph/knowledge-graph';

export default function GraphPage() {
  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)]">
      <KnowledgeGraph />
    </div>
  );
}
