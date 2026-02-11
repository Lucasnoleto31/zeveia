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
        .insert(playbook as any)
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
        .update(updates as any)
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
      const { data, error } = await (supabase.rpc as any)('get_retention_dashboard');
      if (error) throw error;

      const d = data as any;

      // Map atRiskClients from RPC (simplified — no nextAction from RPC)
      const atRiskClients: RetentionDashboardData['atRiskClients'] = (d.atRiskClients || []).map((c: any) => ({
        clientId: c.clientId,
        clientName: c.clientName,
        clientType: c.clientType as 'pf' | 'pj',
        healthScore: Number(c.healthScore),
        classification: c.classification as RiskClassification,
        churnProbability: c.churnProbability != null ? Number(c.churnProbability) : null,
        activePlaybook: null,
        nextAction: null,
        assessorId: c.assessorId,
      }));

      return {
        clientsAtRisk: Number(d.clientsAtRisk) || 0,
        activePlaybooks: Number(d.activePlaybooks) || 0,
        actionsPending: Number(d.actionsPending) || 0,
        actionsCompleted: Number(d.actionsCompleted) || 0,
        retentionRate: Number(d.retentionRate) || 100,
        atRiskClients,
      };
    },
  });
}
