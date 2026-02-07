import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InfluencerNegotiation } from '@/types/influencer';

export function useInfluencerNegotiations(influencerId: string | null) {
  return useQuery({
    queryKey: ['influencer-negotiations', influencerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_negotiations')
        .select('*')
        .eq('influencer_id', influencerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InfluencerNegotiation[];
    },
    enabled: !!influencerId,
  });
}

export function useCreateInfluencerNegotiation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (negotiation: Omit<InfluencerNegotiation, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('influencer_negotiations')
        .insert(negotiation)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['influencer-negotiations', variables.influencer_id],
      });
    },
  });
}

export function useUpdateInfluencerNegotiation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...negotiation }: Partial<InfluencerNegotiation> & { id: string }) => {
      const { data, error } = await supabase
        .from('influencer_negotiations')
        .update(negotiation)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as InfluencerNegotiation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['influencer-negotiations', data.influencer_id],
      });
    },
  });
}

export function useDeleteInfluencerNegotiation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, influencerId }: { id: string; influencerId: string }) => {
      const { error } = await supabase
        .from('influencer_negotiations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { influencerId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['influencer-negotiations', data.influencerId],
      });
    },
  });
}
