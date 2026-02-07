import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AssessorPoints,
  AssessorBadge,
  AssessorStreak,
  LeaderboardEntry,
  POINT_VALUES,
  PointActionType,
} from '@/types/gamification';

// ---------- Points ----------

export function useAssessorPoints(userId: string | null) {
  return useQuery({
    queryKey: ['assessor-points', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessor_points')
        .select('*')
        .eq('user_id', userId!)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data as AssessorPoints[];
    },
    enabled: !!userId,
  });
}

export function useAssessorTotalPoints(userId: string | null, period?: string) {
  return useQuery({
    queryKey: ['assessor-total-points', userId, period],
    queryFn: async () => {
      let query = supabase
        .from('assessor_points')
        .select('points')
        .eq('user_id', userId!);

      if (period) {
        // period format: 'YYYY-MM' (e.g., '2026-02')
        const startDate = `${period}-01T00:00:00Z`;
        const [year, month] = period.split('-').map(Number);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00Z`;
        query = query.gte('earned_at', startDate).lt('earned_at', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).reduce((sum, row) => sum + row.points, 0);
    },
    enabled: !!userId,
  });
}

export function useAwardPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      actionType,
      referenceId,
      description,
    }: {
      userId: string;
      actionType: PointActionType;
      referenceId?: string;
      description?: string;
    }) => {
      const points = POINT_VALUES[actionType];
      const { data, error } = await supabase
        .from('assessor_points')
        .insert({
          user_id: userId,
          points,
          action_type: actionType,
          reference_id: referenceId || null,
          description: description || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessor-points', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['assessor-total-points'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

// ---------- Leaderboard ----------

export function useLeaderboard(period?: string) {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      // Build points query
      let pointsQuery = supabase
        .from('assessor_points')
        .select('user_id, points, earned_at');

      if (period) {
        const startDate = `${period}-01T00:00:00Z`;
        const [year, month] = period.split('-').map(Number);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00Z`;
        pointsQuery = pointsQuery.gte('earned_at', startDate).lt('earned_at', endDate);
      }

      const { data: pointsData, error: pointsError } = await pointsQuery;
      if (pointsError) throw pointsError;

      // Aggregate points by user
      const userPointsMap = new Map<string, number>();
      (pointsData || []).forEach((row) => {
        const current = userPointsMap.get(row.user_id) || 0;
        userPointsMap.set(row.user_id, current + row.points);
      });

      if (userPointsMap.size === 0) return [];

      const userIds = [...userPointsMap.keys()];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p.name])
      );

      // Fetch badges
      const { data: badges } = await supabase
        .from('assessor_badges')
        .select('*')
        .in('user_id', userIds);

      const badgeMap = new Map<string, AssessorBadge[]>();
      (badges || []).forEach((b) => {
        const existing = badgeMap.get(b.user_id) || [];
        existing.push(b as AssessorBadge);
        badgeMap.set(b.user_id, existing);
      });

      // Fetch streaks
      const { data: streaks } = await supabase
        .from('assessor_streaks')
        .select('*')
        .in('user_id', userIds)
        .eq('streak_type', 'daily_interaction');

      const streakMap = new Map(
        (streaks || []).map((s) => [s.user_id, s.current_streak as number])
      );

      // Build leaderboard
      const entries: LeaderboardEntry[] = userIds
        .map((userId) => ({
          user_id: userId,
          name: profileMap.get(userId) || 'Assessor',
          total_points: userPointsMap.get(userId) || 0,
          badges: badgeMap.get(userId) || [],
          streak: streakMap.get(userId) || 0,
          rank: 0,
        }))
        .sort((a, b) => b.total_points - a.total_points);

      // Assign ranks
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    },
  });
}

// ---------- Badges ----------

export function useAssessorBadges(userId: string | null) {
  return useQuery({
    queryKey: ['assessor-badges', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessor_badges')
        .select('*')
        .eq('user_id', userId!)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data as AssessorBadge[];
    },
    enabled: !!userId,
  });
}

export function useAwardBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (badge: Omit<AssessorBadge, 'id' | 'earned_at'>) => {
      const { data, error } = await supabase
        .from('assessor_badges')
        .insert(badge)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessor-badges', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

// ---------- Streaks ----------

export function useAssessorStreak(userId: string | null) {
  return useQuery({
    queryKey: ['assessor-streak', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessor_streaks')
        .select('*')
        .eq('user_id', userId!)
        .eq('streak_type', 'daily_interaction')
        .maybeSingle();
      if (error) throw error;
      return data as AssessorStreak | null;
    },
    enabled: !!userId,
  });
}

export function useUpdateStreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const today = new Date().toISOString().split('T')[0];

      // Get or create streak
      const { data: existing } = await supabase
        .from('assessor_streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('streak_type', 'daily_interaction')
        .maybeSingle();

      if (existing) {
        const lastDate = existing.last_activity_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === today) {
          // Already updated today
          return existing;
        }

        let newStreak = 1;
        if (lastDate === yesterdayStr) {
          newStreak = existing.current_streak + 1;
        }

        const newBest = Math.max(existing.best_streak, newStreak);

        const { data, error } = await supabase
          .from('assessor_streaks')
          .update({
            current_streak: newStreak,
            best_streak: newBest,
            last_activity_date: today,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('assessor_streaks')
          .insert({
            user_id: userId,
            streak_type: 'daily_interaction',
            current_streak: 1,
            best_streak: 1,
            last_activity_date: today,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessor-streak', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
