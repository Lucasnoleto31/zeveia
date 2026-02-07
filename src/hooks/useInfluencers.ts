import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InfluencerProfile, InfluencerStage } from '@/types/influencer';

interface InfluencerFilters {
  search?: string;
  stage?: InfluencerStage;
  niche?: string;
  assignedTo?: string;
}

async function fetchAllInfluencers(filters?: InfluencerFilters) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('influencer_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,instagram_handle.ilike.%${filters.search}%,youtube_channel.ilike.%${filters.search}%`
      );
    }

    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }

    if (filters?.niche) {
      query = query.contains('niche', [filters.niche]);
    }

    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
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

  return allData as InfluencerProfile[];
}

export function useInfluencers(filters?: InfluencerFilters) {
  return useQuery({
    queryKey: ['influencers', filters],
    queryFn: () => fetchAllInfluencers(filters),
  });
}

export function useInfluencer(id: string) {
  return useQuery({
    queryKey: ['influencers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as InfluencerProfile;
    },
    enabled: !!id,
  });
}

export function useCreateInfluencer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      influencer: Omit<InfluencerProfile, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const scoreData = calculateQualificationScore(influencer);
      const { data, error } = await supabase
        .from('influencer_profiles')
        .insert({ ...influencer, qualification_score: scoreData })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['influencers'] }),
  });
}

export function useUpdateInfluencer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...influencer }: Partial<InfluencerProfile> & { id: string }) => {
      // Recalculate score if relevant fields changed
      let payload: any = { ...influencer };
      if (
        influencer.instagram_followers !== undefined ||
        influencer.youtube_subscribers !== undefined ||
        influencer.twitter_followers !== undefined ||
        influencer.tiktok_followers !== undefined ||
        influencer.engagement_rate !== undefined ||
        influencer.niche !== undefined ||
        influencer.estimated_cpl !== undefined
      ) {
        // Fetch current data to merge
        const { data: current } = await supabase
          .from('influencer_profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (current) {
          const merged = { ...current, ...influencer };
          payload.qualification_score = calculateQualificationScore(merged);
        }
      }
      const { data, error } = await supabase
        .from('influencer_profiles')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['influencers'] }),
  });
}

export function useDeleteInfluencer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('influencer_profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['influencers'] }),
  });
}

export function useUpdateInfluencerStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: InfluencerStage }) => {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .update({ stage })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['influencers'] }),
  });
}

/**
 * Calculate qualification score (0-100) based on:
 * - Social reach (30%): normalize total followers
 * - Engagement (25%): engagement_rate score
 * - Niche fit (20%): bonus for 'day_trade', 'swing_trade' niches
 * - Content quality (15%): manual score (using engagement as proxy if not available)
 * - Cost efficiency (10%): inverse of estimated_cpl
 */
export function calculateQualificationScore(
  influencer: Partial<InfluencerProfile>
): number {
  let score = 0;

  // 1. Social Reach (30%) - normalize followers to 0-100
  const totalFollowers =
    (influencer.instagram_followers || 0) +
    (influencer.youtube_subscribers || 0) +
    (influencer.twitter_followers || 0) +
    (influencer.tiktok_followers || 0);

  // Scoring tiers for total followers
  let reachScore = 0;
  if (totalFollowers >= 1000000) reachScore = 100;
  else if (totalFollowers >= 500000) reachScore = 90;
  else if (totalFollowers >= 200000) reachScore = 80;
  else if (totalFollowers >= 100000) reachScore = 70;
  else if (totalFollowers >= 50000) reachScore = 60;
  else if (totalFollowers >= 20000) reachScore = 50;
  else if (totalFollowers >= 10000) reachScore = 40;
  else if (totalFollowers >= 5000) reachScore = 30;
  else if (totalFollowers >= 1000) reachScore = 20;
  else if (totalFollowers > 0) reachScore = 10;

  score += reachScore * 0.3;

  // 2. Engagement (25%) - engagement_rate scoring
  const engagementRate = Number(influencer.engagement_rate) || 0;
  let engagementScore = 0;
  if (engagementRate >= 10) engagementScore = 100;
  else if (engagementRate >= 7) engagementScore = 90;
  else if (engagementRate >= 5) engagementScore = 80;
  else if (engagementRate >= 3) engagementScore = 60;
  else if (engagementRate >= 2) engagementScore = 40;
  else if (engagementRate >= 1) engagementScore = 20;
  else if (engagementRate > 0) engagementScore = 10;

  score += engagementScore * 0.25;

  // 3. Niche Fit (20%) - bonus for relevant niches
  const niches = influencer.niche || [];
  const highValueNiches = ['day_trade', 'swing_trade', 'options'];
  const mediumValueNiches = ['crypto', 'stocks', 'forex'];
  let nicheScore = 0;

  const hasHighValue = niches.some((n) => highValueNiches.includes(n));
  const hasMediumValue = niches.some((n) => mediumValueNiches.includes(n));

  if (hasHighValue && hasMediumValue) nicheScore = 100;
  else if (hasHighValue) nicheScore = 80;
  else if (hasMediumValue) nicheScore = 60;
  else if (niches.length > 0) nicheScore = 30;

  score += nicheScore * 0.2;

  // 4. Content Quality (15%) - use engagement rate as proxy
  // In future, this could be a manual input field
  const contentScore = Math.min(engagementScore * 1.1, 100);
  score += contentScore * 0.15;

  // 5. Cost Efficiency (10%) - inverse of CPL
  const cpl = Number(influencer.estimated_cpl) || 0;
  let costScore = 0;
  if (cpl > 0) {
    if (cpl <= 5) costScore = 100;
    else if (cpl <= 10) costScore = 90;
    else if (cpl <= 20) costScore = 75;
    else if (cpl <= 50) costScore = 50;
    else if (cpl <= 100) costScore = 30;
    else costScore = 10;
  }

  score += costScore * 0.1;

  return Math.round(Math.min(score, 100) * 100) / 100;
}

// Helper to get main platform info
export function getMainPlatform(influencer: InfluencerProfile): {
  platform: string;
  handle: string;
  followers: number;
} {
  const platforms = [
    {
      platform: 'Instagram',
      handle: influencer.instagram_handle || '',
      followers: influencer.instagram_followers || 0,
    },
    {
      platform: 'YouTube',
      handle: influencer.youtube_channel || '',
      followers: influencer.youtube_subscribers || 0,
    },
    {
      platform: 'Twitter',
      handle: influencer.twitter_handle || '',
      followers: influencer.twitter_followers || 0,
    },
    {
      platform: 'TikTok',
      handle: influencer.tiktok_handle || '',
      followers: influencer.tiktok_followers || 0,
    },
  ].filter((p) => p.followers > 0);

  if (platforms.length === 0) {
    return { platform: '-', handle: '-', followers: 0 };
  }

  return platforms.sort((a, b) => b.followers - a.followers)[0];
}

export function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}
