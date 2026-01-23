
## Plano: Análise de Cohort com Retenção por Receita

### Problema Identificado

A análise de cohort atual calcula "retenção" baseada apenas no **status do lead**:
- Se o lead não foi marcado como "perdido", ele conta como "retido"
- Isso resulta em 81% de retenção mesmo para leads de Janeiro/2025 que ainda não geraram receita

**Comportamento esperado**: Retenção deveria significar que o cliente convertido **gerou receita** em cada mês subsequente à conversão.

---

### Arquitetura da Solução

1. Vincular leads convertidos aos clientes através de `clients.converted_from_lead_id`
2. Para cada cliente vinculado, verificar em quais meses ele gerou receita (tabela `revenues`)
3. Calcular retenção real: % de clientes do cohort que geraram receita em cada mês

---

### Alterações Técnicas

#### 1. Modificar `useFunnelReport.ts`

**Buscar dados adicionais necessários:**

```typescript
// Buscar clientes convertidos de leads
const { data: clientsFromLeads } = await supabase
  .from('clients')
  .select('id, converted_from_lead_id, created_at')
  .not('converted_from_lead_id', 'is', null);

// Buscar receitas para verificar atividade mensal
const { data: revenuesData } = await supabase
  .from('revenues')
  .select('client_id, date')
  .gte('date', startDateISO.slice(0, 10));
```

**Criar mapa de atividade por cliente/mês:**

```typescript
// Mapear lead -> client
const leadToClient = new Map(
  clientsFromLeads?.map(c => [c.converted_from_lead_id, c.id]) || []
);

// Mapear client -> meses com receita
const clientRevenueMonths = new Map<string, Set<string>>();
revenuesData?.forEach(r => {
  const monthKey = r.date.slice(0, 7); // 'yyyy-MM'
  if (!clientRevenueMonths.has(r.client_id)) {
    clientRevenueMonths.set(r.client_id, new Set());
  }
  clientRevenueMonths.get(r.client_id)!.add(monthKey);
});
```

**Reformular cálculo de retenção:**

```typescript
// Para cada lead convertido, verificar se o cliente gerou receita
leads.forEach((lead) => {
  if (lead.status !== 'convertido') {
    // Leads não convertidos não entram na análise de retenção por receita
    return;
  }
  
  const clientId = leadToClient.get(lead.id);
  if (!clientId) return; // Lead convertido sem cliente vinculado
  
  const revenueMonths = clientRevenueMonths.get(clientId) || new Set();
  const conversionDate = lead.converted_at ? parseISO(lead.converted_at) : null;
  
  // Para cada mês após a conversão, verificar se gerou receita
  for (let m = 0; m <= maxMonths; m++) {
    const checkMonth = addMonths(conversionDate, m);
    const monthKey = format(checkMonth, 'yyyy-MM');
    
    if (revenueMonths.has(monthKey)) {
      retention[m].retained++;
    }
  }
});
```

---

#### 2. Atualizar Interface `CohortRetention`

```typescript
export interface CohortRetention {
  month: number;           // Mês após conversão (0 = mês da conversão)
  converted: number;       // Total de leads convertidos em clientes
  retained: number;        // Clientes que geraram receita neste mês
  retentionRate: number;   // % de retenção (retained / converted * 100)
}
```

---

#### 3. Atualizar Visualização na `FunnelReportPage.tsx`

**Heatmap com nova semântica:**

| Cohort | Convertidos | Mês 0 | Mês 1 | Mês 2 | Mês 3 |
|--------|-------------|-------|-------|-------|-------|
| Jan/25 | 15 | 60% | 53% | 47% | -- |
| Fev/25 | 22 | 72% | 68% | -- | -- |
| Mar/25 | 18 | 55% | -- | -- | -- |

- **Mês 0**: % de clientes que geraram receita no mesmo mês da conversão
- **Mês 1+**: % que continuou gerando receita nos meses seguintes
- **"--"**: Mês ainda não ocorreu (futuro)

---

### Métricas Derivadas

Com a nova lógica, também atualizaremos:

1. **Melhor Cohort**: Cohort com maior retenção no mês 3 (ou último disponível)
2. **Retenção Média 3 Meses**: Média de retenção de todos os cohorts no 3º mês
3. **Churn Rate**: 100% - Retenção (para cada mês)

---

### Tratamento de Edge Cases

1. **Leads convertidos sem cliente vinculado**: Serão ignorados na análise (dados históricos sem vínculo)
2. **Clientes sem receita**: Contarão como "não retidos" em todos os meses
3. **Meses futuros**: Células mostrarão "--" ou ficarão vazias
4. **Cohorts muito recentes**: Mostrarão apenas os meses disponíveis

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useFunnelReport.ts` | Buscar clientes e receitas; reformular cálculo de retenção baseado em receita |
| `src/pages/FunnelReportPage.tsx` | Atualizar labels do heatmap e tooltips para refletir nova semântica |

---

### Benefícios

1. **Métrica real de negócio**: Retenção agora significa "cliente gerando receita"
2. **Identificar problemas de onboarding**: Se muitos convertem mas poucos geram receita no Mês 0
3. **Detectar churn precoce**: Queda de retenção entre Mês 1 e Mês 2
4. **Avaliar qualidade do lead**: Cohorts com alta conversão mas baixa retenção indicam leads de baixa qualidade
