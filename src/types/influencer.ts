// Influencer Prospecting Module Types

export type InfluencerStage =
  | 'identified'
  | 'researching'
  | 'contacted'
  | 'negotiating'
  | 'contracted'
  | 'active'
  | 'paused'
  | 'lost';

export type InfluencerNiche =
  | 'day_trade'
  | 'swing_trade'
  | 'options'
  | 'crypto'
  | 'education'
  | 'forex'
  | 'stocks'
  | 'real_estate'
  | 'personal_finance';

export type ProposedModel =
  | 'revenue_share'
  | 'cpl'
  | 'cpa'
  | 'fixed'
  | 'hybrid';

export type CampaignType =
  | 'post'
  | 'story'
  | 'video'
  | 'live'
  | 'series'
  | 'challenge';

export type CampaignStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'cancelled';

export type InteractionType =
  | 'email'
  | 'call'
  | 'whatsapp'
  | 'meeting'
  | 'dm'
  | 'proposal_sent'
  | 'contract_sent';

export type NegotiationOutcome =
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'pending';

export interface InfluencerProfile {
  id: string;
  partner_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  stage: InfluencerStage;
  // Social media
  instagram_handle: string | null;
  instagram_followers: number | null;
  youtube_channel: string | null;
  youtube_subscribers: number | null;
  twitter_handle: string | null;
  twitter_followers: number | null;
  tiktok_handle: string | null;
  tiktok_followers: number | null;
  // Profile
  niche: string[] | null;
  audience_profile: string | null;
  content_style: string | null;
  engagement_rate: number | null;
  // Qualification
  qualification_score: number | null;
  estimated_reach: number | null;
  estimated_cpl: number | null;
  // Business
  proposed_commission: number | null;
  proposed_model: string | null;
  monthly_cost_estimate: number | null;
  // Meta
  source: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface InfluencerCampaign {
  id: string;
  influencer_id: string;
  name: string;
  campaign_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  tracking_code: string | null;
  budget: number | null;
  actual_cost: number | null;
  leads_generated: number;
  accounts_opened: number;
  contracts_generated: number;
  revenue_generated: number;
  notes: string | null;
  created_at: string;
}

export interface InfluencerNegotiation {
  id: string;
  influencer_id: string;
  interaction_type: string;
  description: string;
  outcome: string | null;
  next_action: string | null;
  next_action_date: string | null;
  created_by: string | null;
  created_at: string;
}

// Stage configuration for Kanban
export const INFLUENCER_STAGES: {
  id: InfluencerStage;
  title: string;
  color: string;
}[] = [
  { id: 'identified', title: 'Identificado', color: 'bg-slate-500' },
  { id: 'researching', title: 'Pesquisando', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contatado', color: 'bg-yellow-500' },
  { id: 'negotiating', title: 'Negociando', color: 'bg-orange-500' },
  { id: 'contracted', title: 'Contratado', color: 'bg-purple-500' },
  { id: 'active', title: 'Ativo', color: 'bg-green-500' },
];

export const INFLUENCER_ALL_STAGES: {
  id: InfluencerStage;
  title: string;
  color: string;
}[] = [
  ...INFLUENCER_STAGES,
  { id: 'paused', title: 'Pausado', color: 'bg-gray-500' },
  { id: 'lost', title: 'Perdido', color: 'bg-red-500' },
];

export const NICHE_OPTIONS: { value: string; label: string }[] = [
  { value: 'day_trade', label: 'Day Trade' },
  { value: 'swing_trade', label: 'Swing Trade' },
  { value: 'options', label: 'Opções' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'education', label: 'Educação Financeira' },
  { value: 'forex', label: 'Forex' },
  { value: 'stocks', label: 'Ações' },
  { value: 'real_estate', label: 'Fundos Imobiliários' },
  { value: 'personal_finance', label: 'Finanças Pessoais' },
];

export const PROPOSED_MODEL_OPTIONS: { value: ProposedModel; label: string }[] = [
  { value: 'revenue_share', label: 'Revenue Share' },
  { value: 'cpl', label: 'CPL (Custo por Lead)' },
  { value: 'cpa', label: 'CPA (Custo por Aquisição)' },
  { value: 'fixed', label: 'Fixo Mensal' },
  { value: 'hybrid', label: 'Híbrido' },
];

export const CAMPAIGN_TYPE_OPTIONS: { value: CampaignType; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' },
  { value: 'video', label: 'Vídeo' },
  { value: 'live', label: 'Live' },
  { value: 'series', label: 'Série' },
  { value: 'challenge', label: 'Desafio' },
];

export const CAMPAIGN_STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: 'planned', label: 'Planejada' },
  { value: 'active', label: 'Ativa' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
];

export const INTERACTION_TYPE_OPTIONS: { value: InteractionType; label: string }[] = [
  { value: 'email', label: 'E-mail' },
  { value: 'call', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'dm', label: 'DM (Direct Message)' },
  { value: 'proposal_sent', label: 'Proposta Enviada' },
  { value: 'contract_sent', label: 'Contrato Enviado' },
];

export const OUTCOME_OPTIONS: { value: NegotiationOutcome; label: string }[] = [
  { value: 'positive', label: 'Positivo' },
  { value: 'neutral', label: 'Neutro' },
  { value: 'negative', label: 'Negativo' },
  { value: 'pending', label: 'Pendente' },
];
