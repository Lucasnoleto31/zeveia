
# Redesign do Relatório de Leads - Visão por Campanha

## Objetivo
Transformar a página de relatório de leads em uma interface mais intuitiva e focada em campanhas, onde cada campanha é apresentada como um "card resumo" completo, exatamente como o exemplo do usuário:

```
Insta25/01 (Treinamento) - dia 26/01
Captamos 28 leads
Convertemos 3 leads
Perdemos 8
├── Não respondeu: 4
├── Sem interesse: 2
├── Outro: 2
Andamento: 17
```

---

## Nova Estrutura da Página

### 1. Cabeçalho Simplificado
- Título "Relatório de Leads"
- Filtro de período (mantém)
- Botão exportar PDF

### 2. Cards de Resumo Geral (KPIs)
Uma linha com 4 métricas principais:
- Total de Leads
- Convertidos (com %)
- Perdidos (com %)
- Em Andamento

### 3. NOVA SEÇÃO PRINCIPAL: Cards por Campanha
Para cada campanha, um card detalhado mostrando:

```
┌────────────────────────────────────────────────────────────────┐
│ 📢 Insta25/01 (Treinamento)                    26/01/2026    │
│ ─────────────────────────────────────────────────────────────│
│                                                               │
│ 📥 Captamos        │ ✅ Convertidos    │ ❌ Perdidos          │
│     28 leads       │     3 (10.7%)     │     8 (28.6%)        │
│                                                               │
│ 🕐 Em Andamento: 17 leads (60.7%)                            │
│                                                               │
│ ─────────────────────────────────────────────────────────────│
│ Motivos de Perda:                                            │
│ • Não respondeu: 4                                           │
│ • Sem interesse: 2                                           │
│ • Outro: 2                                                   │
│                                                               │
│ Por Origem:                                                  │
│ • Instagram: 20  • Indicação: 5  • Site: 3                   │
└────────────────────────────────────────────────────────────────┘
```

### 4. Gráficos de Evolução
- Manter gráfico de evolução mensal (mais compacto)
- Calendário de performance diária

### 5. Tabelas de Detalhamento
- Ranking de Assessores (compacto)
- Análise de Cohort (colapsável)

---

## Alterações Técnicas

### Arquivo: `src/hooks/useFunnelReport.ts`

**Adicionar novos dados por campanha:**

```typescript
export interface CampaignDetails {
  campaign: string;
  campaignId: string | null;
  firstLeadDate: string;        // Data do primeiro lead
  lastLeadDate: string;         // Data do último lead
  total: number;
  converted: number;
  lost: number;
  inProgress: number;           // leads ativos (não convertidos, não perdidos)
  conversionRate: number;
  lossReasons: { reason: string; count: number }[];
  origins: { origin: string; count: number }[];
  assessors: { assessor: string; count: number; converted: number }[];
}
```

**Calcular detalhes por campanha:**

```typescript
// Agrupar leads por campanha com todos os detalhes
const campaignDetailsMap: Record<string, CampaignDetails> = {};

allLeads.forEach((lead) => {
  const campaignName = lead.campaign?.name || 'Sem campanha';
  // ... agregar dados por campanha
});

// Para cada campanha, calcular:
// - leads em andamento (status != convertido && status != perdido)
// - breakdown de motivos de perda
// - breakdown de origens
// - datas de início/fim da campanha
```

---

### Arquivo: `src/pages/FunnelReportPage.tsx`

**1. Novo componente CampaignCard:**

```typescript
interface CampaignCardProps {
  campaign: CampaignDetails;
}

function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-500" />
            {campaign.campaign}
          </CardTitle>
          <Badge variant="outline">
            {format(parseISO(campaign.firstLeadDate), "dd/MM/yyyy")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grid de métricas */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{campaign.total}</p>
            <p className="text-xs text-muted-foreground">Captados</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{campaign.converted}</p>
            <p className="text-xs text-muted-foreground">Convertidos</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{campaign.lost}</p>
            <p className="text-xs text-muted-foreground">Perdidos</p>
          </div>
        </div>
        
        {/* Em andamento */}
        <div className="flex items-center gap-2 mb-4 p-2 bg-yellow-50 rounded">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span>Em andamento: <strong>{campaign.inProgress}</strong> leads</span>
        </div>
        
        {/* Motivos de perda */}
        {campaign.lossReasons.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Motivos de Perda:</p>
            {campaign.lossReasons.map(lr => (
              <div key={lr.reason} className="flex justify-between text-sm">
                <span>• {lr.reason}</span>
                <span className="text-red-600">{lr.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**2. Reorganizar layout da página:**

```typescript
// Header + Filtros (mais compacto)
// ↓
// KPIs em linha (Total | Convertidos | Perdidos | Andamento)
// ↓
// SEÇÃO: "Performance por Campanha"
// Grid 2 colunas com CampaignCards ordenados por data mais recente
// ↓
// Gráfico de Evolução Mensal (compacto)
// ↓
// Calendário de Performance (colapsável)
// ↓
// Detalhamentos (Assessores, Cohort) - em acordeões colapsáveis
```

**3. Adicionar acordeões colapsáveis:**

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Seções avançadas em acordeões
<Accordion type="multiple" defaultValue={[]}>
  <AccordionItem value="assessores">
    <AccordionTrigger>Performance por Assessor</AccordionTrigger>
    <AccordionContent>
      {/* Tabela de assessores */}
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="cohort">
    <AccordionTrigger>Análise de Cohort</AccordionTrigger>
    <AccordionContent>
      {/* Heatmap de cohort */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## Novo Arquivo: `src/components/reports/CampaignDetailCard.tsx`

Componente reutilizável para exibir detalhes de uma campanha:

```typescript
export interface CampaignCardData {
  campaign: string;
  dateRange: string;
  total: number;
  converted: number;
  lost: number;
  inProgress: number;
  conversionRate: number;
  lossRate: number;
  lossReasons: { reason: string; count: number }[];
  origins: { origin: string; count: number }[];
}
```

---

## Resultado Visual

### Antes (Confuso)
- Múltiplos gráficos pequenos espalhados
- Informação fragmentada
- Difícil ver performance de uma campanha específica

### Depois (Intuitivo)
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Relatório de Leads                    [Período] [Exportar PDF] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 570      │  │ 76       │  │ 142      │  │ 352      │           │
│  │ Captados │  │ Convert. │  │ Perdidos │  │ Andamento│           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  ═══════════════════════════════════════════════════════════════   │
│  📢 Performance por Campanha                                        │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐         │
│  │ Insta25/01 (Trein.)    │  │ Zeve Hub               │         │
│  │ 26/01/2026             │  │ Contínua               │         │
│  │                        │  │                        │         │
│  │ 28 Captados           │  │ 452 Captados          │         │
│  │ 3 Convertidos (10.7%) │  │ 65 Convertidos (14.4%)│         │
│  │ 8 Perdidos            │  │ 120 Perdidos          │         │
│  │ 17 Em andamento       │  │ 267 Em andamento      │         │
│  │                        │  │                        │         │
│  │ Motivos de Perda:      │  │ Motivos de Perda:      │         │
│  │ • Não respondeu: 4     │  │ • Não respondeu: 45    │         │
│  │ • Sem interesse: 2     │  │ • Sem capital: 35      │         │
│  │ • Outro: 2             │  │ • Sem interesse: 40    │         │
│  └─────────────────────────┘  └─────────────────────────┘         │
│                                                                     │
│  [▸ Evolução Mensal]                                               │
│  [▸ Calendário de Performance]                                     │
│  [▸ Performance por Assessor]                                      │
│  [▸ Análise de Cohort]                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Benefícios

1. **Foco em Campanhas**: Cada campanha tem seu card completo com todas as métricas
2. **Visão de Andamento**: Leads em andamento são destacados (não apenas convertidos/perdidos)
3. **Detalhamento de Perdas**: Motivos de perda visíveis em cada campanha
4. **Menos Scroll**: Informações principais no topo, detalhes em acordeões
5. **Formato Intuitivo**: Segue exatamente o modelo mental do usuário ("Captamos X, Convertemos Y, Perdemos Z")
6. **Responsivo**: Grid de cards se adapta a diferentes tamanhos de tela
