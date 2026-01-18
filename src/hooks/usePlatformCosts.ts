import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlatformCost } from '@/types/database';
import { PaginatedResult } from './useClients';

interface PlatformCostFilters {
  clientId?: string;
  platformId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// Paginated platform costs for listing pages
export function usePlatformCostsPaginated(filters?: PlatformCostFilters): ReturnType<typeof useQuery<PaginatedResult<PlatformCost>>> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['platformCosts', 'paginated', filters],
    queryFn: async () => {
      let query = supabase
        .from('platform_costs')
        .select(`
          *,
          client:clients(*),
          platform:platforms(*)
        `, { count: 'exact' })
        .order('date', { ascending: false })
        .range(from, to);

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
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
        data: data as PlatformCost[],
        totalCount,
        totalPages,
      };
    },
  });
}

// Non-paginated platform costs for backwards compatibility
export function usePlatformCosts(filters?: Omit<PlatformCostFilters, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['platformCosts', 'all', filters],
    queryFn: async () => {
      let query = supabase
        .from('platform_costs')
        .select(`
          *,
          client:clients(*),
          platform:platforms(*)
        `)
        .order('date', { ascending: false });

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
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
      return data as PlatformCost[];
    },
  });
}

export function usePlatformCost(id: string) {
  return useQuery({
    queryKey: ['platformCosts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_costs')
        .select(`
          *,
          client:clients(*),
          platform:platforms(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as PlatformCost | null;
    },
    enabled: !!id,
  });
}

export function useCreatePlatformCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cost: Omit<PlatformCost, 'id' | 'created_at' | 'updated_at' | 'client' | 'platform'>) => {
      const { data, error } = await supabase
        .from('platform_costs')
        .insert(cost)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformCosts'] }),
  });
}

export function useUpdatePlatformCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...cost }: Partial<PlatformCost> & { id: string }) => {
      const { data, error } = await supabase
        .from('platform_costs')
        .update(cost)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformCosts'] }),
  });
}

export function useDeletePlatformCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_costs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformCosts'] }),
  });
}

export function useImportPlatformCosts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (costs: Omit<PlatformCost, 'id' | 'created_at' | 'updated_at' | 'client' | 'platform'>[]) => {
      const { data, error } = await supabase
        .from('platform_costs')
        .insert(costs)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformCosts'] }),
  });
}

// Aggregated platform cost stats
export function usePlatformCostStats(filters?: PlatformCostFilters) {
  return useQuery({
    queryKey: ['platformCostStats', filters],
    queryFn: async () => {
      let query = supabase
        .from('platform_costs')
        .select(`
          date,
          value,
          platform:platforms(name)
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
      const byMonth: Record<string, number> = {};
      const byPlatform: Record<string, number> = {};

      data?.forEach((c: any) => {
        const month = c.date.slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + Number(c.value);

        const platformName = c.platform?.name || 'Sem plataforma';
        byPlatform[platformName] = (byPlatform[platformName] || 0) + Number(c.value);
      });

      return {
        total: data?.reduce((sum, c) => sum + Number(c.value), 0) || 0,
        byMonth: Object.entries(byMonth)
          .map(([month, value]) => ({ month, value }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        byPlatform: Object.entries(byPlatform).map(([name, value]) => ({ name, value })),
      };
    },
  });
}
