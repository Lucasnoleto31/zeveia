-- Create enums for the application
CREATE TYPE public.app_role AS ENUM ('socio', 'assessor');
CREATE TYPE public.lead_status AS ENUM ('novo', 'em_contato', 'troca_assessoria', 'convertido', 'perdido');
CREATE TYPE public.client_type AS ENUM ('pf', 'pj');
CREATE TYPE public.partner_type AS ENUM ('parceiro', 'influenciador');
CREATE TYPE public.alert_type AS ENUM ('aniversario', 'inativo', 'follow_up', 'cross_selling');
CREATE TYPE public.marital_status AS ENUM ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel');
CREATE TYPE public.investor_profile AS ENUM ('conservador', 'moderado', 'arrojado', 'agressivo');
CREATE TYPE public.sex AS ENUM ('masculino', 'feminino', 'outro');

-- User roles table (security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Configuration tables
CREATE TABLE public.origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.origins ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.loss_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loss_reasons ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subproducts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, name)
);
ALTER TABLE public.subproducts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type partner_type NOT NULL DEFAULT 'parceiro',
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  state TEXT,
  status lead_status NOT NULL DEFAULT 'novo',
  origin_id UUID REFERENCES public.origins(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  partner_id UUID REFERENCES public.partners(id),
  loss_reason_id UUID REFERENCES public.loss_reasons(id),
  observations TEXT,
  assessor_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  converted_at TIMESTAMPTZ
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type client_type NOT NULL DEFAULT 'pf',
  account_number TEXT,
  -- PF fields
  name TEXT NOT NULL,
  cpf TEXT,
  birth_date DATE,
  sex sex,
  marital_status marital_status,
  -- PJ fields
  company_name TEXT,
  trade_name TEXT,
  cnpj TEXT,
  -- PJ Responsible
  responsible_name TEXT,
  responsible_cpf TEXT,
  responsible_birth_date DATE,
  responsible_position TEXT,
  -- Common fields
  state TEXT,
  email TEXT,
  phone TEXT,
  patrimony NUMERIC(18,2),
  profile investor_profile,
  origin_id UUID REFERENCES public.origins(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  partner_id UUID REFERENCES public.partners(id),
  observations TEXT,
  assessor_id UUID REFERENCES auth.users(id) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  converted_from_lead_id UUID REFERENCES public.leads(id)
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_clients_assessor ON public.clients(assessor_id);
CREATE INDEX idx_clients_type ON public.clients(type);
CREATE INDEX idx_clients_cpf ON public.clients(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_clients_cnpj ON public.clients(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_clients_partner ON public.clients(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX idx_leads_assessor ON public.leads(assessor_id);
CREATE INDEX idx_leads_status ON public.leads(status);

-- Revenues table
CREATE TABLE public.revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  subproduct_id UUID REFERENCES public.subproducts(id),
  gross_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  taxes NUMERIC(18,2) NOT NULL DEFAULT 0,
  bank_share NUMERIC(18,2) NOT NULL DEFAULT 0,
  our_share NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_revenues_client ON public.revenues(client_id);
CREATE INDEX idx_revenues_date ON public.revenues(date);
CREATE INDEX idx_revenues_product ON public.revenues(product_id);

-- Contracts (Day Trade) table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) NOT NULL,
  platform_id UUID REFERENCES public.platforms(id) NOT NULL,
  lots_traded INTEGER NOT NULL DEFAULT 0,
  lots_zeroed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_contracts_client ON public.contracts(client_id);
CREATE INDEX idx_contracts_date ON public.contracts(date);
CREATE INDEX idx_contracts_asset ON public.contracts(asset_id);

-- Platform costs table
CREATE TABLE public.platform_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  platform_id UUID REFERENCES public.platforms(id) NOT NULL,
  date DATE NOT NULL,
  value NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_costs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_platform_costs_client ON public.platform_costs(client_id);
CREATE INDEX idx_platform_costs_date ON public.platform_costs(date);

-- Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessor_id UUID REFERENCES auth.users(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  type TEXT NOT NULL, -- 'clients_converted', 'revenue', 'lots_traded', 'active_clients'
  target_value NUMERIC(18,2) NOT NULL,
  is_office_goal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessor_id, year, month, type)
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Interactions/Notes table
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'note', 'task'
  content TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_client_or_lead CHECK (
    (client_id IS NOT NULL AND lead_id IS NULL) OR
    (client_id IS NULL AND lead_id IS NOT NULL)
  )
);
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_interactions_client ON public.interactions(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_interactions_lead ON public.interactions(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_interactions_scheduled ON public.interactions(scheduled_at) WHERE scheduled_at IS NOT NULL AND completed_at IS NULL;

-- Alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type alert_type NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  assessor_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_alerts_assessor ON public.alerts(assessor_id);
CREATE INDEX idx_alerts_read ON public.alerts(read) WHERE read = false;

-- Aggregated metrics table (for performance)
CREATE TABLE public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  assessor_id UUID REFERENCES auth.users(id),
  total_clients INTEGER NOT NULL DEFAULT 0,
  total_clients_pf INTEGER NOT NULL DEFAULT 0,
  total_clients_pj INTEGER NOT NULL DEFAULT 0,
  total_leads INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_lots_traded INTEGER NOT NULL DEFAULT 0,
  total_lots_zeroed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, assessor_id)
);
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_daily_metrics_date ON public.daily_metrics(date);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is socio
CREATE OR REPLACE FUNCTION public.is_socio()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'socio')
$$;

-- Function to get current user's assessor_id (for filtering)
CREATE OR REPLACE FUNCTION public.get_assessor_filter()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.is_socio() THEN NULL
    ELSE auth.uid()
  END
$$;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_revenues_updated_at BEFORE UPDATE ON public.revenues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_platform_costs_updated_at BEFORE UPDATE ON public.platform_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- User roles: Only socios can manage, users can see their own
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Socios can view all roles" ON public.user_roles FOR SELECT USING (public.is_socio());
CREATE POLICY "Socios can manage roles" ON public.user_roles FOR ALL USING (public.is_socio());

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- Configuration tables (all authenticated can read, only socios can write)
CREATE POLICY "Authenticated can view origins" ON public.origins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Socios can manage origins" ON public.origins FOR ALL USING (public.is_socio());

CREATE POLICY "Authenticated can view campaigns" ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Socios can manage campaigns" ON public.campaigns FOR ALL USING (public.is_socio());

CREATE POLICY "Authenticated can view loss_reasons" ON public.loss_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Socios can manage loss_reasons" ON public.loss_reasons FOR ALL USING (public.is_socio());

CREATE POLICY "Authenticated can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Socios can manage products" ON public.products FOR ALL USING (public.is_socio());

CREATE POLICY "Authenticated can view subproducts" ON public.subproducts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Socios can manage subproducts" ON public.subproducts FOR ALL USING (public.is_socio());

CREATE POLICY "Authenticated can view platforms" ON public.platforms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Socios can manage platforms" ON public.platforms FOR ALL USING (public.is_socio());

CREATE POLICY "Authenticated can view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Socios can manage assets" ON public.assets FOR ALL USING (public.is_socio());

-- Partners
CREATE POLICY "Authenticated can view partners" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage partners" ON public.partners FOR ALL TO authenticated USING (true);

-- Leads: Assessors see own, Socios see all
CREATE POLICY "Assessors view own leads" ON public.leads FOR SELECT USING (
  assessor_id = auth.uid() OR public.is_socio()
);
CREATE POLICY "Assessors manage own leads" ON public.leads FOR ALL USING (
  assessor_id = auth.uid() OR public.is_socio()
);

-- Clients: Assessors see own, Socios see all
CREATE POLICY "Assessors view own clients" ON public.clients FOR SELECT USING (
  assessor_id = auth.uid() OR public.is_socio()
);
CREATE POLICY "Assessors manage own clients" ON public.clients FOR ALL USING (
  assessor_id = auth.uid() OR public.is_socio()
);

-- Revenues: Based on client ownership
CREATE POLICY "View revenues for accessible clients" ON public.revenues FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_id AND (c.assessor_id = auth.uid() OR public.is_socio())
  )
);
CREATE POLICY "Manage revenues for accessible clients" ON public.revenues FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_id AND (c.assessor_id = auth.uid() OR public.is_socio())
  )
);

-- Contracts: Based on client ownership
CREATE POLICY "View contracts for accessible clients" ON public.contracts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_id AND (c.assessor_id = auth.uid() OR public.is_socio())
  )
);
CREATE POLICY "Manage contracts for accessible clients" ON public.contracts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_id AND (c.assessor_id = auth.uid() OR public.is_socio())
  )
);

-- Platform costs: Based on client ownership
CREATE POLICY "View platform_costs for accessible clients" ON public.platform_costs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_id AND (c.assessor_id = auth.uid() OR public.is_socio())
  )
);
CREATE POLICY "Manage platform_costs for accessible clients" ON public.platform_costs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_id AND (c.assessor_id = auth.uid() OR public.is_socio())
  )
);

-- Goals
CREATE POLICY "View own goals or all if socio" ON public.goals FOR SELECT USING (
  assessor_id = auth.uid() OR public.is_socio() OR is_office_goal = true
);
CREATE POLICY "Socios manage all goals" ON public.goals FOR ALL USING (public.is_socio());

-- Interactions: Based on client/lead ownership
CREATE POLICY "View interactions for accessible records" ON public.interactions FOR SELECT USING (
  (client_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = client_id AND (c.assessor_id = auth.uid() OR public.is_socio())
  )) OR
  (lead_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assessor_id = auth.uid() OR public.is_socio())
  ))
);
CREATE POLICY "Manage interactions for accessible records" ON public.interactions FOR ALL USING (
  user_id = auth.uid() OR public.is_socio()
);

-- Alerts: Users see own alerts
CREATE POLICY "Users view own alerts" ON public.alerts FOR SELECT USING (assessor_id = auth.uid() OR public.is_socio());
CREATE POLICY "Users manage own alerts" ON public.alerts FOR ALL USING (assessor_id = auth.uid() OR public.is_socio());

-- Daily metrics
CREATE POLICY "View own or office metrics" ON public.daily_metrics FOR SELECT USING (
  assessor_id = auth.uid() OR assessor_id IS NULL OR public.is_socio()
);
CREATE POLICY "Socios manage metrics" ON public.daily_metrics FOR ALL USING (public.is_socio());

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  -- First user becomes socio, others become assessor
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'socio');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'assessor');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some default data
INSERT INTO public.origins (name) VALUES ('Indicação'), ('Site'), ('LinkedIn'), ('Instagram'), ('Evento'), ('Cold Call');
INSERT INTO public.campaigns (name) VALUES ('Orgânico'), ('Campanha Q1 2024'), ('Campanha Q2 2024');
INSERT INTO public.loss_reasons (name) VALUES ('Não atendeu'), ('Sem interesse'), ('Foi para concorrente'), ('Sem capital'), ('Outro');
INSERT INTO public.products (name) VALUES ('Renda Fixa'), ('Renda Variável'), ('Fundos'), ('Previdência'), ('COE'), ('Day Trade');
INSERT INTO public.platforms (name) VALUES ('Profit Pro'), ('Tryd Pro'), ('MetaTrader 5'), ('Replay'), ('Home Broker');
INSERT INTO public.assets (code, name) VALUES ('WIN', 'Mini Índice'), ('WDO', 'Mini Dólar'), ('PETR4', 'Petrobras PN'), ('VALE3', 'Vale ON'), ('B3SA3', 'B3 ON');