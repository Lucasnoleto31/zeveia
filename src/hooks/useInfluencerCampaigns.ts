import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InfluencerCampaign } from '@/types/influencer';

export function useInfluencerCampaigns(influencerId: string | null) {
  return useQuery({
    queryKey: ['influencer-campaigns', influencerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_campaigns')
        .select('*')
        .eq('influencer_id', influencerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InfluencerCampaign[];
    },
    enabled: !!influencerId,
  });
}

export function useInfluencerCampaign(id: string) {
  return useQuery({
    queryKey: ['influencer-campaigns', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_campaigns')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as InfluencerCampaign;
    },
    enabled: !!id,
  });
}

export function useCreateInfluencerCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Omit<InfluencerCampaign, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('influencer_campaigns')
        .insert(campaign)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['influencer-campaigns', variables.influencer_id] });
      queryClient.invalidateQueries({ queryKey: ['influencer-campaigns-summary'] });
    },
  });
}

export function useUpdateInfluencerCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...campaign }: Partial<InfluencerCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('influencer_campaigns')
        .update(campaign)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as InfluencerCampaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['influencer-campaigns', data.influencer_id] });
      queryClient.invalidateQueries({ queryKey: ['influencer-campaigns-summary'] });
    },
  });
}

export function useDeleteInfluencerCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, influencerId }: { id: string; influencerId: string }) => {
      const { error } = await supabase
        .from('influencer_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { influencerId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['influencer-campaigns', data.influencerId] });
      queryClient.invalidateQueries({ queryKey: ['influencer-campaigns-summary'] });
    },
  });
}

// Performance summary per influencer
export interface CampaignSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalCost: number;
  totalLeads: number;
  totalAccounts: number;
  totalRevenue: number;
  avgROI: number;
}

export function useInfluencerCampaignSummary(influencerId: string | null) {
  return useQuery({
    queryKey: ['influencer-campaigns-summary', influencerId],
    queryFn: async (): Promise<CampaignSummary> => {
      const { data, error } = await supabase
        .from('influencer_campaigns')
        .select('*')
        .eq('influencer_id', influencerId!);
      if (error) throw error;

      const campaigns = data as InfluencerCampaign[];

      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
      const totalBudget = campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
      const totalCost = campaigns.reduce((sum, c) => sum + (Number(c.actual_cost) || 0), 0);
      const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0);
      const totalAccounts = campaigns.reduce((sum, c) => sum + (c.accounts_opened || 0), 0);
      const totalRevenue = campaigns.reduce((sum, c) => sum + (Number(c.revenue_generated) || 0), 0);
      const avgROI = totalCost > 0 ? totalRevenue / totalCost : 0;

      return {
        totalCampaigns,
        activeCampaigns,
        totalBudget,
        totalCost,
        totalLeads,
        totalAccounts,
        totalRevenue,
        avgROI,
      };
    },
    enabled: !!influencerId,
  });
}

// ROI calculation helper
export function calculateCampaignROI(campaign: InfluencerCampaign): number {
  const cost = Number(campaign.actual_cost) || 0;
  const revenue = Number(campaign.revenue_generated) || 0;
  if (cost === 0) return 0;
  return revenue / cost;
}
