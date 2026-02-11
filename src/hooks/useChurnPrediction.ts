import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ChurnEvent,
  ChurnRiskFactor,
  ChurnSummary,
  RiskClassification,
} from '@/types/retention';

// =====================================================
// Churn Events
// =====================================================

export interface ChurnEventFilters {
  clientId?: string;
  outcome?: string;
}

export function useChurnEvents(filters?: ChurnEventFilters) {
  return useQuery({
    queryKey: ['churnEvents', filters],
    queryFn: async () => {
      let query = supabase
        .from('churn_events')
        .select(`
          *,
          client:clients(id, name, company_name, type, assessor_id)
        `)
        .order('predicted_at', { ascending: false });

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters?.outcome) {
        query = query.eq('outcome', filters.outcome);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ChurnEvent[];
    },
  });
}

export function useCreateChurnEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Omit<ChurnEvent, 'id' | 'predicted_at' | 'client'>) => {
      const { data, error } = await supabase
        .from('churn_events')
        .insert(event as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ChurnEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churnEvents'] });
      queryClient.invalidateQueries({ queryKey: ['churnSummary'] });
    },
  });
}

export function useUpdateChurnEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChurnEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('churn_events')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ChurnEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churnEvents'] });
      queryClient.invalidateQueries({ queryKey: ['churnSummary'] });
    },
  });
}

export function useResolveChurnEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, outcome, actionTaken }: { id: string; outcome: 'retained' | 'churned'; actionTaken?: string }) => {
      const { data, error } = await supabase
        .from('churn_events')
        .update({
          outcome,
          action_taken: actionTaken || null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ChurnEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churnEvents'] });
      queryClient.invalidateQueries({ queryKey: ['churnSummary'] });
      queryClient.invalidateQueries({ queryKey: ['retentionDashboard'] });
    },
  });
}

// =====================================================
// Client Churn Risk (calculated from health score trend)
// =====================================================

export function useClientChurnRisk(clientId: string) {
  return useQuery({
    queryKey: ['churnRisk', clientId],
    queryFn: async () => {
      // Get last 3 health scores for this client to see the trend
      const { data: scores, error: scoresError } = await supabase
        .from('client_health_scores')
        .select('score, classification, components, calculated_at')
        .eq('client_id', clientId)
        .order('calculated_at', { ascending: false })
        .limit(3);

      if (scoresError) throw scoresError;

      if (!scores || scores.length === 0) {
        return {
          churnProbability: 0,
          riskFactors: [] as ChurnRiskFactor[],
          trend: 'stable' as 'improving' | 'stable' | 'declining',
          latestScore: null,
          latestClassification: null as RiskClassification | null,
        };
      }

      const latest = scores[0];
      const latestScore = Number(latest.score);
      const latestClassification = latest.classification as RiskClassification;
      const components = latest.components as any;

      // Calculate churn probability based on health score and trend
      let churnProbability = 0;
      if (latestScore >= 75) churnProbability = 5;
      else if (latestScore >= 50) churnProbability = 25;
      else if (latestScore >= 25) churnProbability = 60;
      else churnProbability = 85;

      // Adjust based on trend
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (scores.length >= 2) {
        const previousScore = Number(scores[1].score);
        const scoreDiff = latestScore - previousScore;
        if (scoreDiff > 5) {
          trend = 'improving';
          churnProbability = Math.max(0, churnProbability - 10);
        } else if (scoreDiff < -5) {
          trend = 'declining';
          churnProbability = Math.min(100, churnProbability + 15);
        }
      }

      // Build risk factors
      const riskFactors: ChurnRiskFactor[] = [];

      if (components?.recency !== undefined && components.recency < 50) {
        riskFactors.push({
          factor: 'Recência',
          severity: components.recency < 25 ? 'high' : 'medium',
          description: 'Cliente sem gerar receita recentemente',
        });
      }

      if (components?.frequency !== undefined && components.frequency < 50) {
        riskFactors.push({
          factor: 'Frequência',
          severity: components.frequency < 25 ? 'high' : 'medium',
          description: 'Baixa frequência de operações',
        });
      }

      if (components?.monetary !== undefined && components.monetary < 50) {
        riskFactors.push({
          factor: 'Valor monetário',
          severity: components.monetary < 25 ? 'high' : 'medium',
          description: 'Receita abaixo da mediana dos clientes',
        });
      }

      if (components?.trend !== undefined && components.trend < 50) {
        riskFactors.push({
          factor: 'Tendência',
          severity: components.trend < 25 ? 'high' : 'medium',
          description: 'Receita em queda comparado ao mês anterior',
        });
      }

      if (components?.engagement !== undefined && components.engagement < 50) {
        riskFactors.push({
          factor: 'Engajamento',
          severity: components.engagement < 25 ? 'high' : 'low',
          description: 'Poucas interações nos últimos 90 dias',
        });
      }

      if (trend === 'declining') {
        riskFactors.push({
          factor: 'Tendência de score',
          severity: 'high',
          description: 'Health score em declínio consistente',
        });
      }

      return {
        churnProbability: Math.round(churnProbability),
        riskFactors,
        trend,
        latestScore,
        latestClassification,
      };
    },
    enabled: !!clientId,
  });
}

// =====================================================
// Churn Summary (aggregate stats)
// =====================================================

export function useChurnSummary() {
  return useQuery({
    queryKey: ['churnSummary'],
    queryFn: async (): Promise<ChurnSummary> => {
      const { data: events, error } = await supabase
        .from('churn_events')
        .select('outcome, churn_probability');

      if (error) throw error;

      const all = events || [];
      const totalEvents = all.length;
      const pendingEvents = all.filter(e => !e.outcome || e.outcome === 'pending').length;
      const retainedCount = all.filter(e => e.outcome === 'retained').length;
      const churnedCount = all.filter(e => e.outcome === 'churned').length;
      const resolvedCount = retainedCount + churnedCount;
      const retentionRate = resolvedCount > 0
        ? Math.round((retainedCount / resolvedCount) * 100)
        : 100;
      const avgChurnProbability = totalEvents > 0
        ? Math.round(all.reduce((sum, e) => sum + Number(e.churn_probability), 0) / totalEvents)
        : 0;

      return {
        totalEvents,
        pendingEvents,
        retainedCount,
        churnedCount,
        retentionRate,
        avgChurnProbability,
      };
    },
  });
}
