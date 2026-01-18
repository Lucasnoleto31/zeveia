import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types/database';
import { PaginatedResult } from './useClients';

interface ContractFilters {
  clientId?: string;
  assetId?: string;
  platformId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// Paginated contracts for listing pages
export function useContractsPaginated(filters?: ContractFilters): ReturnType<typeof useQuery<PaginatedResult<Contract>>> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['contracts', 'paginated', filters],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          client:clients(*),
          asset:assets(*),
          platform:platforms(*)
        `, { count: 'exact' })
        .order('date', { ascending: false })
        .range(from, to);

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

      const { data, error, count } = await query;
      if (error) throw error;
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      return {
        data: data as Contract[],
        totalCount,
        totalPages,
      };
    },
  });
}

// Non-paginated contracts for backwards compatibility
export function useContracts(filters?: Omit<ContractFilters, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['contracts', 'all', filters],
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
        .maybeSingle();
      if (error) throw error;
      return data as Contract | null;
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

// Batch fetch contracts for stats to overcome 1000 row limit
async function fetchContractsForStats(filters?: { startDate?: string; endDate?: string }) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('contracts')
      .select(`date, lots_traded, lots_zeroed, asset:assets(code)`)
      .range(from, to);

    if (filters?.startDate) query = query.gte('date', filters.startDate);
    if (filters?.endDate) query = query.lte('date', filters.endDate);

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

// Aggregated contract stats
export function useContractStats(filters?: ContractFilters) {
  return useQuery({
    queryKey: ['contractStats', filters],
    queryFn: async () => {
      // Use batch fetching to get ALL contracts
      const data = await fetchContractsForStats({
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      });

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
