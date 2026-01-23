
## Problema Identificado

A análise de cohort mostra apenas **2 leads convertidos** quando deveriam aparecer **76** porque:

| Verificação | Valor |
|-------------|-------|
| Leads com status 'convertido' | 76 |
| Clientes com `converted_from_lead_id` preenchido | 2 |
| Leads com `client_id` preenchido | 4 |

A lógica atual no `useFunnelReport.ts` **só conta leads que têm vínculo com cliente** através de `clients.converted_from_lead_id`. A maioria dos leads (74 de 76) foram marcados como "convertido" **antes** do sistema de vinculação existir ou manualmente, sem criar o cliente pelo fluxo correto.

---

## Solução Proposta

Modificar a lógica de cohort para mostrar **todos os leads convertidos**, independentemente de ter vínculo:

### 1. Contar todos os leads convertidos no cohort
- Usar o campo `status = 'convertido'` como base
- Para cálculo de "Convertidos", contar todos os leads convertidos (não apenas os que têm cliente vinculado)

### 2. Calcular retenção apenas para leads vinculados
- A retenção por receita continua sendo calculada apenas para leads que têm cliente vinculado
- Leads sem vínculo aparecem como "convertidos" mas sem dados de retenção

### 3. Adicionar indicador visual
- Mostrar quantos leads convertidos têm vínculo vs. total
- Tooltip explicativo para dados históricos sem rastreamento

---

## Alterações Técnicas

### Arquivo: `src/hooks/useFunnelReport.ts`

**Linha ~400-406** - Modificar contagem de convertidos:

```typescript
// ANTES: Apenas leads convertidos COM cliente vinculado
const convertedLeadsWithClient = leads.filter((lead) => {
  if (lead.status !== 'convertido' || !lead.converted_at) return false;
  const clientId = leadToClient.get(lead.id);
  return !!clientId;
});
const convertedCount = convertedLeadsWithClient.length;

// DEPOIS: Separar contagem total de vinculados
const allConvertedLeads = leads.filter((lead) => 
  lead.status === 'convertido'
);
const convertedLeadsWithClient = allConvertedLeads.filter((lead) => 
  leadToClient.has(lead.id)
);
const totalConverted = allConvertedLeads.length;  // Para exibir
const trackedConverted = convertedLeadsWithClient.length;  // Para retenção
```

**Atualizar interface CohortData:**

```typescript
export interface CohortData {
  cohort: string;
  cohortDate: Date;
  totalLeads: number;
  convertedLeads: number;      // Total de leads convertidos
  trackedLeads: number;        // NOVO: Leads com vínculo ao cliente
  retention: CohortRetention[];
  finalConversionRate: number;
  avgTimeToConvert: number | null;
}
```

**Cálculo de retenção ajustado:**
- Base para % de retenção: `trackedConverted` (leads com cliente vinculado)
- Se `trackedConverted = 0`, mostrar "--" em vez de 0%

### Arquivo: `src/pages/FunnelReportPage.tsx`

**Atualizar heatmap (~linha 554-568):**

```text
| Cohort | Convertidos | Rastreados | Mês 0 | Mês 1 | ... |
|--------|-------------|------------|-------|-------|-----|
| Jan/25 | 15          | 2          | 50%   | 50%   | ... |
```

- Adicionar coluna "Rastreados" para mostrar quantos têm vínculo
- Tooltip: "X de Y leads convertidos possuem cliente vinculado para rastreamento de receita"

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Convertidos: 2 | Convertidos: 76 |
| Retenção baseada em 2 leads | Retenção baseada nos 2 com vínculo |
| Confusão sobre dados | Transparência: "76 convertidos, 2 rastreados" |

---

## Benefícios

1. **Números corretos**: Mostra os 76 leads convertidos reais
2. **Transparência**: Indica claramente quantos têm dados de retenção
3. **Compatibilidade histórica**: Dados antigos sem vínculo são exibidos
4. **Incentivo para usar fluxo correto**: Usuário vê que "rastreados" é baixo e entende a importância
