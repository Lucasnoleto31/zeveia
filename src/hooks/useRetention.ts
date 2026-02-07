import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  RetentionPlaybook,
  RetentionAction,
  RetentionDashboardData,
  RiskClassification,
  PlaybookStep,
} from '@/types/retention';

// =====================================================
// Retention Playbooks CRUD
// =====================================================

export function useRetentionPlaybooks(classification?: RiskClassification) {
  return useQuery({
    queryKey: ['retentionPlaybooks', classification],
    queryFn: async () => {
      let query = supabase
        .from('retention_playbooks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (classification) {
        query = query.eq('risk_classification', classification);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RetentionPlaybook[];
    },
  });
}

export function useRetentionPlaybook(id: string) {
  return useQuery({
    queryKey: ['retentionPlaybooks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retention_playbooks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as RetentionPlaybook | null;
    },
    enabled: !!id,
  });
}

export function useCreatePlaybook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playbook: Omit<RetentionPlaybook, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('retention_playbooks')
        .insert(playbook)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as RetentionPlaybook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retentionPlaybooks'] });
    },
  });
}

export function useUpdatePlaybook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RetentionPlaybook> & { id: string }) => {
      const { data, error } = await supabase
        .from('retention_playbooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as RetentionPlaybook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retentionPlaybooks'] });
    },
  });
}

export function useDeletePlaybook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('retention_playbooks')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retentionPlaybooks'] });
    },
  });
}

// =====================================================
// Retention Actions CRUD
// =====================================================

export interface RetentionActionFilters {
  clientId?: string;
  status?: string;
  playbookId?: string;
  assignedTo?: string;
}

export function useRetentionActions(filters?: RetentionActionFilters) {
  return useQuery({
    queryKey: ['retentionActions', filters],
    queryFn: async () => {
      let query = supabase
        .from('retention_actions')
        .select(`
          *,
          client:clients(id, name, company_name, type, assessor_id),
          playbook:retention_playbooks(*)
        `)
        .order('due_date', { ascending: true });

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.playbookId) {
        query = query.eq('playbook_id', filters.playbookId);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RetentionAction[];
    },
  });
}

export function useClientRetentionActions(clientId: string) {
  return useQuery({
    queryKey: ['retentionActions', 'client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retention_actions')
        .select(`
          *,
          playbook:retention_playbooks(*)
        `)
        .eq('client_id', clientId)
        .order('step_order', { ascending: true });

      if (error) throw error;
      return data as unknown as RetentionAction[];
    },
    enabled: !!clientId,
  });
}

export function useCreateRetentionAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: Omit<RetentionAction, 'id' | 'created_at' | 'client' | 'playbook'>) => {
      const { data, error } = await supabase
        .from('retention_actions')
        .insert(action)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as RetentionAction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retentionActions'] });
      queryClient.invalidateQueries({ queryKey: ['retentionDashboard'] });
    },
  });
}

export function useUpdateRetentionAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RetentionAction> & { id: string }) => {
      const { data, error } = await supabase
        .from('retention_actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as RetentionAction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retentionActions'] });
      queryClient.invalidateQueries({ queryKey: ['retentionDashboard'] });
    },
  });
}

export function useCompleteRetentionAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('retention_actions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as RetentionAction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retentionActions'] });
      queryClient.invalidateQueries({ queryKey: ['retentionDashboard'] });
    },
  });
}

export function useSkipRetentionAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('retention_actions')
        .update({
          status: 'skipped',
          notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as RetentionAction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retentionActions'] });
      queryClient.invalidateQueries({ queryKey: ['retentionDashboard'] });
    },
  });
}

// Start a playbook for a client: creates all actions from playbook steps
export function useStartPlaybook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      playbookId,
      churnEventId,
      assignedTo,
    }: {
      clientId: string;
      playbookId: string;
      churnEventId?: string;
      assignedTo?: string;
    }) => {
      // Fetch playbook
      const { data: playbook, error: pbError } = await supabase
        .from('retention_playbooks')
        .select('*')
        .eq('id', playbookId)
        .single();

      if (pbError) throw pbError;
      if (!playbook) throw new Error('Playbook não encontrado');

      const steps = playbook.steps as unknown as PlaybookStep[];
      const now = new Date();

      const actions = steps.map((step) => {
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + step.deadline_days);

        return {
          client_id: clientId,
          playbook_id: playbookId,
          churn_event_id: churnEventId || null,
          step_order: step.order,
          action_type: step.action,
          description: step.description,
          status: 'pending',
          assigned_to: assignedTo || null,
          due_date: dueDate.toISOString(),
        };
      });

      const { data, error } = await supabase
        .from('retention_actions')
        .insert(actions)
        .select();

      if (error) throw error;
      return data as unknown as RetentionAction[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retentionActions'] });
      queryClient.invalidateQueries({ queryKey: ['retentionDashboard'] });
    },
  });
}

// =====================================================
// Retention Dashboard
// =====================================================

export function useRetentionDashboard() {
  return useQuery({
    queryKey: ['retentionDashboard'],
    queryFn: async (): Promise<RetentionDashboardData> => {
      // Fetch latest health scores (batch to handle >1000 rows)
      const scores: any[] = [];
      let page = 0;
      const PAGE_SIZE = 1000;
      while (true) {
        const { data, error: scoresError } = await supabase
          .from('client_health_scores')
          .select('client_id, score, classification')
          .order('calculated_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (scoresError) throw scoresError;
        if (data) scores.push(...data);
        if (!data || data.length < PAGE_SIZE) break;
        page++;
      }

      // Deduplicate: keep only latest per client
      const latestScores = new Map<string, { score: number; classification: RiskClassification }>();
      for (const s of (scores || [])) {
        if (!latestScores.has(s.client_id)) {
          latestScores.set(s.client_id, {
            score: Number(s.score),
            classification: s.classification as RiskClassification,
          });
        }
      }

      // Fetch all pending/active retention actions
      const { data: actions, error: actionsError } = await supabase
        .from('retention_actions')
        .select(`
          *,
          client:clients(id, name, company_name, type, assessor_id),
          playbook:retention_playbooks(id, name)
        `)
        .order('due_date', { ascending: true });

      if (actionsError) throw actionsError;

      const allActions = (actions || []) as unknown as RetentionAction[];
      const pendingActions = allActions.filter(a => a.status === 'pending');
      const completedActions = allActions.filter(a => a.status === 'completed');

      // Count unique active playbooks (clients with pending actions)
      const activePlaybookClients = new Set(pendingActions.map(a => `${a.client_id}-${a.playbook_id}`));

      // Churn events for retention rate
      const { data: churnEvents, error: churnError } = await supabase
        .from('churn_events')
        .select('outcome');

      if (churnError) throw churnError;

      const resolvedEvents = (churnEvents || []).filter(e => e.outcome === 'retained' || e.outcome === 'churned');
      const retainedCount = resolvedEvents.filter(e => e.outcome === 'retained').length;
      const retentionRate = resolvedEvents.length > 0
        ? Math.round((retainedCount / resolvedEvents.length) * 100)
        : 100;

      // Build at-risk clients list
      const atRiskClients: RetentionDashboardData['atRiskClients'] = [];
      const atRiskClassifications: RiskClassification[] = ['attention', 'critical', 'lost'];

      // Get client details for at-risk clients
      const atRiskClientIds = Array.from(latestScores.entries())
        .filter(([, s]) => atRiskClassifications.includes(s.classification))
        .map(([id]) => id);

      if (atRiskClientIds.length > 0) {
        // Fetch clients in chunks of 50 to avoid Supabase URL length limits
        const CHUNK_SIZE = 50;
        const allClients: any[] = [];
        for (let i = 0; i < atRiskClientIds.length; i += CHUNK_SIZE) {
          const chunk = atRiskClientIds.slice(i, i + CHUNK_SIZE);
          const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, company_name, type, assessor_id')
            .in('id', chunk)
            .eq('active', true);

          if (clientsError) throw clientsError;
          if (clients) allClients.push(...clients);
        }

        // Get churn events in chunks too
        const allChurnEvents: any[] = [];
        for (let i = 0; i < atRiskClientIds.length; i += CHUNK_SIZE) {
          const chunk = atRiskClientIds.slice(i, i + CHUNK_SIZE);
          const { data: churnEvts, error: ceError } = await supabase
            .from('churn_events')
            .select('client_id, churn_probability')
            .in('client_id', chunk)
            .order('predicted_at', { ascending: false });

          if (ceError) throw ceError;
          if (churnEvts) allChurnEvents.push(...churnEvts);
        }

        const latestChurn = new Map<string, number>();
        for (const ce of allChurnEvents) {
          if (!latestChurn.has(ce.client_id)) {
            latestChurn.set(ce.client_id, Number(ce.churn_probability));
          }
        }

        for (const client of allClients) {
          const scoreData = latestScores.get(client.id);
          if (!scoreData) continue;

          const clientActions = pendingActions.filter(a => a.client_id === client.id);
          const activePlaybook = clientActions.length > 0 && clientActions[0].playbook
            ? (clientActions[0].playbook as any).name
            : null;

          atRiskClients.push({
            clientId: client.id,
            clientName: client.type === 'pf' ? client.name : (client.company_name || client.name),
            clientType: client.type as 'pf' | 'pj',
            healthScore: scoreData.score,
            classification: scoreData.classification,
            churnProbability: latestChurn.get(client.id) || null,
            activePlaybook,
            nextAction: clientActions[0] || null,
            assessorId: client.assessor_id,
          });
        }

        // Sort by health score ascending (worst first)
        atRiskClients.sort((a, b) => a.healthScore - b.healthScore);
      }

      return {
        clientsAtRisk: atRiskClients.length,
        activePlaybooks: activePlaybookClients.size,
        actionsPending: pendingActions.length,
        actionsCompleted: completedActions.length,
        retentionRate,
        atRiskClients,
      };
    },
  });
}
