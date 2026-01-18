import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Interaction } from '@/types/database';

interface InteractionFilters {
  clientId?: string;
  leadId?: string;
  userId?: string;
  type?: string;
  limit?: number;
}

// Batch fetch all interactions to overcome 1000 record limit
async function fetchAllInteractions(filters?: InteractionFilters) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  // If there's a limit specified, use it directly without batch fetching
  if (filters?.limit) {
    let query = supabase
      .from('interactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters.limit);

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.leadId) {
      query = query.eq('lead_id', filters.leadId);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Batch fetch without limit
  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('interactions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.leadId) {
      query = query.eq('lead_id', filters.leadId);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
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

export function useInteractions(filters?: InteractionFilters) {
  return useQuery({
    queryKey: ['interactions', filters],
    queryFn: async () => {
      const data = await fetchAllInteractions(filters);

      // Fetch profiles for user names
      const userIds = [...new Set(data?.map(i => i.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]));

      return (data || []).map(interaction => ({
        ...interaction,
        user: profilesMap.get(interaction.user_id) || null,
      })) as (Interaction & { user: { user_id: string; name: string; email: string } | null })[];
    },
    enabled: !!(filters?.clientId || filters?.leadId),
  });
}

export function useInteraction(id: string) {
  return useQuery({
    queryKey: ['interactions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Interaction | null;
    },
    enabled: !!id,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interaction: Omit<Interaction, 'id' | 'created_at' | 'client' | 'lead' | 'user'>) => {
      const { data, error } = await supabase
        .from('interactions')
        .insert(interaction)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['clientMetrics'] });
    },
  });
}

export function useUpdateInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...interaction }: Partial<Interaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('interactions')
        .update(interaction)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['clientMetrics'] });
    },
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['clientMetrics'] });
    },
  });
}

// Interaction types for the system
export const INTERACTION_TYPES = [
  { value: 'ligacao', label: 'Ligação', icon: '📞' },
  { value: 'email', label: 'E-mail', icon: '📧' },
  { value: 'reuniao', label: 'Reunião', icon: '👥' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'visita', label: 'Visita', icon: '🏢' },
  { value: 'nota', label: 'Nota', icon: '📝' },
] as const;

export type InteractionType = typeof INTERACTION_TYPES[number]['value'];
