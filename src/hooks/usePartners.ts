import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Partner, PartnerType } from '@/types/database';

interface PartnerFilters {
  search?: string;
  type?: PartnerType;
  active?: boolean;
}

// Batch fetch all partners to overcome 1000 record limit
async function fetchAllPartners(filters?: PartnerFilters) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('partners')
      .select('*')
      .order('name')
      .range(from, to);

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
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

  return allData as Partner[];
}

export function usePartners(filters?: PartnerFilters) {
  return useQuery({
    queryKey: ['partners', filters],
    queryFn: async () => fetchAllPartners(filters),
  });
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: ['partners', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partner: Omit<Partner, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('partners')
        .insert(partner)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...partner }: Partial<Partner> & { id: string }) => {
      const { data, error } = await supabase
        .from('partners')
        .update(partner)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  });
}

export function useImportPartners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (partners: Omit<Partner, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('partners')
        .insert(partners)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partners'] }),
  });
}
