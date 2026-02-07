// Types for Health Score, Churn Prediction & Retention (Phase 2)

// Enums
export type ClientLifecycleStage = 'onboarding' | 'active' | 'at_risk' | 'churning' | 'churned' | 'reactivated';
export type RiskClassification = 'healthy' | 'attention' | 'critical' | 'lost';
export type RetentionActionStatus = 'pending' | 'completed' | 'skipped';
export type ChurnOutcome = 'retained' | 'churned' | 'pending';
export type RetentionActionType = 'call' | 'email' | 'meeting' | 'offer' | 'content' | 'whatsapp';

// Health Score Component Breakdown
export interface HealthScoreComponents {
  recency: number;    // 0-100: how recently client generated revenue
  frequency: number;  // 0-100: how often client operates per month
  monetary: number;   // 0-100: average revenue compared to peers
  trend: number;      // 0-100: month-over-month growth trend
  engagement: number; // 0-100: interaction frequency
}

// Health Score record (daily snapshot)
export interface ClientHealthScore {
  id: string;
  client_id: string;
  score: number;
  classification: RiskClassification;
  components: HealthScoreComponents;
  calculated_at: string;
  created_at: string;
  // Relations
  client?: {
    id: string;
    name: string;
    company_name?: string;
    type: 'pf' | 'pj';
    assessor_id: string;
    active: boolean;
  };
}

// Lifecycle event
export interface ClientLifecycleEvent {
  id: string;
  client_id: string;
  stage: ClientLifecycleStage;
  previous_stage: ClientLifecycleStage | null;
  changed_at: string;
  reason: string | null;
  changed_by: string | null;
  // Relations
  client?: {
    id: string;
    name: string;
    type: 'pf' | 'pj';
  };
  user?: {
    name: string;
  };
}

// Churn event
export interface ChurnEvent {
  id: string;
  client_id: string;
  predicted_at: string;
  churn_probability: number;
  risk_factors: ChurnRiskFactor[];
  action_taken: string | null;
  outcome: ChurnOutcome | null;
  resolved_at: string | null;
  // Relations
  client?: {
    id: string;
    name: string;
    company_name?: string;
    type: 'pf' | 'pj';
    assessor_id: string;
  };
}

export interface ChurnRiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// Playbook step definition
export interface PlaybookStep {
  order: number;
  action: RetentionActionType;
  description: string;
  deadline_days: number;
}

// Retention playbook
export interface RetentionPlaybook {
  id: string;
  name: string;
  description: string | null;
  risk_classification: RiskClassification;
  steps: PlaybookStep[];
  is_active: boolean;
  created_at: string;
}

// Retention action (instance of a playbook step applied to a client)
export interface RetentionAction {
  id: string;
  client_id: string;
  playbook_id: string | null;
  churn_event_id: string | null;
  step_order: number;
  action_type: string;
  description: string;
  status: RetentionActionStatus;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  // Relations
  client?: {
    id: string;
    name: string;
    company_name?: string;
    type: 'pf' | 'pj';
    assessor_id: string;
  };
  playbook?: RetentionPlaybook;
}

// Dashboard summary types
export interface HealthScoreSummary {
  healthy: number;
  attention: number;
  critical: number;
  lost: number;
  total: number;
  averageScore: number;
}

export interface RetentionDashboardData {
  clientsAtRisk: number;
  activePlaybooks: number;
  actionsPending: number;
  actionsCompleted: number;
  retentionRate: number;
  atRiskClients: AtRiskClientRow[];
}

export interface AtRiskClientRow {
  clientId: string;
  clientName: string;
  clientType: 'pf' | 'pj';
  healthScore: number;
  classification: RiskClassification;
  churnProbability: number | null;
  activePlaybook: string | null;
  nextAction: RetentionAction | null;
  assessorId: string;
}

export interface ChurnSummary {
  totalEvents: number;
  pendingEvents: number;
  retainedCount: number;
  churnedCount: number;
  retentionRate: number;
  avgChurnProbability: number;
}

// Lifecycle stage metadata for display
export const LIFECYCLE_STAGES: Record<ClientLifecycleStage, { label: string; color: string; icon: string }> = {
  onboarding: { label: 'Onboarding', color: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30', icon: '🚀' },
  active: { label: 'Ativo', color: 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30', icon: '✅' },
  at_risk: { label: 'Em Risco', color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30', icon: '⚠️' },
  churning: { label: 'Saindo', color: 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30', icon: '🔻' },
  churned: { label: 'Perdido', color: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30', icon: '❌' },
  reactivated: { label: 'Reativado', color: 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30', icon: '🔄' },
};

export const RISK_CLASSIFICATIONS: Record<RiskClassification, { label: string; color: string; badgeColor: string }> = {
  healthy: { label: 'Saudável', color: 'text-green-600', badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  attention: { label: 'Atenção', color: 'text-yellow-600', badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  critical: { label: 'Crítico', color: 'text-orange-600', badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  lost: { label: 'Perdido', color: 'text-red-600', badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

export const ACTION_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  call: { label: 'Ligação', icon: '📞' },
  email: { label: 'E-mail', icon: '📧' },
  meeting: { label: 'Reunião', icon: '🤝' },
  offer: { label: 'Oferta', icon: '🎁' },
  content: { label: 'Conteúdo', icon: '📄' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
};
