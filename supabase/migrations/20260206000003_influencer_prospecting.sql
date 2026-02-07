-- Influencer Prospecting Module
-- Phase 3: Pipeline for prospecting and managing influencer partnerships

-- Influencer pipeline stages
CREATE TYPE influencer_stage AS ENUM (
  'identified',
  'researching',
  'contacted',
  'negotiating',
  'contracted',
  'active',
  'paused',
  'lost'
);

-- Influencer profiles (extends partners)
CREATE TABLE influencer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  stage influencer_stage NOT NULL DEFAULT 'identified',
  -- Social media
  instagram_handle TEXT,
  instagram_followers INTEGER,
  youtube_channel TEXT,
  youtube_subscribers INTEGER,
  twitter_handle TEXT,
  twitter_followers INTEGER,
  tiktok_handle TEXT,
  tiktok_followers INTEGER,
  -- Profile
  niche TEXT[],
  audience_profile TEXT,
  content_style TEXT,
  engagement_rate NUMERIC(5,2),
  -- Qualification
  qualification_score NUMERIC(5,2),
  estimated_reach INTEGER,
  estimated_cpl NUMERIC(10,2),
  -- Business
  proposed_commission NUMERIC(5,2),
  proposed_model TEXT,
  monthly_cost_estimate NUMERIC(10,2),
  -- Meta
  source TEXT,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Influencer campaigns
CREATE TABLE influencer_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  tracking_code TEXT UNIQUE,
  budget NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  leads_generated INTEGER DEFAULT 0,
  accounts_opened INTEGER DEFAULT 0,
  contracts_generated INTEGER DEFAULT 0,
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Influencer negotiations/interactions
CREATE TABLE influencer_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  outcome TEXT,
  next_action TEXT,
  next_action_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_influencer_profiles_stage ON influencer_profiles(stage);
CREATE INDEX idx_influencer_profiles_assigned_to ON influencer_profiles(assigned_to);
CREATE INDEX idx_influencer_profiles_partner_id ON influencer_profiles(partner_id);
CREATE INDEX idx_influencer_campaigns_influencer_id ON influencer_campaigns(influencer_id);
CREATE INDEX idx_influencer_campaigns_status ON influencer_campaigns(status);
CREATE INDEX idx_influencer_campaigns_tracking_code ON influencer_campaigns(tracking_code);
CREATE INDEX idx_influencer_negotiations_influencer_id ON influencer_negotiations(influencer_id);
CREATE INDEX idx_influencer_negotiations_created_at ON influencer_negotiations(created_at DESC);

-- Trigger for updated_at on influencer_profiles
CREATE OR REPLACE FUNCTION update_influencer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_influencer_profiles_updated_at
  BEFORE UPDATE ON influencer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_influencer_profiles_updated_at();

-- RLS Policies
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_negotiations ENABLE ROW LEVEL SECURITY;

-- influencer_profiles: all authenticated users can read; insert/update/delete
CREATE POLICY "influencer_profiles_select" ON influencer_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "influencer_profiles_insert" ON influencer_profiles
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "influencer_profiles_update" ON influencer_profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "influencer_profiles_delete" ON influencer_profiles
  FOR DELETE TO authenticated USING (true);

-- influencer_campaigns: all authenticated users can CRUD
CREATE POLICY "influencer_campaigns_select" ON influencer_campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "influencer_campaigns_insert" ON influencer_campaigns
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "influencer_campaigns_update" ON influencer_campaigns
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "influencer_campaigns_delete" ON influencer_campaigns
  FOR DELETE TO authenticated USING (true);

-- influencer_negotiations: all authenticated users can CRUD
CREATE POLICY "influencer_negotiations_select" ON influencer_negotiations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "influencer_negotiations_insert" ON influencer_negotiations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "influencer_negotiations_update" ON influencer_negotiations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "influencer_negotiations_delete" ON influencer_negotiations
  FOR DELETE TO authenticated USING (true);
