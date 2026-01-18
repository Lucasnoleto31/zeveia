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
}

export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          *,
          origin:origins(*),
          campaign:campaigns(*),
          partner:partners(*)
        `)
        .order('name');

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
      return data as Client[];
    },
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
        .single();
      if (error) throw error;
      return data as Client;
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

// Client metrics for 360 view
export function useClientMetrics(clientId: string) {
  return useQuery({
    queryKey: ['clientMetrics', clientId],
    queryFn: async () => {
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select('*, product:products(*)')
        .eq('client_id', clientId);

      if (revenuesError) throw revenuesError;

      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);

      if (productsError) throw productsError;

      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', clientId);

      if (contractsError) throw contractsError;

      const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.our_share), 0) || 0;
      
      // Current and previous month calculations
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
      
      const monthlyRevenue = revenues
        ?.filter(r => r.date.startsWith(currentMonth))
        .reduce((sum, r) => sum + Number(r.our_share), 0) || 0;
      
      const previousMonthRevenue = revenues
        ?.filter(r => r.date.startsWith(prevMonth))
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

      return {
        totalRevenue,
        monthlyRevenue,
        revenueChange,
        lastRevenueDate: lastRevenue,
        activeProducts,
        totalProducts,
        unusedProducts,
        revenueByMonth,
        revenueByProduct,
        totalContracts: contracts?.length || 0,
        totalLotsTraded: contracts?.reduce((sum, c) => sum + c.lots_traded, 0) || 0,
      };
    },
    enabled: !!clientId,
  });
}
