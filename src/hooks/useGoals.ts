import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types/database';

interface GoalFilters {
  assessorId?: string;
  year?: number;
  month?: number;
  type?: string;
  isOfficeGoal?: boolean;
}

// Batch fetch all goals to overcome 1000 record limit
async function fetchAllGoals(filters?: GoalFilters) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('goals')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .range(from, to);

    if (filters?.assessorId) {
      query = query.eq('assessor_id', filters.assessorId);
    }

    if (filters?.year) {
      query = query.eq('year', filters.year);
    }

    if (filters?.month) {
      query = query.eq('month', filters.month);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.isOfficeGoal !== undefined) {
      query = query.eq('is_office_goal', filters.isOfficeGoal);
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

  return allData as Goal[];
}

export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: ['goals', filters],
    queryFn: async () => fetchAllGoals(filters),
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Goal;
    },
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'assessor'>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...goal }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(goal)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpsertGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'assessor'>) => {
      const { data, error } = await supabase
        .from('goals')
        .upsert(goal, {
          onConflict: 'assessor_id,year,month,type',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

// Get goal progress with actual values
export function useGoalProgress(year: number, month: number, assessorId?: string) {
  return useQuery({
    queryKey: ['goalProgress', year, month, assessorId],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Fetch goals
      let goalsQuery = supabase
        .from('goals')
        .select('*')
        .eq('year', year)
        .eq('month', month);

      if (assessorId) {
        goalsQuery = goalsQuery.or(`assessor_id.eq.${assessorId},is_office_goal.eq.true`);
      }

      const { data: goals, error: goalsError } = await goalsQuery;
      if (goalsError) throw goalsError;

      // Fetch leads converted in the month (status = 'convertido')
      let leadsConvertedQuery = supabase
        .from('leads')
        .select('id, assessor_id')
        .eq('status', 'convertido')
        .gte('updated_at', startDate)
        .lte('updated_at', endDate + 'T23:59:59');

      if (assessorId) {
        leadsConvertedQuery = leadsConvertedQuery.eq('assessor_id', assessorId);
      }

      const { data: leadsConverted, error: leadsError } = await leadsConvertedQuery;
      if (leadsError) throw leadsError;

      // Fetch revenues in the month (with client_id for active clients count)
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select('our_share, client_id, client:clients!inner(assessor_id)')
        .gte('date', startDate)
        .lte('date', endDate);

      if (revenuesError) throw revenuesError;

      // Fetch contracts in the month
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('lots_traded, client:clients!inner(assessor_id)')
        .gte('date', startDate)
        .lte('date', endDate);

      if (contractsError) throw contractsError;

      // Active clients = unique clients that generated revenue in the month
      // (derived from revenues already fetched above)

      // Calculate actuals
      const calculateActual = (type: string, forAssessorId?: string | null) => {
        switch (type) {
          case 'clients_converted':
            // Leads converted in the month
            return forAssessorId
              ? leadsConverted?.filter(l => l.assessor_id === forAssessorId).length || 0
              : leadsConverted?.length || 0;
          case 'revenue':
            if (forAssessorId) {
              return revenues?.filter((r: any) => r.client?.assessor_id === forAssessorId)
                .reduce((sum, r) => sum + Number(r.our_share), 0) || 0;
            }
            return revenues?.reduce((sum, r) => sum + Number(r.our_share), 0) || 0;
          case 'lots_traded':
            if (forAssessorId) {
              return contracts?.filter((c: any) => c.client?.assessor_id === forAssessorId)
                .reduce((sum, c) => sum + c.lots_traded, 0) || 0;
            }
            return contracts?.reduce((sum, c) => sum + c.lots_traded, 0) || 0;
          case 'active_clients':
            // Unique clients that generated revenue in the month
            if (forAssessorId) {
              const clientIdsWithRevenue = revenues
                ?.filter((r: any) => r.client?.assessor_id === forAssessorId)
                .map((r: any) => r.client_id) || [];
              return new Set(clientIdsWithRevenue).size;
            }
            const allClientIdsWithRevenue = revenues?.map((r: any) => r.client_id) || [];
            return new Set(allClientIdsWithRevenue).size;
          default:
            return 0;
        }
      };

      // Map goals with progress
      const goalsWithProgress = goals?.map(goal => {
        const actual = calculateActual(
          goal.type,
          goal.is_office_goal ? null : goal.assessor_id
        );
        const progress = goal.target_value > 0 
          ? Math.min((actual / Number(goal.target_value)) * 100, 100)
          : 0;

        return {
          ...goal,
          actual,
          progress,
        };
      }) || [];

      return goalsWithProgress;
    },
  });
}

export const GOAL_TYPES = [
  { value: 'clients_converted', label: 'Clientes Convertidos', unit: '' },
  { value: 'revenue', label: 'Receita', unit: 'R$' },
  { value: 'lots_traded', label: 'Lotes Operados', unit: '' },
  { value: 'active_clients', label: 'Clientes Ativos', unit: '' },
];
