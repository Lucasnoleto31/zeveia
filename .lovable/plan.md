

## Exclusao das Paginas: Agenda, Metas, Alertas e Wealth

### Arquivos a deletar

**Paginas:**
- `src/pages/AgendaPage.tsx`
- `src/pages/GoalsPage.tsx`
- `src/pages/AlertsPage.tsx`
- `src/pages/WealthSimulatorPage.tsx`

**Componentes exclusivos dessas paginas:**
- `src/components/alerts/AlertCard.tsx`
- `src/components/alerts/AlertFilters.tsx`
- `src/components/goals/GoalCard.tsx`
- `src/components/goals/GoalFormDialog.tsx`
- `src/components/tasks/CalendarView.tsx` (usado apenas na Agenda)

**Hooks exclusivos:**
- `src/hooks/useGoals.ts`
- `src/hooks/useAlerts.ts`
- `src/hooks/useWealthSimulator.ts`

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Remover imports e rotas de `/agenda`, `/goals`, `/alerts`, `/wealth` |
| `src/components/layout/AppSidebar.tsx` | Remover Agenda, Metas, Alertas e Wealth do menu de navegacao |
| `src/components/layout/Header.tsx` | Remover referencia a `useUnreadAlertsCount` e icone/badge de alertas |
| `src/components/dashboard/TasksWidget.tsx` | Manter (usa tasks que tambem aparecem em LeadDetail e ClientDetail) |

### O que sera preservado
- `src/hooks/useTasks.ts` e componentes `TaskCard`/`TaskFormDialog` - sao usados nas paginas LeadDetail e ClientDetail
- Tabelas no banco de dados permanecem intactas (apenas o frontend e removido)

