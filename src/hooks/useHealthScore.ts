import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ClientHealthScore,
  HealthScoreComponents,
  HealthScoreSummary,
  RiskClassification,
} from '@/types/retention';

// Weights for health score formula
const WEIGHTS = {
  recency: 0.30,
  frequency: 0.25,
  monetary: 0.20,
  trend: 0.15,
  engagement: 0.10,
};

// Classification thresholds
function classifyScore(score: number): RiskClassification {
  if (score >= 75) return 'healthy';
  if (score >= 50) return 'attention';
  if (score >= 25) return 'critical';
  return 'lost';
}

// Calculate recency score (0-100): how recently client generated revenue
function calcRecency(daysSinceLastRevenue: number | null): number {
  if (daysSinceLastRevenue === null) return 0;
  if (daysSinceLastRevenue <= 30) return 100;
  if (daysSinceLastRevenue <= 60) return 75;
  if (daysSinceLastRevenue <= 90) return 50;
  if (daysSinceLastRevenue <= 180) return 25;
  return 0;
}

// Calculate frequency score (0-100): operations per month in last 6 months
function calcFrequency(revenueCountLast6Months: number): number {
  const avgPerMonth = revenueCountLast6Months / 6;
  if (avgPerMonth >= 4) return 100;
  if (avgPerMonth >= 2) return 75;
  if (avgPerMonth >= 1) return 50;
  if (avgPerMonth >= 0.5) return 25;
  return 0;
}

// Calculate monetary score (0-100): average monthly revenue relative to percentiles
function calcMonetary(avgMonthlyRevenue: number, medianRevenue: number): number {
  if (medianRevenue === 0) {
    return avgMonthlyRevenue > 0 ? 75 : 0;
  }
  const ratio = avgMonthlyRevenue / medianRevenue;
  if (ratio >= 2) return 100;
  if (ratio >= 1) return 75;
  if (ratio >= 0.5) return 50;
  if (ratio > 0) return 25;
  return 0;
}

// Calculate trend score (0-100): month-over-month revenue growth
function calcTrend(currentMonthRevenue: number, previousMonthRevenue: number): number {
  if (previousMonthRevenue === 0 && currentMonthRevenue === 0) return 50;
  if (previousMonthRevenue === 0 && currentMonthRevenue > 0) return 100;
  if (previousMonthRevenue > 0 && currentMonthRevenue === 0) return 0;

  const growth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
  if (growth >= 20) return 100;
  if (growth >= 0) return 75;
  if (growth >= -20) return 50;
  if (growth >= -50) return 25;
  return 0;
}

// Calculate engagement score (0-100): interaction frequency in last 90 days
function calcEngagement(interactionsLast90Days: number): number {
  if (interactionsLast90Days >= 6) return 100;
  if (interactionsLast90Days >= 4) return 75;
  if (interactionsLast90Days >= 2) return 50;
  if (interactionsLast90Days >= 1) return 25;
  return 0;
}

// Calculate final health score from components
function calculateHealthScore(components: HealthScoreComponents): number {
  return Math.round(
    (components.recency * WEIGHTS.recency) +
    (components.frequency * WEIGHTS.frequency) +
    (components.monetary * WEIGHTS.monetary) +
    (components.trend * WEIGHTS.trend) +
    (components.engagement * WEIGHTS.engagement)
  );
}

// Batch fetch helper
async function batchFetch(table: string, select: string, filters?: Record<string, any>): Promise<any[]> {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from(table).select(select).range(from, to);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (key.startsWith('gte:')) {
          query = query.gte(key.slice(4), value);
        } else if (key.startsWith('lte:')) {
          query = query.lte(key.slice(4), value);
        } else {
          query = query.eq(key, value);
        }
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

// Hook: Get latest health score for a single client
export function useClientHealthScore(clientId: string) {
  return useQuery({
    queryKey: ['healthScore', clientId],
    queryFn: async () => {
      // Try to get cached score from today
      const today = new Date().toISOString().split('T')[0];
      const { data: cached, error: cacheError } = await supabase
        .from('client_health_scores')
        .select('*')
        .eq('client_id', clientId)
        .gte('calculated_at', `${today}T00:00:00`)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cacheError) throw cacheError;

      if (cached) {
        return cached as unknown as ClientHealthScore;
      }

      // Calculate fresh score
      const score = await calculateClientHealthScore(clientId);
      return score;
    },
    enabled: !!clientId,
  });
}

// Hook: Get health score summary across all clients (uses retention RPC)
export function useHealthScoresSummary() {
  return useQuery({
    queryKey: ['healthScores', 'summary'],
    queryFn: async (): Promise<HealthScoreSummary> => {
      const { data, error } = await supabase.rpc('get_retention_dashboard');
      if (error) throw error;

      const d = data as any;
      const hs = d.healthSummary || {};

      return {
        healthy: Number(hs.healthy) || 0,
        attention: Number(hs.attention) || 0,
        critical: Number(hs.critical) || 0,
        lost: Number(hs.lost) || 0,
        total: Number(hs.total) || 0,
        averageScore: Number(hs.averageScore) || 0,
      };
    },
  });
}

// Hook: Bulk calculate and persist health scores for all active clients
export function useBulkHealthScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<number> => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const lastMonthKey = lastMonth.toISOString().slice(0, 7);
      const twoMonthsAgoKey = twoMonthsAgo.toISOString().slice(0, 7);
      const sixMonthsAgoDate = sixMonthsAgo.toISOString().split('T')[0];
      const ninetyDaysAgoDate = ninetyDaysAgo.toISOString().split('T')[0];

      // Fetch all active clients
      const clients = await batchFetch('clients', 'id, name', { active: true });

      // Fetch all revenues from last 6 months
      const revenues = await batchFetch('revenues', 'client_id, date, our_share', {
        'gte:date': sixMonthsAgoDate,
      });

      // Fetch all interactions from last 90 days
      const interactions = await batchFetch('interactions', 'client_id, created_at', {
        'gte:created_at': `${ninetyDaysAgoDate}T00:00:00`,
      });

      // Group revenues by client
      const revenuesByClient = new Map<string, any[]>();
      for (const r of revenues) {
        const arr = revenuesByClient.get(r.client_id) || [];
        arr.push(r);
        revenuesByClient.set(r.client_id, arr);
      }

      // Group interactions by client
      const interactionsByClient = new Map<string, number>();
      for (const i of interactions) {
        if (i.client_id) {
          interactionsByClient.set(i.client_id, (interactionsByClient.get(i.client_id) || 0) + 1);
        }
      }

      // Calculate median monthly revenue for monetary score
      const allMonthlyAvgs: number[] = [];
      for (const [, clientRevs] of revenuesByClient) {
        const total = clientRevs.reduce((sum: number, r: any) => sum + Number(r.our_share), 0);
        allMonthlyAvgs.push(total / 6);
      }
      allMonthlyAvgs.sort((a, b) => a - b);
      const medianRevenue = allMonthlyAvgs.length > 0
        ? allMonthlyAvgs[Math.floor(allMonthlyAvgs.length / 2)]
        : 0;

      // Calculate scores for all clients
      const scoresToInsert: any[] = [];

      for (const client of clients) {
        const clientRevs = revenuesByClient.get(client.id) || [];
        const interactionCount = interactionsByClient.get(client.id) || 0;

        // Recency
        const sortedRevs = [...clientRevs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const daysSinceLastRevenue = sortedRevs.length > 0
          ? Math.floor((now.getTime() - new Date(sortedRevs[0].date).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Frequency
        const revenueCountLast6Months = clientRevs.length;

        // Monetary
        const totalRevenue = clientRevs.reduce((sum: number, r: any) => sum + Number(r.our_share), 0);
        const avgMonthlyRevenue = totalRevenue / 6;

        // Trend
        const currentMonthRevenue = clientRevs
          .filter((r: any) => r.date.startsWith(lastMonthKey))
          .reduce((sum: number, r: any) => sum + Number(r.our_share), 0);
        const previousMonthRevenue = clientRevs
          .filter((r: any) => r.date.startsWith(twoMonthsAgoKey))
          .reduce((sum: number, r: any) => sum + Number(r.our_share), 0);

        const components: HealthScoreComponents = {
          recency: calcRecency(daysSinceLastRevenue),
          frequency: calcFrequency(revenueCountLast6Months),
          monetary: calcMonetary(avgMonthlyRevenue, medianRevenue),
          trend: calcTrend(currentMonthRevenue, previousMonthRevenue),
          engagement: calcEngagement(interactionCount),
        };

        const score = calculateHealthScore(components);
        const classification = classifyScore(score);

        scoresToInsert.push({
          client_id: client.id,
          score,
          classification,
          components,
          calculated_at: now.toISOString(),
        });
      }

      // Batch insert scores (in chunks of 500 to avoid payload limits)
      const CHUNK_SIZE = 500;
      for (let i = 0; i < scoresToInsert.length; i += CHUNK_SIZE) {
        const chunk = scoresToInsert.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('client_health_scores').insert(chunk);
        if (error) throw error;
      }

      return scoresToInsert.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthScores'] });
      queryClient.invalidateQueries({ queryKey: ['healthScore'] });
    },
  });
}

// Calculate health score for a single client (used internally)
async function calculateClientHealthScore(clientId: string): Promise<ClientHealthScore> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const lastMonthKey = lastMonth.toISOString().slice(0, 7);
  const twoMonthsAgoKey = twoMonthsAgo.toISOString().slice(0, 7);

  // Fetch revenues for this client in last 6 months
  const { data: revenues, error: revError } = await supabase
    .from('revenues')
    .select('date, our_share')
    .eq('client_id', clientId)
    .gte('date', sixMonthsAgo.toISOString().split('T')[0]);

  if (revError) throw revError;

  // Fetch interactions for this client in last 90 days
  const { data: interactions, error: intError } = await supabase
    .from('interactions')
    .select('created_at')
    .eq('client_id', clientId)
    .gte('created_at', `${ninetyDaysAgo.toISOString().split('T')[0]}T00:00:00`);

  if (intError) throw intError;

  // Fetch median revenue for comparison (all clients, last 6 months)
  const { data: allRevenueData, error: allRevError } = await supabase
    .from('revenues')
    .select('client_id, our_share')
    .gte('date', sixMonthsAgo.toISOString().split('T')[0]);

  if (allRevError) throw allRevError;

  const revenueByClientMap = new Map<string, number>();
  for (const r of (allRevenueData || [])) {
    revenueByClientMap.set(r.client_id, (revenueByClientMap.get(r.client_id) || 0) + Number(r.our_share));
  }
  const allAvgs = Array.from(revenueByClientMap.values()).map(v => v / 6).sort((a, b) => a - b);
  const medianRevenue = allAvgs.length > 0 ? allAvgs[Math.floor(allAvgs.length / 2)] : 0;

  // Recency
  const sortedRevs = [...(revenues || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const daysSinceLastRevenue = sortedRevs.length > 0
    ? Math.floor((now.getTime() - new Date(sortedRevs[0].date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Frequency
  const revenueCountLast6Months = (revenues || []).length;

  // Monetary
  const totalRevenue = (revenues || []).reduce((sum, r) => sum + Number(r.our_share), 0);
  const avgMonthlyRevenue = totalRevenue / 6;

  // Trend
  const currentMonthRevenue = (revenues || [])
    .filter(r => r.date.startsWith(lastMonthKey))
    .reduce((sum, r) => sum + Number(r.our_share), 0);
  const previousMonthRevenue = (revenues || [])
    .filter(r => r.date.startsWith(twoMonthsAgoKey))
    .reduce((sum, r) => sum + Number(r.our_share), 0);

  const components: HealthScoreComponents = {
    recency: calcRecency(daysSinceLastRevenue),
    frequency: calcFrequency(revenueCountLast6Months),
    monetary: calcMonetary(avgMonthlyRevenue, medianRevenue),
    trend: calcTrend(currentMonthRevenue, previousMonthRevenue),
    engagement: calcEngagement((interactions || []).length),
  };

  const score = calculateHealthScore(components);
  const classification = classifyScore(score);

  // Persist the calculated score
  const { data: inserted, error: insertError } = await supabase
    .from('client_health_scores')
    .insert({
      client_id: clientId,
      score,
      classification,
      components,
      calculated_at: now.toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return inserted as unknown as ClientHealthScore;
}

// Export utility functions for use in other hooks
export { classifyScore, calculateHealthScore, calcRecency, calcFrequency, calcMonetary, calcTrend, calcEngagement };
