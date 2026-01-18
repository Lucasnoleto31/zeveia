import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/database';

interface ContractFilters {
  clientId?: string;
  assetId?: string;
  platformId?: string;
  startDate?: string;
  endDate?: string;
}

export function useContracts(filters?: ContractFilters) {
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          client:clients(*),
          asset:assets(*),
          platform:platforms(*)
        `)
        .order('date', { ascending: false });

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters?.assetId) {
        query = query.eq('asset_id', filters.assetId);
      }

      if (filters?.platformId) {
        query = query.eq('platform_id', filters.platformId);
      }

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contract[];
    },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contracts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:clients(*),
          asset:assets(*),
          platform:platforms(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Contract;
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contract: Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'client' | 'asset' | 'platform'>) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert(contract)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...contract }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(contract)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useImportContracts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contracts: Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'client' | 'asset' | 'platform'>[]) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert(contracts)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

// Aggregated contract stats
export function useContractStats(filters?: ContractFilters) {
  return useQuery({
    queryKey: ['contractStats', filters],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(`
          date,
          lots_traded,
          lots_zeroed,
          asset:assets(code)
        `);

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by month
      const byMonth: Record<string, { traded: number; zeroed: number }> = {};
      const byAsset: Record<string, { traded: number; zeroed: number }> = {};

      data?.forEach((c: any) => {
        const month = c.date.slice(0, 7);
        if (!byMonth[month]) byMonth[month] = { traded: 0, zeroed: 0 };
        byMonth[month].traded += c.lots_traded;
        byMonth[month].zeroed += c.lots_zeroed;

        const assetCode = c.asset?.code || 'Sem ativo';
        if (!byAsset[assetCode]) byAsset[assetCode] = { traded: 0, zeroed: 0 };
        byAsset[assetCode].traded += c.lots_traded;
        byAsset[assetCode].zeroed += c.lots_zeroed;
      });

      const totalTraded = data?.reduce((sum, c) => sum + c.lots_traded, 0) || 0;
      const totalZeroed = data?.reduce((sum, c) => sum + c.lots_zeroed, 0) || 0;

      return {
        totalTraded,
        totalZeroed,
        zeroRate: totalTraded > 0 ? (totalZeroed / totalTraded) * 100 : 0,
        byMonth: Object.entries(byMonth)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        byAsset: Object.entries(byAsset).map(([code, data]) => ({ code, ...data })),
      };
    },
  });
}
