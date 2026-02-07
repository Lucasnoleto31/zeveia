-- =====================================================
-- Phase 2: Health Score, Churn Prediction & Retention
-- =====================================================

-- Enum for lifecycle stages
CREATE TYPE client_lifecycle_stage AS ENUM ('onboarding', 'active', 'at_risk', 'churning', 'churned', 'reactivated');

-- Enum for risk classification
CREATE TYPE risk_classification AS ENUM ('healthy', 'attention', 'critical', 'lost');

-- Health scores table (daily snapshots)
CREATE TABLE client_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  classification risk_classification NOT NULL,
  components JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lifecycle tracking
CREATE TABLE client_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stage client_lifecycle_stage NOT NULL,
  previous_stage client_lifecycle_stage,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id)
);

-- Churn events
CREATE TABLE churn_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  churn_probability NUMERIC(5,2) NOT NULL,
  risk_factors JSONB NOT NULL DEFAULT '[]',
  action_taken TEXT,
  outcome TEXT,
  resolved_at TIMESTAMPTZ
);

-- Retention playbooks
CREATE TABLE retention_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  risk_classification risk_classification NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Retention actions (instances of playbook steps applied to clients)
CREATE TABLE retention_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  playbook_id UUID REFERENCES retention_playbooks(id),
  churn_event_id UUID REFERENCES churn_events(id),
  step_order INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_health_scores_client_id ON client_health_scores(client_id);
CREATE INDEX idx_health_scores_calculated_at ON client_health_scores(calculated_at DESC);
CREATE INDEX idx_health_scores_client_calculated ON client_health_scores(client_id, calculated_at DESC);
CREATE INDEX idx_health_scores_classification ON client_health_scores(classification);

CREATE INDEX idx_lifecycle_client_id ON client_lifecycle(client_id);
CREATE INDEX idx_lifecycle_changed_at ON client_lifecycle(changed_at DESC);
CREATE INDEX idx_lifecycle_stage ON client_lifecycle(stage);

CREATE INDEX idx_churn_events_client_id ON churn_events(client_id);
CREATE INDEX idx_churn_events_predicted_at ON churn_events(predicted_at DESC);
CREATE INDEX idx_churn_events_outcome ON churn_events(outcome);

CREATE INDEX idx_retention_playbooks_classification ON retention_playbooks(risk_classification);
CREATE INDEX idx_retention_playbooks_active ON retention_playbooks(is_active);

CREATE INDEX idx_retention_actions_client_id ON retention_actions(client_id);
CREATE INDEX idx_retention_actions_status ON retention_actions(status);
CREATE INDEX idx_retention_actions_due_date ON retention_actions(due_date);
CREATE INDEX idx_retention_actions_playbook_id ON retention_actions(playbook_id);
CREATE INDEX idx_retention_actions_churn_event_id ON retention_actions(churn_event_id);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE client_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_actions ENABLE ROW LEVEL SECURITY;

-- Health Scores: accessible by authenticated users (filtered by assessor via client relation)
CREATE POLICY "Users can view health scores for their clients"
  ON client_health_scores FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE assessor_id = COALESCE(get_assessor_filter(), assessor_id)
    )
  );

CREATE POLICY "Users can insert health scores"
  ON client_health_scores FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update health scores"
  ON client_health_scores FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can delete health scores"
  ON client_health_scores FOR DELETE TO authenticated
  USING (true);

-- Lifecycle: accessible by authenticated users (filtered by assessor via client relation)
CREATE POLICY "Users can view lifecycle for their clients"
  ON client_lifecycle FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE assessor_id = COALESCE(get_assessor_filter(), assessor_id)
    )
  );

CREATE POLICY "Users can insert lifecycle events"
  ON client_lifecycle FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update lifecycle events"
  ON client_lifecycle FOR UPDATE TO authenticated
  USING (true);

-- Churn Events: accessible by authenticated users (filtered by assessor via client relation)
CREATE POLICY "Users can view churn events for their clients"
  ON churn_events FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE assessor_id = COALESCE(get_assessor_filter(), assessor_id)
    )
  );

CREATE POLICY "Users can insert churn events"
  ON churn_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update churn events"
  ON churn_events FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can delete churn events"
  ON churn_events FOR DELETE TO authenticated
  USING (true);

-- Retention Playbooks: all authenticated users can read, only socios can modify
CREATE POLICY "All authenticated users can view playbooks"
  ON retention_playbooks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Socios can insert playbooks"
  ON retention_playbooks FOR INSERT TO authenticated
  WITH CHECK (is_socio());

CREATE POLICY "Socios can update playbooks"
  ON retention_playbooks FOR UPDATE TO authenticated
  USING (is_socio());

CREATE POLICY "Socios can delete playbooks"
  ON retention_playbooks FOR DELETE TO authenticated
  USING (is_socio());

-- Retention Actions: accessible by authenticated users (filtered by assessor via client relation)
CREATE POLICY "Users can view retention actions for their clients"
  ON retention_actions FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE assessor_id = COALESCE(get_assessor_filter(), assessor_id)
    )
  );

CREATE POLICY "Users can insert retention actions"
  ON retention_actions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update retention actions"
  ON retention_actions FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Users can delete retention actions"
  ON retention_actions FOR DELETE TO authenticated
  USING (true);

-- =====================================================
-- Seed: Retention Playbooks
-- =====================================================

INSERT INTO retention_playbooks (name, description, risk_classification, steps, is_active) VALUES
(
  'Atenção',
  'Playbook para clientes classificados como atenção. Objetivo: reengajar antes que o risco aumente.',
  'attention',
  '[
    {"order": 1, "action": "whatsapp", "description": "Enviar mensagem de check-in via WhatsApp perguntando como está e se precisa de algo", "deadline_days": 2},
    {"order": 2, "action": "call", "description": "Ligar para o cliente para entender situação atual e oferecer suporte", "deadline_days": 5},
    {"order": 3, "action": "meeting", "description": "Agendar reunião presencial ou por vídeo para revisão de carteira e planejamento", "deadline_days": 10}
  ]'::jsonb,
  true
),
(
  'Crítico',
  'Playbook para clientes em situação crítica. Ações urgentes para evitar churn.',
  'critical',
  '[
    {"order": 1, "action": "call", "description": "Ligação urgente do assessor responsável para entender a situação e demonstrar preocupação", "deadline_days": 1},
    {"order": 2, "action": "offer", "description": "Preparar e enviar proposta personalizada com benefícios exclusivos (isenção de taxa, upgrade de plataforma)", "deadline_days": 3},
    {"order": 3, "action": "meeting", "description": "Agendar reunião para apresentar proposta e revisar a estratégia de investimento", "deadline_days": 5},
    {"order": 4, "action": "call", "description": "Escalação para gerente/sócio — ligação direta do sócio demonstrando importância do cliente", "deadline_days": 7},
    {"order": 5, "action": "offer", "description": "Oferta final de retenção: condições especiais por 3 meses (desconto em corretagem, consultoria gratuita)", "deadline_days": 10}
  ]'::jsonb,
  true
),
(
  'Reativação',
  'Playbook para clientes que já deram churn. Objetivo: reconquistar o cliente com abordagem especial.',
  'lost',
  '[
    {"order": 1, "action": "email", "description": "Enviar e-mail personalizado reconhecendo a saída, apresentando melhorias recentes e novidades", "deadline_days": 3},
    {"order": 2, "action": "content", "description": "Enviar conteúdo exclusivo: relatório de mercado, análise personalizada ou material educativo relevante", "deadline_days": 7},
    {"order": 3, "action": "call", "description": "Ligação com oferta especial de retorno: condições diferenciadas por 6 meses", "deadline_days": 14},
    {"order": 4, "action": "offer", "description": "Última tentativa: oferta irrecusável com isenção total de custos por 3 meses e acompanhamento dedicado", "deadline_days": 30}
  ]'::jsonb,
  true
);
