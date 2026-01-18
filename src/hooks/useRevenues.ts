import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Revenue } from '@/types/database';
import { PaginatedResult } from './useClients';

interface RevenueFilters {
  clientId?: string;
  productId?: string;
  subproductId?: string;
  startDate?: string;
  endDate?: string;
  assessorId?: string;
  partnerId?: string;
  page?: number;
  pageSize?: number;
}

// Paginated revenues for listing pages
export function useRevenuesPaginated(filters?: RevenueFilters): ReturnType<typeof useQuery<PaginatedResult<Revenue>>> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['revenues', 'paginated', filters],
    queryFn: async () => {
      let query = supabase
        .from('revenues')
        .select(`
          *,
          client:clients(*),
          product:products(*),
          subproduct:subproducts(*)
        `, { count: 'exact' })
        .order('date', { ascending: false })
        .range(from, to);

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters?.subproductId) {
        query = query.eq('subproduct_id', filters.subproductId);
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
        data: data as Revenue[],
        totalCount,
        totalPages,
      };
    },
  });
}

// Batch fetch all revenues to overcome 1000 record limit
async function fetchAllRevenuesWithRelations(filters?: Omit<RevenueFilters, 'page' | 'pageSize'>) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('revenues')
      .select(`
        *,
        client:clients(*),
        product:products(*),
        subproduct:subproducts(*)
      `)
      .order('date', { ascending: false })
      .range(from, to);

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }

    if (filters?.subproductId) {
      query = query.eq('subproduct_id', filters.subproductId);
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
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

  return allData as Revenue[];
}

// Non-paginated revenues for backwards compatibility
export function useRevenues(filters?: Omit<RevenueFilters, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['revenues', 'all', filters],
    queryFn: async () => fetchAllRevenuesWithRelations(filters),
  });
}

export function useRevenue(id: string) {
  return useQuery({
    queryKey: ['revenues', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenues')
        .select(`
          *,
          client:clients(*),
          product:products(*),
          subproduct:subproducts(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Revenue | null;
    },
    enabled: !!id,
  });
}

export function useCreateRevenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (revenue: Omit<Revenue, 'id' | 'created_at' | 'updated_at' | 'client' | 'product' | 'subproduct'>) => {
      const { data, error } = await supabase
        .from('revenues')
        .insert(revenue)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['revenues'] }),
  });
}

export function useUpdateRevenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...revenue }: Partial<Revenue> & { id: string }) => {
      const { data, error } = await supabase
        .from('revenues')
        .update(revenue)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['revenues'] }),
  });
}

export function useDeleteRevenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('revenues')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['revenues'] }),
  });
}

export function useImportRevenues() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (revenues: Omit<Revenue, 'id' | 'created_at' | 'updated_at' | 'client' | 'product' | 'subproduct'>[]) => {
      const { data, error } = await supabase
        .from('revenues')
        .insert(revenues)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['revenues'] }),
  });
}

// Batch fetch revenues for stats
async function fetchRevenuesForStats(filters?: RevenueFilters) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('revenues')
      .select(`
        date,
        our_share,
        product:products(name)
      `)
      .range(from, to);

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
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

// Aggregated revenue data
export function useRevenueStats(filters?: RevenueFilters) {
  return useQuery({
    queryKey: ['revenueStats', filters],
    queryFn: async () => {
      const data = await fetchRevenuesForStats(filters);

      // Group by month
      const byMonth: Record<string, number> = {};
      const byProduct: Record<string, number> = {};

      data?.forEach((r: any) => {
        const month = r.date.slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + Number(r.our_share);
        
        const productName = r.product?.name || 'Sem produto';
        byProduct[productName] = (byProduct[productName] || 0) + Number(r.our_share);
      });

      return {
        total: data?.reduce((sum, r) => sum + Number(r.our_share), 0) || 0,
        byMonth: Object.entries(byMonth).map(([month, value]) => ({ month, value })).sort((a, b) => a.month.localeCompare(b.month)),
        byProduct: Object.entries(byProduct).map(([name, value]) => ({ name, value })),
      };
    },
  });
}
