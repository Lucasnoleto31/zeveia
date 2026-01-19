import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientType, InvestorProfile } from '@/types/database';

interface ClientFilters {
  search?: string;
  type?: ClientType;
  assessorId?: string;
  profile?: InvestorProfile;
  state?: string;
  partnerId?: string;
  active?: boolean;
  minPatrimony?: number;
  maxPatrimony?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
}

// Paginated clients for listing pages
export function useClientsPaginated(filters?: ClientFilters): ReturnType<typeof useQuery<PaginatedResult<Client>>> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['clients', 'paginated', filters],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          *,
          origin:origins(*),
          campaign:campaigns(*),
          partner:partners(*)
        `, { count: 'exact' })
        .order('name')
        .range(from, to);

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.assessorId) {
        query = query.eq('assessor_id', filters.assessorId);
      }

      if (filters?.profile) {
        query = query.eq('profile', filters.profile);
      }

      if (filters?.state) {
        query = query.eq('state', filters.state);
      }

      if (filters?.partnerId) {
        query = query.eq('partner_id', filters.partnerId);
      }

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      if (filters?.minPatrimony !== undefined) {
        query = query.gte('patrimony', filters.minPatrimony);
      }

      if (filters?.maxPatrimony !== undefined) {
        query = query.lte('patrimony', filters.maxPatrimony);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      return {
        data: data as Client[],
        totalCount,
        totalPages,
      };
    },
  });
}

// Batch fetch all clients to overcome 1000 record limit
async function fetchAllClientsWithRelations(filters?: Omit<ClientFilters, 'page' | 'pageSize'>) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('clients')
      .select(`
        *,
        origin:origins(*),
        campaign:campaigns(*),
        partner:partners(*)
      `)
      .order('name')
      .range(from, to);

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.assessorId) {
      query = query.eq('assessor_id', filters.assessorId);
    }

    if (filters?.profile) {
      query = query.eq('profile', filters.profile);
    }

    if (filters?.state) {
      query = query.eq('state', filters.state);
    }

    if (filters?.partnerId) {
      query = query.eq('partner_id', filters.partnerId);
    }

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }

    if (filters?.minPatrimony !== undefined) {
      query = query.gte('patrimony', filters.minPatrimony);
    }

    if (filters?.maxPatrimony !== undefined) {
      query = query.lte('patrimony', filters.maxPatrimony);
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

  return allData as Client[];
}

// Non-paginated clients for dropdowns, imports, etc.
export function useClients(filters?: Omit<ClientFilters, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['clients', 'all', filters],
    queryFn: async () => fetchAllClientsWithRelations(filters),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          origin:origins(*),
          campaign:campaigns(*),
          partner:partners(*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Client | null;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'origin' | 'campaign' | 'partner' | 'assessor'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useImportClients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clients: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'origin' | 'campaign' | 'partner' | 'assessor'>[]) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(clients)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useBulkUpdateClients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; patrimony?: number | null; [key: string]: any }[]) => {
      const results = [];
      for (const update of updates) {
        const { id, ...data } = update;
        const { data: result, error } = await supabase
          .from('clients')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        results.push(result);
      }
      return results;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

// Helper function for batch fetching client data
async function batchFetchByClientId(
  table: 'revenues' | 'contracts' | 'platform_costs',
  clientId: string,
  selectFields: string
): Promise<any[]> {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from(table)
      .select(selectFields)
      .eq('client_id', clientId)
      .range(from, to);

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

// Client metrics for 360 view
export function useClientMetrics(clientId: string) {
  return useQuery({
    queryKey: ['clientMetrics', clientId],
    queryFn: async () => {
      // Batch fetch revenues (unlimited)
      const revenues = await batchFetchByClientId(
        'revenues',
        clientId,
        '*, product:products(*)'
      );

      // Fetch all products
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);

      if (productsError) throw productsError;

      // Batch fetch contracts (unlimited)
      const contracts = await batchFetchByClientId(
        'contracts',
        clientId,
        '*, asset:assets(*)'
      );

      // Batch fetch platform costs (unlimited)
      const platformCosts = await batchFetchByClientId(
        'platform_costs',
        clientId,
        '*, platform:platforms(*)'
      );

      // Fetch interactions
      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (interactionsError) throw interactionsError;

      // Get user profiles for interactions
      const userIds = [...new Set(interactions?.map(i => i.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p.name]));

      const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.our_share), 0) || 0;
      
      // Use last closed month as reference (current month is not finalized)
      const now = new Date();
      const lastClosedMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 7);
      
      // Revenue from last closed month
      const monthlyRevenue = revenues
        ?.filter(r => r.date.startsWith(lastClosedMonth))
        .reduce((sum, r) => sum + Number(r.our_share), 0) || 0;
      
      // Revenue from two months ago (for comparison)
      const previousMonthRevenue = revenues
        ?.filter(r => r.date.startsWith(twoMonthsAgo))
        .reduce((sum, r) => sum + Number(r.our_share), 0) || 0;
      
      // Calculate revenue change percentage
      const revenueChange = previousMonthRevenue > 0 
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : monthlyRevenue > 0 ? 100 : 0;

      const lastRevenue = revenues?.length 
        ? revenues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date 
        : null;

      // Products used by client
      const usedProductIds = new Set(revenues?.map(r => r.product_id).filter(Boolean));
      const activeProducts = usedProductIds.size;
      const totalProducts = allProducts?.length || 0;
      
      // Cross-selling opportunities (unused products)
      const unusedProducts = allProducts?.filter(p => !usedProductIds.has(p.id)) || [];

      // Revenue by month for chart (last 12 months)
      const revenueByMonth: { month: string; value: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
        const monthValue = revenues
          ?.filter(r => r.date.startsWith(monthKey))
          .reduce((sum, r) => sum + Number(r.our_share), 0) || 0;
        revenueByMonth.push({ month: monthLabel, value: monthValue });
      }

      // Revenue by product for donut chart
      const revenueByProductMap = new Map<string, { name: string; value: number }>();
      revenues?.forEach(r => {
        const productName = r.product?.name || 'Outros';
        const existing = revenueByProductMap.get(productName);
        if (existing) {
          existing.value += Number(r.our_share);
        } else {
          revenueByProductMap.set(productName, { name: productName, value: Number(r.our_share) });
        }
      });
      const revenueByProduct = Array.from(revenueByProductMap.values()).sort((a, b) => b.value - a.value);

      // --- Contract/Operations Stats ---
      const totalLotsTraded = contracts?.reduce((sum, c) => sum + (c.lots_traded || 0), 0) || 0;
      const totalLotsZeroed = contracts?.reduce((sum, c) => sum + (c.lots_zeroed || 0), 0) || 0;
      const zeroRate = totalLotsTraded > 0 ? (totalLotsZeroed / totalLotsTraded) * 100 : 0;

      // Lots from last closed month
      const monthlyLotsTraded = contracts
        ?.filter(c => c.date.startsWith(lastClosedMonth))
        .reduce((sum, c) => sum + (c.lots_traded || 0), 0) || 0;
      const prevMonthLotsTraded = contracts
        ?.filter(c => c.date.startsWith(twoMonthsAgo))
        .reduce((sum, c) => sum + (c.lots_traded || 0), 0) || 0;
      const lotsChange = prevMonthLotsTraded > 0 
        ? ((monthlyLotsTraded - prevMonthLotsTraded) / prevMonthLotsTraded) * 100 
        : monthlyLotsTraded > 0 ? 100 : 0;

      // Lots by asset
      const lotsByAssetMap = new Map<string, { name: string; traded: number; zeroed: number }>();
      contracts?.forEach(c => {
        const assetCode = c.asset?.code || 'Outros';
        const existing = lotsByAssetMap.get(assetCode);
        if (existing) {
          existing.traded += c.lots_traded || 0;
          existing.zeroed += c.lots_zeroed || 0;
        } else {
          lotsByAssetMap.set(assetCode, { name: assetCode, traded: c.lots_traded || 0, zeroed: c.lots_zeroed || 0 });
        }
      });
      const lotsByAsset = Array.from(lotsByAssetMap.values()).sort((a, b) => b.traded - a.traded);

      // Lots by month (last 12 months)
      const lotsByMonth: { month: string; traded: number; zeroed: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
        const traded = contracts
          ?.filter(c => c.date.startsWith(monthKey))
          .reduce((sum, c) => sum + (c.lots_traded || 0), 0) || 0;
        const zeroed = contracts
          ?.filter(c => c.date.startsWith(monthKey))
          .reduce((sum, c) => sum + (c.lots_zeroed || 0), 0) || 0;
        lotsByMonth.push({ month: monthLabel, traded, zeroed });
      }

      // --- Platform Costs Stats ---
      const totalPlatformCost = platformCosts?.reduce((sum, pc) => sum + Number(pc.value), 0) || 0;
      // Platform cost from last closed month
      const monthlyPlatformCost = platformCosts
        ?.filter(pc => pc.date.startsWith(lastClosedMonth))
        .reduce((sum, pc) => sum + Number(pc.value), 0) || 0;
      const prevMonthPlatformCost = platformCosts
        ?.filter(pc => pc.date.startsWith(twoMonthsAgo))
        .reduce((sum, pc) => sum + Number(pc.value), 0) || 0;
      const platformCostChange = prevMonthPlatformCost > 0 
        ? ((monthlyPlatformCost - prevMonthPlatformCost) / prevMonthPlatformCost) * 100 
        : monthlyPlatformCost > 0 ? 100 : 0;

      // Platforms used
      const platformsUsed = new Set(platformCosts?.map(pc => pc.platform_id)).size;

      // Cost by platform
      const costByPlatformMap = new Map<string, { name: string; value: number }>();
      platformCosts?.forEach(pc => {
        const platformName = pc.platform?.name || 'Outros';
        const existing = costByPlatformMap.get(platformName);
        if (existing) {
          existing.value += Number(pc.value);
        } else {
          costByPlatformMap.set(platformName, { name: platformName, value: Number(pc.value) });
        }
      });
      const costByPlatform = Array.from(costByPlatformMap.values()).sort((a, b) => b.value - a.value);

      // Cost by month (last 12 months)
      const costByMonth: { month: string; value: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
        const cost = platformCosts
          ?.filter(pc => pc.date.startsWith(monthKey))
          .reduce((sum, pc) => sum + Number(pc.value), 0) || 0;
        costByMonth.push({ month: monthLabel, value: cost });
      }

      // Average monthly cost (only months with data)
      const monthsWithCost = costByMonth.filter(m => m.value > 0).length;
      const avgMonthlyCost = monthsWithCost > 0 ? totalPlatformCost / monthsWithCost : 0;

      // --- Interactions Stats ---
      const interactionsWithUsers = interactions?.map(i => ({
        ...i,
        userName: profilesMap.get(i.user_id) || 'Desconhecido',
      })) || [];

      const lastInteraction = interactions?.[0] || null;

      return {
        // Revenue metrics
        totalRevenue,
        monthlyRevenue,
        revenueChange,
        lastRevenueDate: lastRevenue,
        activeProducts,
        totalProducts,
        unusedProducts,
        revenueByMonth,
        revenueByProduct,
        // Contract/Operations metrics
        totalContracts: contracts?.length || 0,
        totalLotsTraded,
        totalLotsZeroed,
        zeroRate,
        monthlyLotsTraded,
        lotsChange,
        lotsByAsset,
        lotsByMonth,
        // Platform costs metrics
        totalPlatformCost,
        monthlyPlatformCost,
        platformCostChange,
        platformsUsed,
        avgMonthlyCost,
        costByPlatform,
        costByMonth,
        // Interactions
        interactions: interactionsWithUsers,
        lastInteraction,
        totalInteractions: interactions?.length || 0,
      };
    },
    enabled: !!clientId,
  });
}
