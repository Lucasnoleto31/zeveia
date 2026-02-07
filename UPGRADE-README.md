# 🚀 ZeveHub CRM — Upgrade Package v2.0

## O que tem neste pacote

### 📊 Fase 1: Quick Wins & Performance
- **Fix N+1 Queries** — Alertas passaram de 500-1000 queries para 1 única query
- **QueryClient otimizado** — staleTime 5min, sem refetch desnecessário
- **Debounce nos filtros** — Busca não dispara a cada tecla
- **Error Boundaries** — App não quebra silenciosamente
- **Batch Fetch genérico** — Utilitário reutilizável para todas as queries
- **📅 Calendário Macro** — 97 eventos reais de 2026 (FOMC, Copom, Payroll, IPCA, earnings)

### 🏥 Fase 2: Health Score & Retenção
- **Health Score** — Score 0-100 por cliente (recência, frequência, monetário, tendência, engajamento)
- **Badge visual** — Verde/amarelo/laranja/vermelho na tabela e detalhe do cliente
- **Predição de Churn** — Cálculo de probabilidade de churn por cliente
- **Lifecycle Timeline** — Visualização de estágios (onboarding → ativo → em risco → churned)
- **Dashboard de Retenção** — Painel dedicado com ações pendentes, playbooks, taxas
- **3 Playbooks de Retenção** — Atenção (3 passos), Crítico (5 passos), Reativação (4 passos)

### 🎯 Fase 3: Pipeline de Influenciadores
- **Kanban de Prospecção** — Pipeline visual (Identificado → Pesquisa → Contato → Negociação → Contratado → Ativo)
- **Perfil completo** — Redes sociais, seguidores, nicho, engagement rate
- **Score de Qualificação** — Cálculo automático baseado em 5 fatores
- **Campanhas** — Tracking com código UTM, budget, leads gerados, ROI
- **Negociações** — Timeline de interações com cada influenciador
- **Página de Detalhe** — Visão 360° do influenciador

### 🏆 Fase 4: Gamificação
- **Sistema de Pontos** — Lead convertido (100pts), cliente ativo (200pts), reativação (300pts), meta batida (500pts)
- **Badges** — 🔥 Hot Streak, 🎯 Sniper, 💰 Revenue King, 📈 Growth Hacker, 🤝 Network Master, 🛡️ Retention Shield
- **Streaks** — Dias consecutivos com atividade
- **Leaderboard** — Top 5 assessores no Dashboard

---

## 📦 Como Instalar

### Passo 1: Aplicar as Migrations (Supabase)

No dashboard do Supabase ou via CLI, execute as 4 migrations **na ordem**:

1. `supabase/migrations/20260206000001_macro_events.sql` — Calendário Macro
2. `supabase/migrations/20260206000002_health_score_retention.sql` — Health Score & Retenção
3. `supabase/migrations/20260206000003_influencer_prospecting.sql` — Pipeline de Influenciadores
4. `supabase/migrations/20260206000004_gamification.sql` — Gamificação

### Passo 2: Copiar os arquivos para o projeto

Copie TODOS os arquivos `src/` deste pacote para o projeto, sobrescrevendo os existentes.

### Passo 3: Build & Test

```bash
npm install  # caso tenha dependências novas
npm run build  # verificar que builda sem erros
npm run dev  # testar localmente
```

---

## 📁 Arquivos Novos (25)

### Migrations
- `supabase/migrations/20260206000001_macro_events.sql`
- `supabase/migrations/20260206000002_health_score_retention.sql`
- `supabase/migrations/20260206000003_influencer_prospecting.sql`
- `supabase/migrations/20260206000004_gamification.sql`

### Types
- `src/types/retention.ts`
- `src/types/influencer.ts`
- `src/types/gamification.ts`

### Hooks
- `src/hooks/useDebouncedValue.ts`
- `src/hooks/useMacroEvents.ts`
- `src/hooks/useHealthScore.ts`
- `src/hooks/useRetention.ts`
- `src/hooks/useChurnPrediction.ts`
- `src/hooks/useInfluencers.ts`
- `src/hooks/useInfluencerCampaigns.ts`
- `src/hooks/useInfluencerNegotiations.ts`
- `src/hooks/useGamification.ts`

### Components
- `src/components/shared/ErrorBoundary.tsx`
- `src/components/dashboard/MacroEventsWidget.tsx`
- `src/components/dashboard/LeaderboardWidget.tsx`
- `src/components/clients/HealthScoreBadge.tsx`
- `src/components/clients/LifecycleTimeline.tsx`
- `src/components/influencers/InfluencerCard.tsx`
- `src/components/influencers/InfluencerKanbanColumn.tsx`
- `src/components/influencers/InfluencerFormDialog.tsx`
- `src/components/influencers/CampaignFormDialog.tsx`
- `src/components/influencers/NegotiationFormDialog.tsx`

### Pages
- `src/pages/MacroEventsPage.tsx`
- `src/pages/RetentionDashboardPage.tsx`
- `src/pages/InfluencerPipelinePage.tsx`
- `src/pages/InfluencerDetailPage.tsx`

### Utils
- `src/utils/batchFetch.ts`

## 📝 Arquivos Modificados (9)
- `src/App.tsx` — Novas rotas + QueryClient config + ErrorBoundary
- `src/components/layout/AppSidebar.tsx` — Novos itens no menu
- `src/pages/Dashboard.tsx` — Widgets de Macro Events + Leaderboard
- `src/pages/ClientDetailPage.tsx` — Health Score + Lifecycle + Retenção
- `src/components/clients/ClientsTable.tsx` — Coluna de Health Score
- `src/components/clients/ClientFilters.tsx` — Debounce na busca
- `src/components/leads/LeadFilters.tsx` — Debounce na busca
- `src/hooks/useAlerts.ts` — Fix N+1 queries

---

## ✅ Build Status

- TypeScript (`tsc --noEmit`): **0 erros**
- Vite build: **Sucesso** (12.42s)
- Bundle: 2.9MB (gzip: 819KB) — nota: recomenda-se code splitting futuro

---

*Pacote preparado por Claw 🦞 — Consultoria ZeveHub CRM*
