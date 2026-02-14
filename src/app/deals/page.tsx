'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Deal } from '@/types';
import { DealPipeline } from '@/components/deals/deal-pipeline';
import { CreateDealDialog } from '@/components/deals/create-deal-dialog';
import { DealDetailSheet } from '@/components/deals/deal-detail-sheet';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign } from 'lucide-react';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchDeals = useCallback(async () => {
    const { data } = await supabase
      .from('mc_deals')
      .select('*, company:mc_people!company_id(id, name, company)')
      .order('created_at', { ascending: false });
    setDeals((data as unknown as Deal[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const updateDealStage = async (dealId: string, newStage: Deal['stage']) => {
    await supabase.from('mc_deals').update({ stage: newStage }).eq('id', dealId);
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  };

  // Pipeline stats
  const activeDeals = deals.filter((d) => !['churned'].includes(d.stage));
  const totalMonthly = activeDeals.reduce((sum, d) => sum + (d.value_monthly || 0), 0);
  const totalBudget = activeDeals.reduce((sum, d) => sum + (d.value_budget || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deal Pipeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track deals from lead to active client
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Deal
        </Button>
      </div>

      {/* Pipeline stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>
            <span className="text-foreground font-medium">€{totalMonthly.toLocaleString('de-DE')}</span> /mo
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>
            <span className="text-foreground font-medium">€{totalBudget.toLocaleString('de-DE')}</span> ad budget
          </span>
        </div>
        <div className="text-muted-foreground">
          <span className="text-foreground font-medium">{activeDeals.length}</span> active deals
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading deals...
        </div>
      ) : (
        <DealPipeline
          deals={deals}
          onStageChange={updateDealStage}
          onDealClick={(deal) => {
            setSelectedDeal(deal);
            setDetailOpen(true);
          }}
        />
      )}

      <CreateDealDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchDeals}
      />

      <DealDetailSheet
        deal={selectedDeal}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={fetchDeals}
      />
    </div>
  );
}
