'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Deal } from '@/types';
import { DealColumn } from './deal-column';
import { DealCard } from './deal-card';

interface DealPipelineProps {
  deals: Deal[];
  onStageChange: (dealId: string, stage: Deal['stage']) => void;
  onDealClick?: (deal: Deal) => void;
}

const columns: { id: Deal['stage']; title: string }[] = [
  { id: 'lead', title: 'Lead' },
  { id: 'proposal', title: 'Proposal' },
  { id: 'negotiation', title: 'Negotiation' },
  { id: 'signed', title: 'Signed' },
  { id: 'active', title: 'Active' },
  { id: 'churned', title: 'Churned' },
];

export function DealPipeline({ deals, onStageChange, onDealClick }: DealPipelineProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    const targetColumn = columns.find((c) => c.id === overId);
    if (targetColumn) {
      onStageChange(dealId, targetColumn.id);
      return;
    }

    const targetDeal = deals.find((d) => d.id === overId);
    if (targetDeal) {
      onStageChange(dealId, targetDeal.stage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const columnDeals = deals.filter((d) => d.stage === col.id);
          return (
            <DealColumn key={col.id} id={col.id} title={col.title} count={columnDeals.length}>
              <SortableContext
                items={columnDeals.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
                ))}
              </SortableContext>
            </DealColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="drag-overlay">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
