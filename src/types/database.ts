// Database types for the application
export type AppRole = 'socio' | 'assessor';
export type LeadStatus = 'novo' | 'em_contato' | 'troca_assessoria' | 'convertido' | 'perdido';
export type ClientType = 'pf' | 'pj';
export type PartnerType = 'parceiro' | 'influenciador';
export type AlertType = 'aniversario' | 'inativo' | 'follow_up' | 'cross_selling';
export type MaritalStatus = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel';
export type InvestorProfile = 'conservador' | 'moderado' | 'arrojado' | 'agressivo';
export type Sex = 'masculino' | 'feminino' | 'outro';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Origin {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface LossReason {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Subproduct {
  id: string;
  product_id: string;
  name: string;
  active: boolean;
  created_at: string;
  product?: Product;
}

export interface Platform {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  code: string;
  name?: string;
  active: boolean;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: PartnerType;
  commission_percentage: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  state?: string;
  status: LeadStatus;
  origin_id?: string;
  campaign_id?: string;
  partner_id?: string;
  loss_reason_id?: string;
  observations?: string;
  assessor_id: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
  converted_at?: string;
  // Relations
  origin?: Origin;
  campaign?: Campaign;
  partner?: Partner;
  loss_reason?: LossReason;
  assessor?: Profile;
}

export interface Client {
  id: string;
  type: ClientType;
  account_number?: string;
  // PF fields
  name: string;
  cpf?: string;
  birth_date?: string;
  sex?: Sex;
  marital_status?: MaritalStatus;
  // PJ fields
  company_name?: string;
  trade_name?: string;
  cnpj?: string;
  // PJ Responsible
  responsible_name?: string;
  responsible_cpf?: string;
  responsible_birth_date?: string;
  responsible_position?: string;
  // Common fields
  state?: string;
  email?: string;
  phone?: string;
  patrimony?: number;
  profile?: InvestorProfile;
  origin_id?: string;
  campaign_id?: string;
  partner_id?: string;
  observations?: string;
  assessor_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
  converted_from_lead_id?: string;
  // Relations
  origin?: Origin;
  campaign?: Campaign;
  partner?: Partner;
  assessor?: Profile;
}

export interface Revenue {
  id: string;
  client_id: string;
  date: string;
  product_id: string;
  subproduct_id?: string;
  gross_revenue: number;
  taxes: number;
  bank_share: number;
  our_share: number;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  product?: Product;
  subproduct?: Subproduct;
}

export interface Contract {
  id: string;
  client_id: string;
  date: string;
  asset_id: string;
  platform_id: string;
  lots_traded: number;
  lots_zeroed: number;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  asset?: Asset;
  platform?: Platform;
}

export interface PlatformCost {
  id: string;
  client_id: string;
  platform_id: string;
  date: string;
  value: number;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
  platform?: Platform;
}

export interface Goal {
  id: string;
  assessor_id?: string;
  year: number;
  month: number;
  type: string;
  target_value: number;
  is_office_goal: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  assessor?: Profile;
}

export interface Interaction {
  id: string;
  client_id?: string;
  lead_id?: string;
  type: string;
  content: string;
  scheduled_at?: string;
  completed_at?: string;
  user_id: string;
  created_at: string;
  // Relations
  client?: Client;
  lead?: Lead;
  user?: Profile;
}

export interface Alert {
  id: string;
  type: AlertType;
  client_id?: string;
  lead_id?: string;
  message: string;
  read: boolean;
  dismissed: boolean;
  assessor_id: string;
  created_at: string;
  // Relations
  client?: Client;
  lead?: Lead;
}

export interface DailyMetric {
  id: string;
  date: string;
  assessor_id?: string;
  total_clients: number;
  total_clients_pf: number;
  total_clients_pj: number;
  total_leads: number;
  total_revenue: number;
  total_lots_traded: number;
  total_lots_zeroed: number;
  created_at: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalClients: number;
  totalClientsPF: number;
  totalClientsPJ: number;
  totalLeads: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalLotsTraded: number;
  totalLotsZeroed: number;
  revenueByMonth: { month: string; value: number }[];
  contractsByMonth: { month: string; traded: number; zeroed: number }[];
  clientsByMonth: { month: string; count: number }[];
  leadsByStatus: { status: LeadStatus; count: number }[];
  clientsByProfile: { profile: InvestorProfile; count: number }[];
}
