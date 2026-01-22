import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStatus } from '@/types/database';
import { differenceInDays } from 'date-fns';

export type LeadType = 'all' | 'new' | 'opportunity';

interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  assessorId?: string;
  originId?: string;
  campaignId?: string;
  partnerId?: string;
  startDate?: string;
  endDate?: string;
  leadType?: LeadType;
}

// Batch fetch all leads to overcome 1000 record limit
async function fetchAllLeadsWithRelations(filters?: LeadFilters) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('leads')
      .select(`
        *,
        origin:origins(*),
        campaign:campaigns(*),
        partner:partners(*),
        loss_reason:loss_reasons(*)
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.assessorId) {
      query = query.eq('assessor_id', filters.assessorId);
    }

    if (filters?.originId) {
      query = query.eq('origin_id', filters.originId);
    }

    if (filters?.campaignId) {
      query = query.eq('campaign_id', filters.campaignId);
    }

    if (filters?.partnerId) {
      query = query.eq('partner_id', filters.partnerId);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Filter by lead type (new leads vs opportunities)
    if (filters?.leadType === 'new') {
      query = query.is('client_id', null);
    } else if (filters?.leadType === 'opportunity') {
      query = query.not('client_id', 'is', null);
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

  return allData as Lead[];
}

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => fetchAllLeadsWithRelations(filters),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          origin:origins(*),
          campaign:campaigns(*),
          partner:partners(*),
          loss_reason:loss_reasons(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'origin' | 'campaign' | 'partner' | 'loss_reason' | 'assessor'>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...lead }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(lead)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useImportLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leads: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'origin' | 'campaign' | 'partner' | 'loss_reason' | 'assessor'>[]) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(leads)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
}

interface InteractionWithUser {
  id: string;
  lead_id: string;
  type: string;
  content: string;
  created_at: string;
  user_id: string;
  userName: string;
}

interface LeadMetrics {
  totalInteractions: number;
  lastInteraction: { created_at: string; type: string } | null;
  interactions: InteractionWithUser[];
  daysSinceLastInteraction: number | null;
}

export function useLeadMetrics(leadId: string) {
  return useQuery({
    queryKey: ['leadMetrics', leadId],
    queryFn: async (): Promise<LeadMetrics> => {
      // Fetch interactions for the lead
      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (interactionsError) throw interactionsError;

      // Get unique user ids
      const userIds = [...new Set((interactions || []).map(i => i.user_id))];
      
      let profilesMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);

        profilesMap = new Map((profiles || []).map(p => [p.user_id, p.name]));
      }

      const totalInteractions = interactions?.length || 0;
      const lastInteraction = interactions?.[0] || null;

      // Map interactions with user names
      const interactionsWithUser: InteractionWithUser[] = (interactions || []).map(i => ({
        id: i.id,
        lead_id: i.lead_id || '',
        type: i.type,
        content: i.content,
        created_at: i.created_at,
        user_id: i.user_id,
        userName: profilesMap.get(i.user_id) || 'Usuário',
      }));

      return {
        totalInteractions,
        lastInteraction: lastInteraction ? { created_at: lastInteraction.created_at, type: lastInteraction.type } : null,
        interactions: interactionsWithUser,
        daysSinceLastInteraction: lastInteraction
          ? differenceInDays(new Date(), new Date(lastInteraction.created_at))
          : null,
      };
    },
    enabled: !!leadId,
  });
}
