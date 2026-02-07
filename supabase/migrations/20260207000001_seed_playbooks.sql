-- ============================================================
-- Seed: Retention Playbooks
-- Created: 2026-02-07
-- Description: Default playbooks for each risk classification
-- ============================================================

INSERT INTO public.retention_playbooks (name, description, risk_classification, steps, is_active) VALUES

-- Playbook for ATTENTION clients (score 50-74)
(
  'Acompanhamento Proativo',
  'Para clientes que deram sinais de queda de engajamento. Objetivo: reverter antes que piore.',
  'attention',
  '[
    {"order": 1, "action": "whatsapp", "description": "Mensagem de check-in: perguntar como está, se precisa de algo", "deadline_days": 2},
    {"order": 2, "action": "call", "description": "Ligação de acompanhamento: entender momento do cliente e necessidades", "deadline_days": 5},
    {"order": 3, "action": "content", "description": "Enviar relatório personalizado ou conteúdo relevante para o perfil", "deadline_days": 7},
    {"order": 4, "action": "meeting", "description": "Agendar reunião de revisão de carteira/estratégia", "deadline_days": 14}
  ]'::jsonb,
  true
),

-- Playbook for CRITICAL clients (score 25-49)
(
  'Resgate Urgente',
  'Cliente em risco alto de churn. Ações imediatas para reverter a situação.',
  'critical',
  '[
    {"order": 1, "action": "call", "description": "Ligação urgente: entender insatisfação e problemas", "deadline_days": 1},
    {"order": 2, "action": "meeting", "description": "Reunião presencial ou por vídeo com o assessor responsável", "deadline_days": 3},
    {"order": 3, "action": "offer", "description": "Apresentar benefício exclusivo ou condição especial de retenção", "deadline_days": 5},
    {"order": 4, "action": "whatsapp", "description": "Follow-up: confirmar que o problema foi resolvido", "deadline_days": 7},
    {"order": 5, "action": "call", "description": "Ligação de acompanhamento pós-ação: garantir satisfação", "deadline_days": 14}
  ]'::jsonb,
  true
),

-- Playbook for LOST clients (score 0-24)
(
  'Tentativa de Reativação',
  'Cliente praticamente perdido. Última tentativa de recuperação antes de classificar como churned.',
  'lost',
  '[
    {"order": 1, "action": "call", "description": "Ligação direta: entender motivo da saída e se há chance de retorno", "deadline_days": 1},
    {"order": 2, "action": "email", "description": "E-mail formal com proposta de reativação e benefícios", "deadline_days": 3},
    {"order": 3, "action": "offer", "description": "Oferta especial de reativação (taxa reduzida, período de teste, etc.)", "deadline_days": 5},
    {"order": 4, "action": "whatsapp", "description": "Pesquisa de saída: coletar feedback sobre motivo do churn", "deadline_days": 10},
    {"order": 5, "action": "content", "description": "Registrar aprendizados no CRM para evitar churn futuro similar", "deadline_days": 14}
  ]'::jsonb,
  true
),

-- Playbook for new high-value clients
(
  'Onboarding Premium',
  'Para novos clientes de alto valor. Garantir uma experiência excepcional desde o início.',
  'healthy',
  '[
    {"order": 1, "action": "whatsapp", "description": "Boas-vindas personalizada e apresentação do assessor", "deadline_days": 1},
    {"order": 2, "action": "call", "description": "Ligação de alinhamento: entender perfil de risco e objetivos", "deadline_days": 3},
    {"order": 3, "action": "meeting", "description": "Reunião de planejamento: montar estratégia de investimento", "deadline_days": 7},
    {"order": 4, "action": "content", "description": "Enviar primeiro relatório de acompanhamento da carteira", "deadline_days": 30}
  ]'::jsonb,
  true
);
