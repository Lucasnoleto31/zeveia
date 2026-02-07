// Gamification System Types

export type PointActionType =
  | 'lead_converted'
  | 'client_activated'
  | 'interaction_logged'
  | 'client_reactivated'
  | 'goal_achieved'
  | 'macro_shared';

export type BadgeType =
  | 'hot_streak'
  | 'sniper'
  | 'revenue_king'
  | 'growth_hacker'
  | 'network_master'
  | 'retention_shield';

export interface AssessorPoints {
  id: string;
  user_id: string;
  points: number;
  action_type: string;
  reference_id: string | null;
  description: string | null;
  earned_at: string;
}

export interface AssessorBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  badge_emoji: string;
  earned_at: string;
  period: string | null;
}

export interface AssessorStreak {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  best_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_points: number;
  badges: AssessorBadge[];
  streak: number;
  rank: number;
}

export const POINT_VALUES: Record<PointActionType, number> = {
  lead_converted: 100,
  client_activated: 200,
  interaction_logged: 10,
  client_reactivated: 300,
  goal_achieved: 500,
  macro_shared: 20,
};

export const POINT_ACTION_LABELS: Record<PointActionType, string> = {
  lead_converted: 'Lead Convertido',
  client_activated: 'Cliente Ativado',
  interaction_logged: 'Interação Registrada',
  client_reactivated: 'Cliente Reativado',
  goal_achieved: 'Meta Alcançada',
  macro_shared: 'Macro Compartilhada',
};

export const BADGE_CONFIG: Record<BadgeType, { name: string; emoji: string; description: string }> = {
  hot_streak: { name: 'Hot Streak', emoji: '🔥', description: '7 dias consecutivos de interações' },
  sniper: { name: 'Sniper', emoji: '🎯', description: 'Taxa de conversão acima de 50%' },
  revenue_king: { name: 'Revenue King', emoji: '👑', description: 'Maior receita do mês' },
  growth_hacker: { name: 'Growth Hacker', emoji: '🚀', description: '10+ novos clientes no mês' },
  network_master: { name: 'Network Master', emoji: '🕸️', description: '5+ indicações de parceiros' },
  retention_shield: { name: 'Retention Shield', emoji: '🛡️', description: 'Zero churn no mês' },
};
